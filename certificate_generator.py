from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from io import BytesIO
import qrcode
from PIL import Image
import logging
import io
import datetime
import os

def generate_certificate(certificate_data):
    """
    Generate a PDF certificate of secure deletion
    
    Parameters:
    certificate_data: DeletionCertificate object with the deletion details
    
    Returns:
    BytesIO: PDF document as bytes
    """
    logging.info(f"Generating certificate for: {certificate_data.certificate_id}")
    
    try:
        # Create a BytesIO buffer to receive PDF data
        buffer = BytesIO()
        
        # Create the PDF object, using BytesIO as its "file"
        pdf = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Set up the PDF document
        pdf.setTitle(f"Data Deletion Certificate - {certificate_data.certificate_id}")
        
        # Add certificate header
        pdf.setFont("Helvetica-Bold", 24)
        pdf.drawCentredString(width/2, height-50, "Certificate of Secure Data Deletion")
        
        # Add logo or icon (in a real app)
        # We'll use a placeholder rectangle for now
        pdf.setStrokeColor(colors.darkgreen)
        pdf.setFillColor(colors.darkgreen)
        pdf.rect(width/2-50, height-120, 100, 50, fill=1)
        
        # Add certificate information
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(50, height-150, "Certificate Details:")
        
        pdf.setFont("Helvetica", 12)
        y_position = height-180
        line_height = 20
        
        info_lines = [
            f"Certificate ID: {certificate_data.certificate_id}",
            f"Device Type: {certificate_data.device_type}",
            f"Deletion Method: {certificate_data.deletion_method}",
            f"Number of Passes: {certificate_data.passes}",
            f"Date of Deletion: {certificate_data.deletion_date.strftime('%Y-%m-%d %H:%M:%S UTC')}",
            f"Verification Code: {certificate_data.verification_code}"
        ]
        
        for line in info_lines:
            pdf.drawString(70, y_position, line)
            y_position -= line_height
        
        # Add verification information
        y_position -= 30
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(50, y_position, "Verification:")
        
        y_position -= line_height
        pdf.setFont("Helvetica", 12)
        pdf.drawString(70, y_position, "To verify this certificate, visit:")
        
        y_position -= line_height
        verification_url = f"https://ewaste-recycler.com/verify"
        pdf.drawString(70, y_position, verification_url)
        
        # Generate QR code for verification
        y_position -= 30
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(f"{verification_url}?id={certificate_data.certificate_id}")
        qr.make(fit=True)
        
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_bytes = BytesIO()
        qr_img.save(qr_bytes, format='PNG')
        qr_bytes.seek(0)
        
        # We can't directly use the PIL image with reportlab, so we'll skip the QR code in this example
        # In a real implementation, we would convert and add the QR code to the PDF
        
        # Add footer with legal disclaimer
        pdf.setFont("Helvetica-Italic", 8)
        footer_text = "This certificate confirms that the data on the specified device has been securely deleted using industry-standard methods. The device owner is responsible for ensuring all valuable data was backed up prior to deletion. E-Waste Recycler assumes no liability for data loss."
        
        # Wrap the footer text to fit page width
        footer_y = 50
        text_object = pdf.beginText(50, footer_y)
        text_object.setFont("Helvetica-Italic", 8)
        
        # Simple text wrapping
        words = footer_text.split()
        line = ""
        for word in words:
            if len(line + word) < 90:  # Approximate characters per line
                line += word + " "
            else:
                text_object.textLine(line)
                line = word + " "
        
        if line:
            text_object.textLine(line)
            
        pdf.drawText(text_object)
        
        # Finalize the PDF
        pdf.showPage()
        pdf.save()
        
        # Get the PDF value from the BytesIO buffer and return it
        buffer.seek(0)
        return buffer.getvalue()
        
    except Exception as e:
        logging.error(f"Error generating certificate: {str(e)}")
        raise e
