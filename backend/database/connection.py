import os
import mysql.connector
from mysql.connector import pooling

_pool = None

def get_pool():
    global _pool
    if _pool is None:
        try:
            # Connect without database first to ensure it exists
            conn = mysql.connector.connect(
                host=os.getenv("MYSQL_HOST", "localhost"),
                user=os.getenv("MYSQL_USER", "root"),
                password=os.getenv("MYSQL_PASSWORD", "raj@123")
            )
            cursor = conn.cursor()
            db_name = os.getenv("MYSQL_DATABASE", "InterviewMindAI")
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name};")
            conn.close()

            # Now create the pool
            _pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="mypool",
                pool_size=5,
                pool_reset_session=True,
                host=os.getenv("MYSQL_HOST", "localhost"),
                user=os.getenv("MYSQL_USER", "root"),
                password=os.getenv("MYSQL_PASSWORD", "raj@123"),
                database=db_name
            )
        except mysql.connector.Error as err:
            print("Error while connecting to MySQL", err)
    return _pool

def get_connection():
    pool = get_pool()
    if pool:
        return pool.get_connection()
    return None
