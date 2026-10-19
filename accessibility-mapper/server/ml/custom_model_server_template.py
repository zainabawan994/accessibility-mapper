"""
Accessibility Mapper - Custom ML Model Server Template (FastAPI)
================================================================
Is template ko use karke aap apna PyTorch (.pt), TensorFlow/Keras (.h5), 
ONNX (.onnx), ya YOLO model is project ke sath connect kar sakte hain.

Tariqa (How to run):
1. Dependencies install karein:
   pip install fastapi uvicorn pillow pydantic numpy

2. Server chalayein:
   python custom_model_server_template.py
   (Default URL: http://localhost:8000/predict)

3. Accessibility Mapper app khol kar "ML Studio" tab me jayein,
   "Custom External Model" select karein aur Endpoint URL dalein:
   http://localhost:8000/predict
"""

import base64
import io
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

app = FastAPI(title="Accessibility ML Custom Endpoint")

# CORS enable karein taake requests block na hoon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# 1. Input Request Schema (Project ye format bhejta hai)
# -------------------------------------------------------------------
class InferenceRequest(BaseModel):
    image: str  # Base64 encoded image string
    hint: Optional[str] = None
    threshold: Optional[float] = 0.65

# -------------------------------------------------------------------
# 2. Apna Model Yahan Load Karein (Startup Par)
# -------------------------------------------------------------------
# Misal ke tor par:
# import torch
# model = torch.load("my_accessibility_model.pt")
# model.eval()

print("Custom Machine Learning Model loaded successfully!")

# -------------------------------------------------------------------
# 3. Prediction Endpoint (/predict)
# -------------------------------------------------------------------
@app.post("/predict")
async def predict_accessibility(req: InferenceRequest):
    try:
        # Base64 image decode karein
        image_bytes = base64.b64decode(req.image)
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # -------------------------------------------------------------
        # Yahan aap apna Model run karein (Preprocess -> Forward Pass)
        # e.g.:
        # tensor = preprocess(pil_image)
        # with torch.no_grad():
        #     output = model(tensor)
        # -------------------------------------------------------------

        # Expected response structure jo frontend display karega:
        return {
            "primaryCategory": "ramp",  # ramp, stairs_barrier, accessible_entrance, elevator, accessible_restroom, accessible_parking, tactile_paving
            "primaryLabel": "Wheelchair Ramp with Handrails",
            "confidence": 94.2,
            "topPredictions": [
                {"category": "ramp", "label": "Wheelchair Ramp", "confidence": 94.2},
                {"category": "accessible_entrance", "label": "Accessible Entrance", "confidence": 5.1}
            ],
            "features": {
                "isBarrierFree": True,
                "barrierSeverity": "none",
                "accessibilityScore": 92,
                "slopeGradient": "1:12 ADA Standard (Gentle)",
                "hasHandrails": True,
                "handrailDetails": "Present on both sides",
                "hasSteps": False,
                "stepCount": 0,
                "doorType": "Automatic Slider",
                "estimatedDoorWidthCm": 95,
                "hasTactilePaving": False,
                "keyObservations": [
                    "Ramp slope is compliant with ADA guidelines",
                    "Continuous handrails detected",
                    "Surface is smooth and non-slip"
                ]
            },
            "summary": "Detected an ADA-compliant wheelchair access ramp with dual continuous handrails.",
            "recommendation": "Fully accessible for manual and motorized wheelchairs."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.get("/health")
def health():
    return {"status": "ok", "service": "Custom Accessibility ML Service"}

if __name__ == "__main__":
    import uvicorn
    print("Starting ML inference server at http://localhost:8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
