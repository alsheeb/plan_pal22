import os
from dotenv import load_dotenv


load_dotenv()

class Config:
    """Application configuration settings"""
    SQLALCHEMY_DATABASE_URI = 'sqlite:///plant_pal.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key')
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    # Flask Settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-super-secret-key-change-in-production')
    DEBUG = True
    
    # JWT Settings
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds
    
    # MySQL Database Settings
    MYSQL_HOST = os.environ.get('DB_HOST', 'localhost')
    MYSQL_USER = os.environ.get('DB_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('DB_PASSWORD', '')
    MYSQL_DB = os.environ.get('DB_NAME', 'plant_pal_db')
    MYSQL_PORT = int(os.environ.get('DB_PORT', 3306))
    
    # Model Settings
    MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models')
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Image Settings
    IMG_SIZE = (224, 224)