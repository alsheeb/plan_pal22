from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.utils.db import get_db_connection  # استدعاء الاتصال من الملف الموحد

disease_bp = Blueprint('disease', __name__)

# ---------------------------------------------------
# 1. حفظ نتيجة الفحص (Save Result)
# ---------------------------------------------------
@disease_bp.route('/save_result', methods=['POST'])
@jwt_required()
def save_result():
    try:
        user_id = get_jwt_identity()  # الحصول على ID المستخدم من التوكن
        data = request.json
        
        disease_name = data.get('disease_name')
        confidence = data.get('confidence')
        image_path = data.get('image_path')

        if not disease_name or not image_path:
            return jsonify({"error": "Missing data"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        
        # MySQL Query (نستخدم %s بدلاً من ?)
        query = """
            INSERT INTO history (user_id, disease_name, confidence, image_path)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (user_id, disease_name, confidence, image_path))
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Result saved successfully"}), 201

    except Exception as e:
        print(f"Error saving result: {e}")
        return jsonify({"error": "Failed to save result"}), 500

# ---------------------------------------------------
# 2. جلب سجل المستخدم (Get User History)
# ---------------------------------------------------
@disease_bp.route('/history', methods=['GET'])
@jwt_required()
def get_user_history():
    try:
        user_id = get_jwt_identity()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        # dictionary=True مهمة جداً لترجع البيانات بشكل {key: value}
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT * FROM history WHERE user_id = %s ORDER BY date DESC"
        cursor.execute(query, (user_id,))
        results = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(results), 200

    except Exception as e:
        print(f"Error fetching history: {e}")
        return jsonify({"error": "Failed to fetch history"}), 500
