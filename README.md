# Real-Time Object Detection Web App

Browser-based live object detection: webcam feed → YOLOv8 inference → real-time bounding boxes, rendered in a React frontend backed by a FastAPI inference service.

**Status: in progress.** Local prototype works end-to-end; deployment (Render + Vercel) and dashboard polish are next.

## Stack

- **Backend:** FastAPI + Ultralytics YOLOv8 (nano model by default)
- **Frontend:** React + Vite, webcam capture via `getUserMedia`, canvas overlay for bounding boxes

## Run it locally

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

First run downloads the `yolov8n.pt` weights automatically (~6 MB) — needs an internet connection once.

Check it's alive: open http://localhost:8000/health — should return `{"status": "ok"}`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, click **Start Detection**, and allow camera access.

## How it works

1. The frontend grabs a frame from the webcam every ~500ms, encodes it as a JPEG data URL.
2. It POSTs the frame to `/detect` on the backend.
3. The backend runs YOLOv8 inference and returns detected objects (label, confidence, bounding box).
4. The frontend draws the boxes on a canvas overlaid on the video feed, and logs each detection event.

## Next steps (target: Dec 2026)

- [ ] Deploy backend to Render (or similar) — set `CORS` origins to the real frontend domain
- [ ] Deploy frontend to Vercel — set `VITE_API_URL` to the deployed backend URL
- [ ] Swap `yolov8n.pt` for a fine-tuned model if targeting a specific use case (e.g. safety-gear detection)
- [ ] Add a simple stats view (detections over time, most common objects)

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_URL` | frontend `.env` | Backend URL (defaults to `http://localhost:8000` for local dev) |
