import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Try to load local .env if it exists
load_dotenv(dotenv_path="../db/.env")
db_url = os.environ.get("DATABASE_URL")

app = FastAPI(title="Nidhi Bank API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Note: passlib.context.CryptContext was causing a 72-byte ValueError with modern bcrypt versions
# We now use the bcrypt library directly.

class UserSignup(BaseModel):
    full_name: str
    email: str
    mobile_number: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TransferRequest(BaseModel):
    sender_id: int
    receiver_email: str
    amount: float
    description: str = "Transfer"

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Nidhi Bank Backend is running"}

@app.post("/api/auth/signup")
def signup(user: UserSignup):
    if not db_url:
        raise HTTPException(status_code=500, detail="Database isn't configured")
        
    try:
        conn = psycopg2.connect(db_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    try:
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Check if exists
        cur.execute("SELECT id FROM users WHERE email = %s OR mobile_number = %s", (user.email, user.mobile_number))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email or Mobile Number already registered")
            
        # Salt is generated automatically in hashpw
        password_bytes = user.password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_pwd = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        cur.execute(
            "INSERT INTO users (full_name, email, mobile_number, password_hash) VALUES (%s, %s, %s, %s) RETURNING id, full_name, email, mobile_number",
            (user.full_name, user.email, user.mobile_number, hashed_pwd)
        )
        new_user = cur.fetchone()
        return {"message": "Account created successfully!", "user": new_user}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/api/auth/signin")
def signin(user: UserLogin):
    if not db_url:
        raise HTTPException(status_code=500, detail="Database isn't configured")
        
    try:
        conn = psycopg2.connect(db_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, full_name, email, password_hash FROM users WHERE email = %s", (user.email,))
        db_user = cur.fetchone()
        
        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        password_bytes = user.password.encode('utf-8')
        db_hash_bytes = db_user["password_hash"].encode('utf-8')
        
        if not bcrypt.checkpw(password_bytes, db_hash_bytes):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        return {"message": "Login successful", "user": {"id": db_user["id"], "full_name": db_user["full_name"], "email": db_user["email"]}}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/api/dashboard/summary/{user_id}")
def get_summary(user_id: int):
    if not db_url:
        raise HTTPException(status_code=500, detail="Database isn't configured")
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get balance
        cur.execute("SELECT balance, email FROM users WHERE id = %s", (user_id,))
        user_info = cur.fetchone()
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Get last 5 transactions
        cur.execute("""
            SELECT t.*, 
                   u_s.email as sender_email, 
                   u_r.email as receiver_email
            FROM transactions t
            LEFT JOIN users u_s ON t.sender_id = u_s.id
            LEFT JOIN users u_r ON t.receiver_id = u_r.id
            WHERE t.sender_id = %s OR t.receiver_id = %s
            ORDER BY t.created_at DESC
            LIMIT 5
        """, (user_id, user_id))
        transactions = cur.fetchall()
        
        return {
            "balance": float(user_info["balance"]),
            "email": user_info["email"],
            "transactions": transactions
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/api/users")
def list_users():
    if not db_url:
        raise HTTPException(status_code=500, detail="Database isn't configured")
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT id, full_name, email, mobile_number, balance, created_at FROM users ORDER BY created_at DESC")
        users = cur.fetchall()
        
        # Convert balance to float for JSON serialization
        for u in users:
            u["balance"] = float(u["balance"])
            
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/api/transactions/transfer")
def transfer_funds(req: TransferRequest):
    if not db_url:
        raise HTTPException(status_code=500, detail="Database isn't configured")
    
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
        
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Check sender balance
        cur.execute("SELECT balance FROM users WHERE id = %s", (req.sender_id,))
        sender = cur.fetchone()
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")
        
        if float(sender["balance"]) < req.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
            
        # 2. Check receiver exists
        cur.execute("SELECT id FROM users WHERE email = %s", (req.receiver_email,))
        receiver = cur.fetchone()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver email not registered")
            
        if receiver["id"] == req.sender_id:
            raise HTTPException(status_code=400, detail="Cannot transfer to yourself")

        # 3. Perform transfer via SQL Transaction
        cur.execute("BEGIN;")
        try:
            # Deduct from sender
            cur.execute("UPDATE users SET balance = balance - %s WHERE id = %s", (req.amount, req.sender_id))
            # Add to receiver
            cur.execute("UPDATE users SET balance = balance + %s WHERE id = %s", (req.amount, receiver["id"]))
            # Log transaction
            cur.execute("""
                INSERT INTO transactions (sender_id, receiver_id, amount, type, description)
                VALUES (%s, %s, %s, 'transfer', %s)
            """, (req.sender_id, receiver["id"], req.amount, req.description))
            cur.execute("COMMIT;")
        except Exception as e:
            cur.execute("ROLLBACK;")
            raise e
            
        return {"message": "Transfer successful!"}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
