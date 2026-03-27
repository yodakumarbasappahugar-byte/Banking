import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext
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

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserSignup(BaseModel):
    email: str
    mobile_number: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

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
            
        hashed_pwd = pwd_context.hash(user.password)
        cur.execute(
            "INSERT INTO users (email, mobile_number, password_hash) VALUES (%s, %s, %s) RETURNING id, email, mobile_number",
            (user.email, user.mobile_number, hashed_pwd)
        )
        new_user = cur.fetchone()
        return {"message": "Account created successfully!", "user": new_user}
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
        cur.execute("SELECT id, email, password_hash FROM users WHERE email = %s", (user.email,))
        db_user = cur.fetchone()
        
        if not db_user or not pwd_context.verify(user.password, db_user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        return {"message": "Login successful", "user": {"id": db_user["id"], "email": db_user["email"]}}
    finally:
        cur.close()
        conn.close()
