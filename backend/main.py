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
    role: str = "user"

class UserLogin(BaseModel):
    email: str
    password: str

class TransferRequest(BaseModel):
    sender_id: int
    receiver_email: str
    amount: float
    description: str = "Transfer"

class PasswordChangeRequest(BaseModel):
    user_id: int
    current_password: str
    new_password: str

class UserAdminCreate(BaseModel):
    full_name: str
    email: str
    mobile_number: str
    password: str
    balance: float = 0.0
    role: str = "user"

class UserUpdate(BaseModel):
    full_name: str
    email: str
    mobile_number: str
    balance: float
    role: str = "user"

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
            "INSERT INTO users (full_name, email, mobile_number, password_hash, role) VALUES (%s, %s, %s, %s, %s) RETURNING id, full_name, email, mobile_number, role",
            (user.full_name, user.email, user.mobile_number, hashed_pwd, user.role)
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
        cur.execute("SELECT id, full_name, email, password_hash, role FROM users WHERE email = %s", (user.email,))
        db_user = cur.fetchone()
        
        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        password_bytes = user.password.encode('utf-8')
        db_hash_bytes = db_user["password_hash"].encode('utf-8')
        
        if not bcrypt.checkpw(password_bytes, db_hash_bytes):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        return {"message": "Login successful", "user": {"id": db_user["id"], "full_name": db_user["full_name"], "email": db_user["email"], "role": db_user["role"]}}
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

@app.get("/api/admin/branch-stats")
def get_branch_stats():
    if not db_url:
        raise HTTPException(status_code=500, detail="Database isn't configured")
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Total User Count
        cur.execute("SELECT COUNT(*) as total_users FROM users")
        total_users = cur.fetchone()["total_users"]
        
        # 2. Total Branch Balance
        cur.execute("SELECT SUM(balance) as total_balance FROM users")
        total_balance = float(cur.fetchone()["total_balance"] or 0)
        
        # 3. Total Transactions Today
        cur.execute("SELECT COUNT(*) as transactions_today FROM transactions WHERE DATE(created_at) = CURRENT_DATE")
        transactions_today = cur.fetchone()["transactions_today"]
        
        # 4. Recent Global Transactions (last 5)
        cur.execute("""
            SELECT t.*, u_s.full_name as sender_name, u_r.full_name as receiver_name 
            FROM transactions t
            LEFT JOIN users u_s ON t.sender_id = u_s.id
            LEFT JOIN users u_r ON t.receiver_id = u_r.id
            ORDER BY t.created_at DESC LIMIT 5
        """)
        recent_global_transactions = cur.fetchall()
        
        return {
            "total_users": total_users,
            "total_balance": total_balance,
            "transactions_today": transactions_today,
            "recent_transactions": recent_global_transactions
        }
    except Exception as e:
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
        
        cur.execute("SELECT id, full_name, email, mobile_number, balance, role, created_at FROM users ORDER BY created_at DESC")
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

@app.post("/api/users")
def admin_create_user(user: UserAdminCreate):
    if not db_url:
        raise HTTPException(status_code=500, detail="Database isn't configured")
        
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if exists
        cur.execute("SELECT id FROM users WHERE email = %s OR mobile_number = %s", (user.email, user.mobile_number))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email or Mobile Number already registered")
            
        password_bytes = user.password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_pwd = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        cur.execute(
            "INSERT INTO users (full_name, email, mobile_number, password_hash, balance, role) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, full_name, email, mobile_number, balance, role",
            (user.full_name, user.email, user.mobile_number, hashed_pwd, user.balance, user.role)
        )
        new_user = cur.fetchone()
        new_user["balance"] = float(new_user["balance"])
        return {"message": "User created successfully!", "user": new_user}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.put("/api/users/{user_id}")
def update_user(user_id: int, user: UserUpdate):
    if not db_url:
        raise HTTPException(status_code=500, detail="Database isn't configured")
        
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            "UPDATE users SET full_name = %s, email = %s, mobile_number = %s, balance = %s, role = %s WHERE id = %s RETURNING id, full_name, email, mobile_number, balance, role",
            (user.full_name, user.email, user.mobile_number, user.balance, user.role, user_id)
        )
        updated_user = cur.fetchone()
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
            
        updated_user["balance"] = float(updated_user["balance"])
        return {"message": "User updated successfully!", "user": updated_user}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):
    if not db_url:
        raise HTTPException(status_code=500, detail="Database isn't configured")
        
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Also delete transactions associated with this user
        cur.execute("DELETE FROM transactions WHERE sender_id = %s OR receiver_id = %s", (user_id, user_id))
        cur.execute("DELETE FROM users WHERE id = %s RETURNING id", (user_id,))
        deleted = cur.fetchone()
        
        if not deleted:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"message": "User and associated transactions deleted successfully!"}
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

        # Daily Limits Check (2.5 Lakhs Sent/Received per day)
        cur.execute("""
            SELECT COALESCE(SUM(amount), 0) as daily_sent
            FROM transactions
            WHERE sender_id = %s AND DATE(created_at) = CURRENT_DATE
        """, (req.sender_id,))
        daily_sent = float(cur.fetchone()["daily_sent"])
        if daily_sent + req.amount > 250000:
            raise HTTPException(status_code=400, detail="Daily sending limit of ₹2,50,000 exceeded. Please wait until tomorrow.")
            
        cur.execute("""
            SELECT COALESCE(SUM(amount), 0) as daily_received
            FROM transactions
            WHERE receiver_id = %s AND DATE(created_at) = CURRENT_DATE
        """, (receiver["id"],))
        daily_received = float(cur.fetchone()["daily_received"])
        if daily_received + req.amount > 250000:
            raise HTTPException(status_code=400, detail="Receiver's daily receiving limit of ₹2,50,000 exceeded. Please wait until tomorrow.")

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

@app.post("/api/auth/password/update")
def update_password(req: PasswordChangeRequest):
    if not db_url:
        raise HTTPException(status_code=500, detail="Database isn't configured")
        
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Fetch user to verify current password
        cur.execute("SELECT password_hash FROM users WHERE id = %s", (req.user_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # 2. Verify current password
        if not bcrypt.checkpw(req.current_password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Incorrect current password")
            
        # 3. Hash and update new password
        salt = bcrypt.gensalt()
        new_hashed_password = bcrypt.hashpw(req.new_password.encode('utf-8'), salt).decode('utf-8')
        
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hashed_password, req.user_id))
        conn.commit()
        
        return {"message": "Password updated successfully!"}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
