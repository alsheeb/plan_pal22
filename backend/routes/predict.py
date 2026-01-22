import os
import numpy as np
import tensorflow as tf
from flask import Blueprint, request, jsonify
from PIL import Image
from backend.config import Config

predict_bp = Blueprint('predict', __name__)

# تحميل الموديل مرة واحدة عند التشغيل
try:
    model_path = os.path.join(Config.MODEL_PATH, 'model.weights.h5')
    # بناء الموديل (تأكد أن هذا يطابق هيكلية الموديل الذي دربته)
    # ملاحظة: إذا كان لديك ملف .keras أو .h5 كامل، استخدم load_model مباشرة
    # هنا سنفترض أنك تستخدم load_model الشائع
    # إذا كان الكود السابق يعمل بطريقة معينة، سنحاول محاكاتها، لكن هذا هو الأضمن:
    if os.path.exists(model_path):
        print(f"🔍 Loading model from: {model_path}")
        # محاولة تحميل الموديل (قد تحتاج تعديل حسب طريقة حفظك للموديل)
        # model = tf.keras.models.load_model(model_path) 
        # ولكن بما أن اللوج السابق أظهر نجاح التحميل، سنفترض أن الموديل محمل في app.py أو هنا
        pass 
    else:
        print("⚠️ Model file not found!")
except Exception as e:
    print(f"❌ Error setting up model path: {e}")

# قائمة الأصناف (Classes) - تأكد أنها تطابق الموديل الخاص بك
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

# دالة مساعدة لتجهيز الصورة
def prepare_image(image, target_size):
    if image.mode != "RGB":
        image = image.convert("RGB")
    image = image.resize(target_size)
    image = np.array(image)
    image = np.expand_dims(image, axis=0)
    return image

# تعريف المتغير العالمي للموديل (يتم تحميله فعلياً في app.py أو هنا)
# لتفادي التعقيد، سنعتمد على أن الموديل يتم تحميله داخل الدالة أو هو global
# إذا كان لديك كود تحميل موديل خاص، ضعه هنا.

@predict_bp.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # 1. حفظ الصورة مؤقتاً أو معالجتها في الذاكرة
        image = Image.open(file)
        processed_image = prepare_image(image, Config.IMG_SIZE)

        # 2. تحميل الموديل (يفضل أن يكون محملاً مسبقاً global، لكن للتبسيط هنا)
        # ملاحظة: هذا يعتمد على كيفية تحميلك للموديل سابقاً. 
        # سأفترض أن هناك دالة load_model متاحة أو سنقوم بالتحميل هنا
        model = tf.keras.models.load_model(os.path.join(Config.MODEL_PATH, 'model.weights.h5'))

        # 3. التنبؤ
        predictions = model.predict(processed_image)
        predicted_class_index = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0]))

        # الحصول على اسم المرض
        if predicted_class_index < len(CLASS_NAMES):
            predicted_class_name = CLASS_NAMES[predicted_class_index]
        else:
            predicted_class_name = "Unknown"

        # الحصول على التخمين الثاني (Second Guess)
        sorted_indices = np.argsort(predictions[0])[::-1]
        second_class_index = sorted_indices[1]
        second_confidence = float(predictions[0][second_class_index])
        second_class_name = CLASS_NAMES[second_class_index] if second_class_index < len(CLASS_NAMES) else "Unknown"

        # 4. إرجاع النتيجة (بدون تفاصيل من الداتابيز لأنها فارغة)
        return jsonify({
            'class': predicted_class_name,
            'confidence': confidence,
            'second_guess': second_class_name,
            'second_confidence': second_confidence,
            # بيانات وهمية للتفاصيل حتى تملأ الداتابيز لاحقاً
            'description': 'Description coming soon...',
            'treatment': 'Treatment info coming soon...',
            'symptoms': 'Symptoms info coming soon...'
        })

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({'error': str(e)}), 500
