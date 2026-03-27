from passlib.context import CryptContext
import traceback

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    print("Hashing 'password'...")
    hashed = pwd_context.hash("password")
    print("Success:", hashed)
except Exception as e:
    print("Error during hash!")
    print(traceback.format_exc())
