from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
import bcrypt
from utils.db import db

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["full_name", "email", "password"]
        for field in required_fields:
            if not data.get(field):
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": f"{field} is required",
                        }
                    ),
                    400,
                )

        full_name = data["full_name"].strip()
        email = data["email"].strip().lower()
        password = data["password"]

        # Validate email format
        if "@" not in email or "." not in email:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid email format",
                    }
                ),
                400,
            )

        # Validate password length
        if len(password) < 6:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Password must be at least 6 characters",
                    }
                ),
                400,
            )

        # Check if user already exists
        existing_user = db.get_user_by_email(email)
        if existing_user:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Email already registered",
                    }
                ),
                409,
            )

        # Hash password
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        # Create user
        user_id = db.create_user(full_name, email, password_hash)

        if user_id:
            # Create access token (identity must be string)
            access_token = create_access_token(identity=str(user_id))

            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Registration successful",
                        "user": {
                            "id": user_id,
                            "full_name": full_name,
                            "email": email,
                        },
                        "access_token": access_token,
                    }
                ),
                201,
            )
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Failed to create user",
                    }
                ),
                500,
            )

    except Exception as e:
        print(f"Registration error: {e}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Server error",
                }
            ),
            500,
        )


@auth_bp.route("/login", methods=["POST"])
def login():
    """Login user"""
    try:
        data = request.get_json()

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Email and password are required",
                    }
                ),
                400,
            )

        # Get user by email
        user = db.get_user_by_email(email)

        if not user:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid email or password",
                    }
                ),
                401,
            )

        # Verify password
        if not bcrypt.checkpw(
            password.encode("utf-8"),
            user["password_hash"].encode("utf-8"),
        ):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid email or password",
                    }
                ),
                401,
            )

        # Create access token (identity must be string)
        access_token = create_access_token(identity=str(user["id"]))

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Login successful",
                    "user": {
                        "id": user["id"],
                        "full_name": user["full_name"],
                        "email": user["email"],
                    },
                    "access_token": access_token,
                }
            ),
            200,
        )

    except Exception as e:
        print(f"Login error: {e}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Server error",
                }
            ),
            500,
        )


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Get current logged in user info"""
    try:
        identity = get_jwt_identity()
        user_id = int(identity) if identity is not None else None

        if user_id is None:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid token",
                    }
                ),
                401,
            )

        user = db.get_user_by_id(user_id)

        if user:
            return (
                jsonify(
                    {
                        "success": True,
                        "user": user,
                    }
                ),
                200,
            )
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "User not found",
                    }
                ),
                404,
            )

    except Exception as e:
        print(f"Get user error: {e}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Server error",
                }
            ),
            500,
        )


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    return (
        jsonify(
            {
                "success": True,
                "message": "Logged out successfully",
            }
        ),
        200,
    )