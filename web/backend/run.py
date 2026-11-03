import sys
from pathlib import Path
import uvicorn

# Add backend directory to Python sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.config import HOST, PORT

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)

