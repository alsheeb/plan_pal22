import os
import sys
from datetime import timedelta
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from dotenv import load_dotenv
import google.generativeai as genai
# ✅ إضافة المسار الحالي لـ sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

print(f"📁 Current directory: {current_dir}")
print(f"🔍 Python path: {sys.path}")

# ✅ استيرادات بدون 'backend.'
try:
    from config import Config
    print("✅ Config imported successfully")
except ImportError as e:
    print(f"❌ Error importing config: {e}")
    # تكوين افتراضي
    class Config:
        SECRET_KEY = 'dev-secret-key'
        JWT_SECRET_KEY = 'jwt-secret-key'
        JWT_ACCESS_TOKEN_EXPIRES = 3600
        UPLOAD_FOLDER = 'uploads'
        MODEL_PATH = 'models'

try:
    from routes.auth import auth_bp
    print("✅ auth_bp imported successfully")
except ImportError as e:
    print(f"❌ Error importing auth_bp: {e}")
    # إنشاء auth_bp بسيط
    from flask import Blueprint, jsonify
    auth_bp = Blueprint('auth', __name__)
    @auth_bp.route('/test')
    def test():
        return jsonify({'message': 'Auth test'})

try:
    from routes.predict import predict_bp
    print("✅ predict_bp imported successfully")
except ImportError as e:
    print(f"❌ Error importing predict_bp: {e}")
    # إنشاء predict_bp بسيط
    from flask import Blueprint, jsonify
    predict_bp = Blueprint('predict', __name__)
    @predict_bp.route('/test')
    def test():
        return jsonify({'message': 'Predict test'})

try:
    from routes.disease import disease_bp
    print("✅ disease_bp imported successfully")
except ImportError as e:
    print(f"❌ Error importing disease_bp: {e}")
    # إنشاء disease_bp بسيط
    from flask import Blueprint, jsonify
    disease_bp = Blueprint('disease', __name__)
    @disease_bp.route('/test')
    def test():
        return jsonify({'message': 'Disease test'})

def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), '../frontend'),
        static_url_path=''
    )

    app = Flask(__name__, static_folder='../frontend')
    app.config.from_object(Config)

# ✅ ADD THESE
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_HEADER_NAME"] = "Authorization"
    app.config["JWT_HEADER_TYPE"] = "Bearer"
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False

    jwt = JWTManager(app)

    # CORS
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": "*",
                "methods": ["GET", "POST", "PUT", "DELETE"],
                "allow_headers": ["Content-Type", "Authorization"],
            }
        },
    )

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(predict_bp, url_prefix="/api")
    app.register_blueprint(disease_bp, url_prefix="/api")

    # Serve uploaded files
    @app.route("/uploads/<filename>")
    def uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # Frontend
    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        full_path = os.path.join(app.static_folder, path)
        if os.path.exists(full_path):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    # Health check
    @app.route("/api/health")
    def health_check():
        return {
            "status": "healthy",
            "message": "Plant Disease Detection API is running",
        }, 200

    # Test endpoint
    @app.route("/api/test")
    def test():
        return {
            "status": "ok",
            "message": "Test endpoint is working",
            "endpoints": {
                "health": "/api/health",
                "auth": "/api/auth/test",
                "predict": "/api/test",
                "disease": "/api/disease/test"
            }
        }

    return app


# ✅ هذا السطر هو المهم جداً لـ flask run
app = create_app()


# تشغيل مباشر
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🌿 Plant Disease Detection System")
    print("="*60)
    
    # إنشاء المجلدات المطلوبة
    upload_folder = getattr(Config, 'UPLOAD_FOLDER', 'uploads')
    model_path = getattr(Config, 'MODEL_PATH', 'models')
    
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(model_path, exist_ok=True)
    
    print(f"📁 Upload folder: {upload_folder}")
    print(f"🤖 Model folder: {model_path}")
    print(f"🌐 Server: http://localhost:5000")
    print(f"📊 Health check: http://localhost:5000/api/health")
    print("="*60 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=True)
