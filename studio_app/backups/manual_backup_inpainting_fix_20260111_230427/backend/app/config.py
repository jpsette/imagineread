import os
import sys
import logging
from collections import deque
from pathlib import Path
from datetime import datetime

# --- PATHS ---
# backend/app/config.py -> backend/app -> backend -> ROOT
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
TEMP_DIR = os.path.join(BASE_DIR, "temp")
LIBRARY_DIR = os.path.join(BASE_DIR, "library")
DATA_FILE = os.path.join(BASE_DIR, "data.json")
CREDENTIALS_PATH = os.path.join(BASE_DIR, "credentials.json")

# Ensure directories exist
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(LIBRARY_DIR, exist_ok=True)

# --- GOOGLE GENAI CONFIG ---
PROJECT_ID = "seismic-mantis-483123-g8"
LOCATION = "us-central1"
MODEL_ID = "gemini-2.0-flash-exp"

# --- LOGGING SETUP ---
LOG_BUFFER = deque(maxlen=200)

class InMemoryHandler(logging.Handler):
    """Custom logging handler to store logs in memory for the dashboard."""
    def emit(self, record):
        try:
            log_entry = {
                "id":  int(record.created * 1000), 
                "time": datetime.fromtimestamp(record.created).strftime("%H:%M:%S"),
                "level": record.levelname,
                "message": record.getMessage()
            }
            LOG_BUFFER.append(log_entry)
        except Exception:
            self.handleError(record)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logging.getLogger().addHandler(InMemoryHandler())
logger = logging.getLogger("ImagineReadAPI")

# --- DYNAMIC DOCS STARTUP ---
# This was in main.py, moving logic to a helper or keeping simple import here
ROOT_PROJ_DIR = os.path.dirname(BASE_DIR) # /Users/jp/Documents/APP/Imagine Read
if ROOT_PROJ_DIR not in sys.path:
    sys.path.append(ROOT_PROJ_DIR)

DOCS_MODULE_AVAILABLE = False
try:
    from scripts import update_docs
    DOCS_MODULE_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ Could not import scripts.update_docs. Dashboard stats will be limited.")
