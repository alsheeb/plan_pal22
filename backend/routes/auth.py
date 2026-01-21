import sqlite3
import os
import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)
import mysql.connector
from backend.config import Config  # استدعاء ملف الكونفيج المعدل

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=Config.MYSQL_HOST,      # يأخذ القيمة من Config
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DB,
            port=Config.MYSQL_PORT
        )
        return connection
    except mysql.connector.Error as err:
        print(f"❌ Error connecting to DB: {err}")
        return None


print(f"📂 Auth Database Path: {DB_FILE}")

# --- دالة مساعدة للاتصال بقاعدة البيانات ---
def get_db_connection():
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row # لتمكين الوصول للأعمدة بالاسم
        return conn
    except Exception as e:
        print(f"❌ Database Connection Error: {e}")
        return None

# --- إنشاء الجدول تلقائياً عند تشغيل السيرفر ---
def init_db():
    try:
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL
                )
            ''')
            conn.commit()
            conn.close()
            print("✅ Users table initialized successfully.")
    except Exception as e:
        print(f"❌ Database Init Error: {e}")

init_db()

# --- مسار التسجيل (Register) ---
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')

    if not all([full_name, email, password]):
        return jsonify({"success": False, "message": "Missing fields"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database error"}), 500

    try:
        cursor = conn.cursor()
        
        # التحقق من وجود الإيميل
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"success": False, "message": "Email already exists"}), 409

        # تشفير كلمة المرور
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # إضافة المستخدم
        cursor.execute("INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
                       (full_name, email, hashed_pw))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()

        # إنشاء توكن
        access_token = create_access_token(identity=str(user_id))

        return jsonify({
            "success": True, 
            "message": "User registered",
            "access_token": access_token,
            "user": {"full_name": full_name, "email": email}
        }), 201

    except Exception as e:
        print(f"Register Error: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

# --- مسار تسجيل الدخول (Login) ---
@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database error"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, full_name, password FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()

        if user:
            # التحقق من الباسورد
            stored_pw = user['password'] # لأننا استخدمنا sqlite3.Row
            if bcrypt.checkpw(password.encode('utf-8'), stored_pw):
                access_token = create_access_token(identity=str(user['id']))
                return jsonify({
                    "success": True,
                    "access_token": access_token,
                    "user": {"full_name": user['full_name'], "email": email}
                }), 200

        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500