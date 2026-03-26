from backend.main import app
import uvicorn
import os

if __name__ == "__main__":
    # Render sets the PORT environment variable
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
