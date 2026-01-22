import mysql.connector
from backend.config import Config

def get_db_connection():
    """
    إنشاء اتصال جديد بقاعدة بيانات MySQL
    """
    try:
        conn = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DB,
            port=Config.MYSQL_PORT
        )
        return conn
    except mysql.connector.Error as err:
        print(f"❌ Error connecting to MySQL: {err}")
        return None
