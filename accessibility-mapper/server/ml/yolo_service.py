"""
YOLOv8 best.pt Inference Microservice (FastAPI)
==============================================
Runs the trained 'best.pt' PyTorch model for Ramp & Stairs detection.

Run this server:
    python server/ml/yolo_service.py

API Docs:
    http://localhost:8000/docs
"""

import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Import the core detector
from yolo_detector import process_base64, get_yolo_model

app = FastAPI(
    title="Accessibility YOLOv8 Service (best.pt)",
    description="High-speed accessibility inference API for Wheelchair Ramp & Stairs detection."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictPayload(BaseModel):
    image: str
    hint: Optional[str] = None
    threshold: Optional[float] = 0.25

@app.on_event("startup")
def startup():
    # Pre-warm model in memory
    try:
        model = get_yolo_model()
        print("Loaded YOLO model successfully. Classes:", model.names)
    except Exception as e:
        print("Warning: Could not pre-load model:", e)

@app.get("/health")
def health():
    return {
        "status": "online",
        "model": "best.pt",
        "classes": ["ramp", "stairs"]
    }

@app.post("/predict")
def predict(payload: PredictPayload):
    try:
        threshold = payload.threshold if payload.threshold is not None else 0.25
        result = process_base64(payload.image, confidence_threshold=threshold)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting YOLO Inference Microservice on http://127.0.0.1:8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)

