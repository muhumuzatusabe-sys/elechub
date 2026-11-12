import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'elechub-default-secret-key-change-me')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '12345678910')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "elechub.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads', 'candidates')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
    
    # App Name
    APP_NAME = "ELECHUB"
    APP_TAGLINE = "Campus Campaign Season Command Center"

    # Africa's Talking SMS Gateway
    AFRICA_TALKING_USERNAME = os.environ.get('AFRICA_TALKING_USERNAME', 'sandbox')
    AFRICA_TALKING_API_KEY = os.environ.get('AFRICA_TALKING_API_KEY', '')
    AFRICA_TALKING_SENDER_ID = os.environ.get('AFRICA_TALKING_SENDER_ID', '')

    # Module 3: Bulk Email Gateway (Flask-Mail over SMTP)
    # Default: Gmail or Zoho SMTP (personal account ~500/day limit)
    # NOTE: When email volume grows past personal SMTP limits, swap MAIL_SERVER to
    # smtp.sendgrid.net (port 587) or smtp.mailgun.org (port 587) with appropriate API keys.
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() in ['true', '1', 'yes']
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'False').lower() in ['true', '1', 'yes']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@elechub.campus.ac.ug')
