import mysql.connector
from mysql.connector import Error
from backend.config import Config


class Database:
    """MySQL Database connection and operations"""

    def __init__(self):
        self.connection = None
        self.connect()

    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(
                host=Config.DB_HOST,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
                port=Config.DB_PORT
            )
            if self.connection.is_connected():
                print("✅ Connected to MySQL database")
        except Error as e:
            print(f"❌ Error connecting to MySQL: {e}")
            self.connection = None

    def ensure_connection(self):
        """Ensure connection is alive, reconnect if needed"""
        try:
            if self.connection is None or not self.connection.is_connected():
                self.connect()
        except Error:
            self.connect()

    def execute_query(self, query, params=None, fetch=False, fetch_one=False):
        """Execute a database query"""
        self.ensure_connection()
        cursor = None
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params or ())

            if fetch_one:
                result = cursor.fetchone()
            elif fetch:
                result = cursor.fetchall()
            else:
                self.connection.commit()
                result = cursor.lastrowid

            return result
        except Error as e:
            print(f"❌ Database error: {e}")
            return None
        finally:
            if cursor:
                cursor.close()

    def get_disease_by_name(self, name_or_code):
        """Get disease info from model output or short_name."""
        # Case: integer id passed directly
        if isinstance(name_or_code, int):
            return self.get_disease_by_id(name_or_code)

        if isinstance(name_or_code, str):
            s = name_or_code.strip()

            # Case: "Class_30" -> model index 30 -> diseases1.id = 31 (index + 1)
            if s.lower().startswith("class_"):
                parts = s.split("_", 1)
                if len(parts) == 2 and parts[1].isdigit():
                    idx = int(parts[1])
                    return self.get_disease_by_id(idx + 1)

            # Case: "30" -> use as id
            if s.isdigit():
                return self.get_disease_by_id(int(s))

            # Fallback: match by short_name
            query = """
                SELECT
                    id,
                    short_name,
                    scientific_name,
                    description_en,
                    description_ar,
                    symptoms_en,
                    symptoms_ar,
                    treatment_en,
                    treatment_ar,
                    created_at
                FROM diseases1
                WHERE LOWER(short_name) = LOWER(%s)
            """
            return self.execute_query(query, (s,), fetch_one=True)

        return None

    def get_disease_by_id(self, disease_id):
        """Get disease info by ID"""
        query = """
            SELECT
                id,
                short_name,
                scientific_name,
                description_en,
                description_ar,
                symptoms_en,
                symptoms_ar,
                treatment_en,
                treatment_ar,
                created_at
            FROM diseases1
            WHERE id = %s
        """
        return self.execute_query(query, (disease_id,), fetch_one=True)

    def get_all_diseases(self):
        """Get all diseases"""
        query = """
            SELECT
                id,
                short_name,
                scientific_name,
                description_en,
                description_ar,
                symptoms_en,
                symptoms_ar,
                treatment_en,
                treatment_ar
            FROM diseases1
            ORDER BY short_name
        """
        return self.execute_query(query, fetch=True)

    def get_user_by_email(self, email):
        """Get user by email"""
        query = "SELECT * FROM users WHERE email = %s"
        return self.execute_query(query, (email,), fetch_one=True)

    def get_user_by_id(self, user_id):
        """Get user by ID"""
        query = "SELECT id, full_name, email, role_id, created_at FROM users WHERE id = %s"
        return self.execute_query(query, (user_id,), fetch_one=True)

    def create_user(self, full_name, email, password_hash, role_id=2):
        """Create new user (default role_id=2 for regular user)"""
        query = """
            INSERT INTO users (full_name, email, password_hash, role_id)
            VALUES (%s, %s, %s, %s)
        """
        return self.execute_query(query, (full_name, email, password_hash, role_id))

    def save_prediction(self, user_id, image_path, predicted_class, confidence):
        """Save prediction to predictions table"""
        query = """
            INSERT INTO predictions (user_id, image_path, predicted_class, confidence)
            VALUES (%s, %s, %s, %s)
        """
        return self.execute_query(query, (user_id, image_path, predicted_class, confidence))

    def save_prediction_history(self, user_id, image_path, predicted_class, confidence,
                                second_guess=None, second_confidence=None):
        """Save detailed prediction to prediction_history table"""
        query = """
            INSERT INTO prediction_history
            (user_id, image_path, predicted_class, confidence, second_guess, second_confidence)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        return self.execute_query(query, (
            user_id, image_path, predicted_class, confidence,
            second_guess, second_confidence
        ))

    def get_user_history(self, user_id, limit=20):
        """Get user's prediction history"""
        query = """
            SELECT
                ph.id,
                ph.image_path,
                ph.predicted_class,
                ph.confidence,
                ph.second_guess,
                ph.second_confidence,
                ph.created_at,
                d.scientific_name,
                d.description_en
            FROM prediction_history ph
            LEFT JOIN diseases1 d
                ON LOWER(ph.predicted_class) = LOWER(d.short_name)
            WHERE ph.user_id = %s
            ORDER BY ph.created_at DESC
            LIMIT %s
        """
        return self.execute_query(query, (user_id, limit), fetch=True)

    def close(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("🔌 Database connection closed")


# Global database instance
db = Database()