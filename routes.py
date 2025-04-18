from dotenv import load_dotenv
load_dotenv()
import os
import openai
from openai import OpenAI  # ✅ NEW
from flask import render_template, request, jsonify, redirect, url_for, flash, send_file
from app import app, db
from models import DeletionCertificate, RecyclingCenter
from secure_delete import secure_delete_file, secure_delete_folder
from certificate_generator import generate_certificate
from recycling_centers import find_nearby_centers
import logging
import json
import uuid
from datetime import datetime
import io

openai.api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI()  # ✅ Fixed

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/secure-deletion')
def secure_deletion():
    return render_template('secure_deletion.html')

@app.route('/api/secure-delete', methods=['POST'])
def api_secure_delete():
    try:
        data = request.get_json()
        file_paths = data.get('file_paths', [])
        method = data.get('method', 'standard')
        passes = int(data.get('passes', 1))
        device_type = data.get('device_type', 'Unknown Device')

        deleted_files = []
        for path in file_paths:
            if os.path.isdir(path):
                secure_delete_folder(path, method, passes)
            else:
                secure_delete_file(path, method, passes)
            deleted_files.append(path)

        certificate_id = str(uuid.uuid4())
        verification_code = str(uuid.uuid4())[:8]

        certificate = DeletionCertificate(
            certificate_id=certificate_id,
            device_type=device_type,
            deletion_method=method,
            passes=passes,
            verification_code=verification_code
        )
        db.session.add(certificate)
        db.session.commit()

        return jsonify({
            'success': True,
            'deleted_files': deleted_files,
            'certificate_id': certificate_id
        })
    except Exception as e:
        logging.error(f"Error in secure delete: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/certificate/<certificate_id>')
def view_certificate(certificate_id):
    certificate = DeletionCertificate.query.filter_by(certificate_id=certificate_id).first_or_404()
    return render_template('certificate.html', certificate=certificate)

@app.route('/api/download-certificate/<certificate_id>')
def download_certificate(certificate_id):
    certificate = DeletionCertificate.query.filter_by(certificate_id=certificate_id).first_or_404()
    pdf_bytes = generate_certificate(certificate)
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'data_deletion_certificate_{certificate_id}.pdf'
    )

@app.route('/recycling-centers')
def recycling_centers():
    return render_template('recycling_centers.html')

@app.route('/api/recycling-centers', methods=['POST'])
def api_recycling_centers():
    try:
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        radius = data.get('radius', 10)

        centers = find_nearby_centers(latitude, longitude, radius)

        return jsonify({
            'success': True,
            'centers': centers
        })
    except Exception as e:
        logging.error(f"Error finding recycling centers: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/education')
def education():
    return render_template('education.html')

@app.route('/guide')
def guide():
    return render_template('guide.html')

@app.route('/verify-certificate', methods=['POST'])
def verify_certificate():
    certificate_id = request.form.get('certificate_id')
    verification_code = request.form.get('verification_code')

    certificate = DeletionCertificate.query.filter_by(
        certificate_id=certificate_id,
        verification_code=verification_code
    ).first()

    if certificate:
        return redirect(url_for('view_certificate', certificate_id=certificate_id))
    else:
        flash('Invalid certificate ID or verification code', 'danger')
        return redirect(url_for('index'))

@app.route('/api/assistant', methods=['POST'])
def assistant_api():
    try:
        user_message = request.json.get('message')

        messages = [
            {"role": "system", "content": "You are a friendly AI assistant helping users find e-waste recycling centers and understand secure data deletion."},
            {"role": "user", "content": user_message}
        ]

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=200
        )

        reply = response.choices[0].message.content.strip()
        return jsonify({"response": reply})

    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"}), 500
