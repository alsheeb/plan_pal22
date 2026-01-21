import os
import sys
import types # <--- مكتبة مهمة للخدعة
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# ---------------------------------------------------
# 1. إعداد المسارات (The Magic Fix)
# ---------------------------------------------------
# الحصول على المسار الحالي
current_dir = os.path.dirname(os.path.abspath(__file__))

# إضافة المسار الحالي إلى sys.path
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# 🔥 الخدعة السحرية: إيهام البايثون بوجود مكتبة اسمها backend 🔥
# هذا يحل مشكلة "No module named 'backend'" داخل ملفات routes
if 'backend' not in sys.modules:
    # إنشاء موديول وهمي باسم backend
    backend_module = types.ModuleType('backend')
    # توجيه مساره إلى المجلد الحالي
    backend_module.__path__ = [current_dir]
    # تسجيله في النظام
    sys.modules['backend'] = backend_module

# ---------------------------------------------------
# 2. الاستيرادات (الآن ستعمل بنجاح بإذن الله)
# ---------------------------------------------------
# استيراد Config
try:
    from config import Config
except ImportError:
    from backend.config import Config

# استيراد الـ Blueprints
# الآن حتى لو كانت الملفات تستخدم "from backend.routes import..." ستعمل!
try:
    from routes.auth import auth_bp
    from routes.predict import predict_bp
    from routes.disease import disease_bp
except ImportError as e:
    print(f"⚠️ Warning: Import failed directly: {e}")
    # محاولة بديلة
    from backend.routes.auth import auth_bp
    from backend.routes.predict import predict_bp
    from backend.routes.disease import disease_bp

# ---------------------------------------------------
# 3. دالة بناء التطبيق
# ---------------------------------------------------
def create_app():
    # محاولة تحديد مكان مجلد الفرونت إند بذكاء
    # نبحث عنه في المجلد الأب
    parent_dir = os.path.dirname(current_dir)
    frontend_dist = os.path.join(parent_dir, 'frontend')
    
    app = Flask(__name__, static_folder=frontend_dist, static_url_path='')
    
    app.config.from_object(Config)

    # إعدادات JWT
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_HEADER_NAME"] = "Authorization"
    app.config["JWT_HEADER_TYPE"] = "Bearer"
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False

    jwt = JWTManager(app)

    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # تسجيل المسارات
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(predict_bp, url_prefix="/api")
    app.register_blueprint(disease_bp, url_prefix="/api")

    @app.route("/uploads/<filename>")
    def uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    @app.route("/api/health")
    def health_check():
        return jsonify({
            "status": "healthy", 
            "message": "API is running perfectly",
            "modules": {
                "auth": "loaded",
                "predict": "loaded",
                "disease": "loaded"
            }
        }), 200

    @app.route("/")
    def index():
        return jsonify({"message": "Plant Pal API Backend is Live!"})

    return app

# تشغيل التطبيق
app = create_app()

if __name__ == "__main__":
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.MODEL_PATH, exist_ok=True)
    app.run(host="0.0.0.0", port=5000, debug=True)