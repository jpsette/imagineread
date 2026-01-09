import torch
import os

MODEL_PATH = "models/lama.pt"

def test_load():
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model not found at {MODEL_PATH}")
        return

    try:
        print(f"Attempting to load {MODEL_PATH} with torch.jit.load...")
        model = torch.jit.load(MODEL_PATH, map_location='cpu')
        model.eval()
        print("✅ Success! Model loaded via TorchScript.")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")

if __name__ == "__main__":
    test_load()
