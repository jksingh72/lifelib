import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
# Look for model in my_project/model or fall back to default
MODEL_PATH = os.getenv("LIFELIB_MODEL_PATH", str(BASE_DIR / "my_project" / "model"))

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

