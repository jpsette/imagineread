import os
import urllib.request
import ssl

# Bypass SSL check for simplicity if needed (Mac python certs sometimes unrelated)
ssl._create_default_https_context = ssl._create_unverified_context

# Big LaMa is the standard robust model
MODEL_URL = "https://github.com/Sanster/models/releases/download/add_big_lama/big-lama.pt"
MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "lama.pt")

def download_model():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
    
    if os.path.exists(MODEL_PATH):
        print(f"Model already exists at {MODEL_PATH}")
        return

    print(f"Downloading LaMa model from {MODEL_URL}...")
    print(f"Saving to {MODEL_PATH}...")
    
    try:
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("✅ Download complete!")
    except Exception as e:
        print(f"❌ Download failed: {e}")

if __name__ == "__main__":
    download_model()