# ✅ إضافة المسار الحالي لـ sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

print(f"📁 Current directory: {current_dir}")
print(f"🔍 Python path: {sys.path}")

# ✅ استيرادات بدون 'backend.'
try:
    from config import Config
    print("✅ Config imported successfully")
except ImportError as e:
    print(f"❌ Error importing config: {e}")
    # تكوين افتراضي
    class Config:
        SECRET_KEY = 'dev-secret-key'
        JWT_SECRET_KEY = 'jwt-secret-key'
        JWT_ACCESS_TOKEN_EXPIRES = 3600
        UPLOAD_FOLDER = 'uploads'
        MODEL_PATH = 'models'

try:
    from routes.auth import auth_bp
    print("✅ auth_bp imported successfully")
except ImportError as e:
    print(f"❌ Error importing auth_bp: {e}")
    # إنشاء auth_bp بسيط
    from flask import Blueprint, jsonify
    auth_bp = Blueprint('auth', __name__)
    @auth_bp.route('/test')
    def test():
        return jsonify({'message': 'Auth test'})

try:
    from routes.predict import predict_bp
    print("✅ predict_bp imported successfully")
except ImportError as e:
    print(f"❌ Error importing predict_bp: {e}")
    # إنشاء predict_bp بسيط
    from flask import Blueprint, jsonify
    predict_bp = Blueprint('predict', __name__)
    @predict_bp.route('/test')
    def test():
        return jsonify({'message': 'Predict test'})

try:
    from routes.disease import disease_bp
    print("✅ disease_bp imported successfully")
except ImportError as e:
    print(f"❌ Error importing disease_bp: {e}")
    # إنشاء disease_bp بسيط
    from flask import Blueprint, jsonify
    disease_bp = Blueprint('disease', __name__)
    @disease_bp.route('/test')
    def test():
        return jsonify({'message': 'Disease test'})

def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), '../frontend'),
        static_url_path=''
    )

    app = Flask(__name__, static_folder='../frontend')
    app.config.from_object(Config)

# ✅ ADD THESE
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_HEADER_NAME"] = "Authorization"
    app.config["JWT_HEADER_TYPE"] = "Bearer"
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False

    jwt = JWTManager(app)

    # CORS
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": "*",
                "methods": ["GET", "POST", "PUT", "DELETE"],
                "allow_headers": ["Content-Type", "Authorization"],
            }
        },
    )

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(predict_bp, url_prefix="/api")
    app.register_blueprint(disease_bp, url_prefix="/api")

    # Serve uploaded files
    @app.route("/uploads/<filename>")
    def uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # Frontend
    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        full_path = os.path.join(app.static_folder, path)
        if os.path.exists(full_path):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    # Health check
    @app.route("/api/health")
    def health_check():
        return {
            "status": "healthy",
            "message": "Plant Disease Detection API is running",
        }, 200

    # Test endpoint
    @app.route("/api/test")
    def test():
        return {
            "status": "ok",
            "message": "Test endpoint is working",
            "endpoints": {
                "health": "/api/health",
                "auth": "/api/auth/test",
                "predict": "/api/test",
                "disease": "/api/disease/test"
            }
            
        }
    

    return app


# ✅ هذا السطر هو المهم جداً لـ flask run
app = create_app()


# تشغيل مباشر
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🌿 Plant Disease Detection System")
    print("="*60)
    
    # إنشاء المجلدات المطلوبة
    upload_folder = getattr(Config, 'UPLOAD_FOLDER', 'uploads')
    model_path = getattr(Config, 'MODEL_PATH', 'models')
    
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(model_path, exist_ok=True)
    
    print(f"Upload folder: {upload_folder}")
    print(f"Model folder: {model_path}")
    print(f"Server: http://localhost:5000")
    print(f"Health check: http://localhost:5000/api/health")
    print("="*60 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=True)