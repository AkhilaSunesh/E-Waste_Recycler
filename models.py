from app import db
from datetime import datetime

class DeletionCertificate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    certificate_id = db.Column(db.String(64), unique=True, nullable=False)
    device_type = db.Column(db.String(64), nullable=False)
    deletion_method = db.Column(db.String(64), nullable=False)
    passes = db.Column(db.Integer, nullable=False)
    deletion_date = db.Column(db.DateTime, default=datetime.utcnow)
    verification_code = db.Column(db.String(64), nullable=False)
    
    def __repr__(self):
        return f'<Certificate {self.certificate_id}>'

class RecyclingCenter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    address = db.Column(db.String(256), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    phone = db.Column(db.String(20))
    website = db.Column(db.String(256))
    materials_accepted = db.Column(db.String(512))
    hours = db.Column(db.String(256))
    
    def __repr__(self):
        return f'<RecyclingCenter {self.name}>'
