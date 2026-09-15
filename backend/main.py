"""
Real-Time Object Detection — FastAPI backend
Accepts an image frame (base64 JPEG/PNG), runs YOLOv8 inference,
returns detected objects with bounding boxes and confidence scores.
"""

import base64
import io
import time
from typing import List

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI(title="Real-Time Object Detection API")

# Allow the React dev server / deployed frontend to call this API.
# Replace "*" with your actual Vercel domain once deployed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the YOLOv8 nano model once at startup (fast, good for real-time/CPU use).
# Swap "yolov8n.pt" for "yolov8s.pt" / a custom-trained model later for
# better accuracy at the cost of speed.
model = YOLO("yolov8n.pt")


class DetectionRequest(BaseModel):
    image: str  # base64-encoded JPEG/PNG, e.g. "data:image/jpeg;base64,...."


class Detection(BaseModel):
    label: str
    confidence: float
    box: List[float]  # [x1, y1, x2, y2] in pixel coordinates


class DetectionResponse(BaseModel):
    detections: List[Detection]
    inference_ms: float
    image_width: int
    image_height: int


def decode_base64_image(data: str) -> Image.Image:
    """Strip a data-URL prefix if present and decode to a PIL image."""
    if "," in data:
        data = data.split(",", 1)[1]
    try:
        image_bytes = base64.b64decode(data)
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {exc}")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/detect", response_model=DetectionResponse)
def detect(request: DetectionRequest):
    image = decode_base64_image(request.image)
    frame = np.array(image)

    start = time.perf_counter()
    results = model.predict(frame, verbose=False, conf=0.35)[0]
    inference_ms = (time.perf_counter() - start) * 1000

    detections: List[Detection] = []
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        label = model.names[int(box.cls[0])]
        confidence = float(box.conf[0])
        detections.append(
            Detection(label=label, confidence=confidence, box=[x1, y1, x2, y2])
        )

    return DetectionResponse(
        detections=detections,
        inference_ms=round(inference_ms, 1),
        image_width=image.width,
        image_height=image.height,
    )
