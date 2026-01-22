import os
import numpy as np
import tensorflow as tf
from flask import Blueprint, request, jsonify
from PIL import Image
from backend.config import Config

# ملاحظة: لا نستورد utils.db هنا لأننا لا نحتاج قاعدة البيانات للتنبؤ حالياً
predict_bp = Blueprint('predict', __name__)

# -----------------------------------------------------------
# 1. تحميل الموديل مرة واحدة فقط (Global Scope)
# -----------------------------------------------------------
MODEL = None
try:
    model_path = os.path.join(Config.MODEL_PATH, 'model.weights.h5')
    print(f"🔄 Loading model from: {model_path}")
    
    # تحميل الموديل
    MODEL = tf.keras.models.load_model(model_path)
    print("✅ Model loaded successfully (Global)")
except Exception as e:
    print(f"❌ Error loading model: {e}")

# قائمة أسماء الأمراض (39 صنف)
CLASS_NAMES = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight',
    'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy',
    'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
    'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

def prepare_image(image, target_size):
    """تجهيز الصورة لتتناسب مع مدخلات الموديل"""
    if image.mode != "RGB":
        image = image.convert("RGB")
    image = image.resize(target_size)
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0)
    return image

@predict_bp.route('/predict', methods=['POST'])
def predict():
    # التحقق من تحميل الموديل
    if MODEL is None:
        return jsonify({'error': 'Model not loaded on server'}), 500

    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # 1. معالجة الصورة
        image = Image.open(file)
        processed_image = prepare_image(image, Config.IMG_SIZE)

        # 2. التنبؤ
        predictions = MODEL.predict(processed_image)
        
        # 3. استخراج النتائج
        predicted_class_index = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0]))

        # اسم المرض
        if predicted_class_index < len(CLASS_NAMES):
            predicted_class_name = CLASS_NAMES[predicted_class_index]
        else:
            predicted_class_name = "Unknown"

        # التخمين الثاني
        sorted_indices = np.argsort(predictions[0])[::-1]
        second_class_index = sorted_indices[1]
        second_confidence = float(predictions[0][second_class_index])
        second_class_name = CLASS_NAMES[second_class_index] if second_class_index < len(CLASS_NAMES) else "Unknown"

        # 4. إرجاع النتيجة
        return jsonify({
            'class': predicted_class_name,
            'confidence': confidence,
            'second_guess': second_class_name,
            'second_confidence': second_confidence,
            'description': f"Detected {predicted_class_name}.",
            'treatment': "Consult an expert.",
            'symptoms': "Visible spots on leaves."
        })

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({'error': f"Error processing image: {str(e)}"}), 500
