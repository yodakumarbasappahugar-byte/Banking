import os
import psycopg2
import bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='d:\\saif\\Banking\\db\\.env')
db_url = os.environ.get('DATABASE_URL')

if not db_url:
    print("Error: DATABASE_URL not found")
    exit(1)

mock_users = [
    ("Nidhi Sharma", "nidhi.sharma@nidhi.bank", "9876543201", 50000.00),
    ("Arnav Singh", "arnav.singh@gmail.com", "9876543202", 12500.50),
    ("Priya Verma", "priya.v@test.com", "9876543203", 8940.00),
    ("Rohan Das", "rohan.das@company.co", "9876543204", 420.75),
    ("Sana Khan", "sana.kh@xyz.in", "9876543205", 15200.00),
    ("Vikram Malhotra", "vikram.m@bank.com", "9876543206", 98700.12),
    ("Ananya Roy", "ananya.roy@outlook.com", "9876543207", 2500.00),
    ("Kabir Mehra", "kabir.m@gmail.com", "9876543208", 310.50),
    ("Ishita Gupta", "ishita.g@bank.com", "9876543209", 12000.00),
    ("Sameer Jain", "sameer.j@test.in", "9876543210", 7500.40)
]

def populate():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        password = "password123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        print("Inserting mock users...")
        for name, email, mobile, balance in mock_users:
            try:
                cur.execute("""
                    INSERT INTO users (full_name, email, mobile_number, password_hash, balance)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (email) DO NOTHING
                """, (name, email, mobile, hashed, balance))
            except Exception as e:
                print(f"Skipping {email}: {e}")
                
        conn.commit()
        print("Population complete!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    populate()
