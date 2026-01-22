import os

# محاولة تحميل dotenv (للمحلي فقط)، وتجاهلها في السيرفر
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

class Config:
    # 1. إعدادات الأمان والتطبيق
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-super-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False') == 'True'
    
    # 2. إعدادات JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = 86400

    # 3. إعدادات قاعدة البيانات (Clever Cloud)
    MYSQL_HOST = os.getenv('DB_HOST')
    MYSQL_USER = os.getenv('DB_USER')
    MYSQL_PASSWORD = os.getenv('DB_PASSWORD')
    MYSQL_DB = os.getenv('DB_NAME')
    MYSQL_PORT = int(os.getenv('DB_PORT', 3306))

    # 4. مسارات الملفات
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MODEL_PATH = os.path.join(BASE_DIR, 'models')

    # 5. إعدادات الصور
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    IMG_SIZE = (224, 224)
