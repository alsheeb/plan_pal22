import os
import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    verify_jwt_in_request,
)
from werkzeug.utils import secure_filename
from config import Config
from utils.model_loader import plant_model
from utils.db import db

predict_bp = Blueprint("predict", __name__)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'model.weights.h5') # تأكد من اسم الملف

print(f"🔍 Loading model from: {MODEL_PATH}")

# قائمة أنواع النباتات في الداتا سِت (كما في short_name)
PLANT_PREFIXES = [
    "Apple",
    "Blueberry",
    "Cherry",
    "Corn",
    "Grape",
    "Orange",
    "Peach",
    "Pepper, bell",
    "Potato",
    "Raspberry",
    "Soybean",
    "Squash",
    "Strawberry",
    "Tomato",
    "Background",
]


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    )


def split_plant_and_condition(name: str):
    """
    يحوّل short_name مثل:
      "Apple scab"         -> plant="Apple",      condition="scab"
      "Apple healthy"      -> plant="Apple",      condition="healthy"
      "Pepper, bell healthy" -> plant="Pepper, bell", condition="healthy"
      "Background without leaves" -> plant="Background", condition="without leaves"
    """
    if not name:
        return None, None

    s = name.strip()

    for plant in PLANT_PREFIXES:
        if s.lower().startswith(plant.lower()):
            condition = s[len(plant) :].strip()
            if not condition:
                condition = "healthy"
            return plant, condition

    # fallback: أول كلمة = النبات، والباقي = الحالة
    parts = s.split(" ", 1)
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[1].strip()


@predict_bp.route("/predict", methods=["POST"])
def predict():
    try:
        # Optional JWT
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            identity = get_jwt_identity()
            if identity is not None:
                user_id = int(identity)
        except Exception as e:
            print("JWT optional verify failed:", e)
            user_id = None

        print("DEBUG /predict - user_id:", user_id)

        # Validate upload
        if "image" not in request.files:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "No image file provided",
                    }
                ),
                400,
            )

        file = request.files["image"]

        if file.filename == "":
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "No image selected",
                    }
                ),
                400,
            )

        if not allowed_file(file.filename):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid file type. Allowed: image files only",
                    }
                ),
                400,
            )

        # Ensure upload folder
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

        # Unique filename
        ext = file.filename.rsplit(".", 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)

        # Save file
        file.save(filepath)

        # Run model prediction
        prediction = plant_model.predict(filepath)
        print("RAW PREDICTION:", prediction)

        if not prediction.get("success"):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": prediction.get("error", "Prediction failed"),
                    }
                ),
                500,
            )

        raw_class = prediction["predicted_class"]       # ما يرجّعه المودل (Class_30 أو اسم مجلد)
        confidence = float(prediction["confidence"])
        raw_second_guess = prediction.get("second_guess")
        second_confidence = prediction.get("second_confidence")

        # جلب معلومات المرض من قاعدة البيانات إن وُجد
        disease_info = db.get_disease_by_name(raw_class)
        has_details = disease_info is not None

        # اسم يظهر للمستخدم
        display_class = (
            disease_info["short_name"]
            if disease_info and "short_name" in disease_info
            else str(raw_class)
        )

        # تقسيم إلى نبات + حالة
        if disease_info and "short_name" in disease_info:
            plant_name, condition_name = split_plant_and_condition(
                disease_info["short_name"]
            )
        else:
            plant_name, condition_name = split_plant_and_condition(display_class)

        # التخمين الثاني (اختياري)
        display_second_guess = None
        if raw_second_guess:
            second_info = db.get_disease_by_name(raw_second_guess)
            display_second_guess = (
                second_info["short_name"]
                if second_info and "short_name" in second_info
                else str(raw_second_guess)
            )

        # حفظ فقط للمستخدم المسجّل
        if user_id:
            db.save_prediction(
                user_id=user_id,
                image_path=unique_filename,
                predicted_class=display_class,
                confidence=confidence,
            )

            db.save_prediction_history(
                user_id=user_id,
                image_path=unique_filename,
                predicted_class=display_class,
                confidence=confidence,
                second_guess=display_second_guess,
                second_confidence=second_confidence,
            )

        # الاستجابة
        response = {
            "success": True,
            "prediction": {
                "plant": plant_name,           # مثال: "Apple"
                "condition": condition_name,   # مثال: "scab" أو "healthy"
                "class": display_class,        # مثال: "Apple scab"
                "raw_class": raw_class,        # ما يرجّعه المودل فعليًا
                "confidence": confidence,
                "second_guess": display_second_guess,
                "second_confidence": second_confidence,
                "has_details": has_details,
            },
            "disease_info": disease_info,
            "is_guest": user_id is None,
            "image_path": unique_filename,
        }

        return jsonify(response), 200

    except Exception as e:
        print(f"Prediction error: {e}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Server error during prediction",
                }
            ),
            500,
        )


@predict_bp.route("/history", methods=["GET"])
@jwt_required()
def get_history():
    try:
        identity = get_jwt_identity()
        user_id = int(identity) if identity is not None else None
        limit = request.args.get("limit", 20, type=int)

        history = db.get_user_history(user_id, limit)

        return (
            jsonify(
                {
                    "success": True,
                    "history": history if history else [],
                }
            ),
            200,
        )

    except Exception as e:
        print(f"History error: {e}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Failed to fetch history",
                }
            ),
            500,
        )