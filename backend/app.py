import os
import sys
import types
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import mysql.connector

# ---------------------------------------------------
# 1. إصلاح مسارات الاستيراد (The Sys Path Hack)
# ---------------------------------------------------
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# خدعة لإيهام بايثون بوجود موديول backend
if 'backend' not in sys.modules:
    backend_module = types.ModuleType('backend')
    backend_module.__path__ = [current_dir]
    sys.modules['backend'] = backend_module

# ---------------------------------------------------
# 2. الاستيرادات
# ---------------------------------------------------
try:
    from backend.config import Config
    from backend.routes.auth import auth_bp
    from backend.routes.predict import predict_bp
    from backend.routes.disease import disease_bp
except ImportError:
    # محاولة بديلة في حالة التشغيل المحلي
    from config import Config
    from routes.auth import auth_bp
    from routes.predict import predict_bp
    from routes.disease import disease_bp

# ---------------------------------------------------
# 3. دالة تهيئة قاعدة البيانات (إنشاء الجداول)
# ---------------------------------------------------
def init_db():
    """تقوم بإنشاء الجداول الضرورية في MySQL إذا لم تكن موجودة"""
    try:
        conn = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DB,
            port=Config.MYSQL_PORT
        )
        cursor = conn.cursor()
        
        # 1. إنشاء جدول المستخدمين
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 2. إنشاء جدول التنبؤات (History)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                image_path VARCHAR(500),
                disease_name VARCHAR(255),
                confidence FLOAT,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Database tables initialized successfully (MySQL).")
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize DB tables: {e}")

# ---------------------------------------------------
# 4. إعداد التطبيق
# ---------------------------------------------------
def create_app():
    # محاولة تحديد مكان مجلد الواجهة الأمامية (Frontend)
    parent_dir = os.path.dirname(current_dir)
    frontend_dist = os.path.join(parent_dir, 'frontend')
    
    app = Flask(__name__, static_folder=frontend_dist, static_url_path='')
    app.config.from_object(Config)

    # تهيئة JWT
    jwt = JWTManager(app)

    # تهيئة CORS
    CORS(app, resources={r"/*": {"origins": "*"}})

    # تهيئة الجداول عند بدء التشغيل
    init_db()

    # تسجيل المسارات (Blueprints)
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(predict_bp, url_prefix="/api")
    app.register_blueprint(disease_bp, url_prefix="/api")

    # مسار الصور (الجديد)
    @app.route("/backend/uploads/<filename>")
    def uploaded_file_new(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # مسار الصور (القديم - للدعم)
    @app.route("/uploads/<filename>")
    def uploaded_file_old(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    @app.route("/api/health")
    def health_check():
        return jsonify({"status": "healthy", "db": "MySQL Cloud"}), 200

    @app.route("/")
    def index():
        return jsonify({"message": "Plant Pal API is Running on Clever Cloud DB!"})

    return app

app = create_app()

if __name__ == "__main__":
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    app.run(host="0.0.0.0", port=5000)
