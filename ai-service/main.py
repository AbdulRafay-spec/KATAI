import io
import json
import os
from pathlib import Path

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

MODEL_DIR = Path(__file__).parent / "model"
session = ort.InferenceSession(str(MODEL_DIR / "brain_model.onnx"))
labels = json.loads((MODEL_DIR / "labels.json").read_text())

# Must match the eval transform used in training (ImageNet normalization, 224x224).
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

DISPLAY_NAMES = {
    "glioma": "Glioma",
    "meningioma": "Meningioma",
    "pituitary": "Pituitary tumor",
    "notumor": "No tumor",
}

API_KEY = os.environ.get("AI_SERVICE_KEY")
MAX_UPLOAD_BYTES = 4 * 1024 * 1024  # keep in sync with web/src/lib/upload.ts
MAX_SIDE_PX = 4096
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "BMP"}

app = FastAPI(title="KATAI AI Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


def decode_image(data: bytes) -> Image.Image:
    """Decodes by content, not file extension, and rejects formats and sizes the service does not support."""
    if not data:
        raise HTTPException(400, "The uploaded file is empty")
    try:
        image = Image.open(io.BytesIO(data))
    except (UnidentifiedImageError, OSError):
        raise HTTPException(400, "File is not a valid image")
    if image.format not in ALLOWED_FORMATS:
        raise HTTPException(415, "Unsupported image format. Use JPG, PNG, WEBP or BMP")
    width, height = image.size
    if width > MAX_SIDE_PX or height > MAX_SIDE_PX:
        raise HTTPException(413, f"Image dimensions exceed {MAX_SIDE_PX} x {MAX_SIDE_PX} pixels")
    try:
        image.load()
    except (OSError, SyntaxError, ValueError, Image.DecompressionBombError):
        raise HTTPException(400, "Image file is corrupt or truncated")
    return image


def preprocess(image: Image.Image) -> np.ndarray:
    resized = image.convert("RGB").resize((224, 224), Image.BILINEAR)
    x = (np.asarray(resized, dtype=np.float32) / 255.0 - MEAN) / STD
    return x.transpose(2, 0, 1)[np.newaxis]


@app.get("/")
def home():
    return {"message": "KATAI AI service is running", "classes": labels}


@app.post("/predict")
async def predict(file: UploadFile = File(...), authorization: str | None = Header(None)):
    if API_KEY and authorization != f"Bearer {API_KEY}":
        raise HTTPException(401, "Invalid or missing API key")

    # Read one byte past the limit so oversized uploads are rejected without reading them fully.
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image is larger than 4 MB")

    x = preprocess(decode_image(data))
    logits = session.run(None, {"input": x})[0][0]
    probs = np.exp(logits - logits.max())
    probs /= probs.sum()

    top = int(probs.argmax())
    label = labels[top]
    tumor = label != "notumor"
    return {
        "filename": file.filename,
        "prediction": label,
        "display_name": DISPLAY_NAMES.get(label, label),
        "tumor_detected": tumor,
        "confidence": round(float(probs[top]), 4),
        "scores": {name: round(float(p), 4) for name, p in zip(labels, probs)},
        "disclaimer": "AI-assisted result for research use only. Requires review by a qualified clinician.",
    }
