import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="d:\\saif\\Banking\\db\\.env")
db_url = os.environ.get("DATABASE_URL")

if not db_url:
    print("Error: DATABASE_URL not found in db/.env")
    exit(1)

CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"""

def setup_database():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Creating users table...")
        cur.execute(CREATE_USERS_TABLE)
        
        print("Database setup complete!")
    except Exception as e:
        print(f"Database error: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    setup_database()
