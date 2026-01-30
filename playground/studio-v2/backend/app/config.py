import os
import sys
import logging
from collections import deque
from pathlib import Path
from datetime import datetime

# --- PATHS ---
# backend/app/config.py -> backend/app -> backend -> ROOT
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 

# --- DESKTOP STORAGE RESOLUTION ---
def get_app_data_path(app_name="Imagine Read"):
    """
    Returns a safe, writable directory for application data based on the OS.
    Standard:
    - Mac: ~/Library/Application Support/Imagine Read
    - Windows: %APPDATA%/Imagine Read
    - Linux: ~/.local/share/Imagine Read
    
    Dev Mode Override:
    If a .env file exists in the active source directory, we assume Dev Mode 
    and use the local folder to avoid polluting system paths during dev.
    """
    # 1. Check for Dev Mode (Local .env existence OR simple dev override)
    # FORCE DEV MODE for Playground: Use current directory, not system paths
    return BASE_DIR

    # 2. Resolve System Path
    home = Path.home()
    if sys.platform == "win32":
        return home / "AppData" / "Roaming" / app_name
    elif sys.platform == "darwin":
        return home / "Library" / "Application Support" / app_name
    else:
        return home / ".local" / "share" / app_name

# DETERMINE ROOT DATA PATH
APP_DATA_DIR = get_app_data_path()
# Convert to string if it's a Path object
if isinstance(APP_DATA_DIR, Path):
    APP_DATA_DIR = str(APP_DATA_DIR)

# DEFINE SUBDIRECTORIES
TEMP_DIR = os.path.join(APP_DATA_DIR, "temp")
LIBRARY_DIR = os.path.join(APP_DATA_DIR, "library")
# Database is also moved to safe storage
DATABASE_URL = f"sqlite:///{os.path.join(APP_DATA_DIR, 'imagine_read.db')}"

# --- ENV & SECURITY ---
from dotenv import load_dotenv
# Try loading .env from BASE_DIR (Source) first, then APP_DATA_DIR (User Config)
load_dotenv(os.path.join(BASE_DIR, ".env")) # Dev/Source priorities
load_dotenv(os.path.join(APP_DATA_DIR, ".env")) # User overrides

CREDENTIALS_PATH = os.path.join(BASE_DIR, os.getenv("CREDENTIALS_PATH", "credentials.json"))
# Also check APP_DATA_DIR for credentials if not found in source (for installed apps)
if not os.path.exists(CREDENTIALS_PATH):
    user_creds = os.path.join(APP_DATA_DIR, "credentials.json")
    if os.path.exists(user_creds):
        CREDENTIALS_PATH = user_creds

# Ensure directories exist
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(LIBRARY_DIR, exist_ok=True)

logger = logging.getLogger("ImagineReadConfig")
logger.info(f"📂 Storage Root: {APP_DATA_DIR}")

# --- GOOGLE GENAI CONFIG ---
PROJECT_ID = os.getenv("PROJECT_ID", "seismic-mantis-483123-g8")
LOCATION = os.getenv("LOCATION", "us-central1")
MODEL_ID = os.getenv("MODEL_ID", "gemini-2.5-flash")

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
# Add File Handler
from logging.handlers import RotatingFileHandler
file_handler = RotatingFileHandler("backend.log", maxBytes=5*1024*1024, backupCount=3) # 5MB
file_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
logging.getLogger().addHandler(file_handler)

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
