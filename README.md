<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:1e3a5f,100:2563eb&height=180&section=header&text=Real-Time%20Object%20Detection&fontSize=32&fontColor=ffffff&animation=fadeIn&fontAlignY=42&desc=Webcam%20%E2%86%92%20YOLOv8%20%E2%86%92%20Live%20Bounding%20Boxes&descAlignY=62&descSize=15&descColor=BFDBFE" />

<p>
<img src="https://img.shields.io/badge/Status-Live-22c55e?style=for-the-badge" />
<img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" />
<img src="https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

**[🎥 Live Demo](https://real-time-object-detection-delta.vercel.app/)** &nbsp;•&nbsp; **[⚙️ Backend API](https://real-time-object-detection-cnfp.onrender.com)**

</div>

<br/>

## What it does

Point your webcam at anything, and it detects objects in real time — right in the browser. No install, no app, just open the link.

```
webcam frame → FastAPI → YOLOv8 inference → bounding boxes → drawn live on canvas
```

<br/>

## Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=react,vite,fastapi,python,opencv&theme=dark" />

</div>

| Layer | Tech |
|---|---|
| **Detection model** | YOLOv8 (nano) via Ultralytics |
| **Backend** | FastAPI, deployed on Render |
| **Frontend** | React + Vite, deployed on Vercel |
| **Vision** | `getUserMedia` webcam capture, canvas overlay for live bounding boxes |

<br/>

## Try it

1. Open the **[live demo](https://real-time-object-detection-delta.vercel.app/)**
2. Click **Start Detection**
3. Allow camera access
4. Watch it detect people, phones, and everyday objects in real time

> ⏳ First request may take ~50s to wake up — the backend runs on Render's free tier, which sleeps after inactivity.

<br/>

## Run it locally

<details>
<summary><b>Backend</b> (click to expand)</summary>

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install fastapi "uvicorn[standard]" ultralytics pillow numpy python-multipart
python -m uvicorn main:app --reload --port 8000
```

First run auto-downloads the `yolov8n.pt` weights (~6 MB).
Check it's alive: `http://localhost:8000/health` → `{"status": "ok"}`

</details>

<details>
<summary><b>Frontend</b> (click to expand)</summary>

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, click **Start Detection**, allow camera access.

</details>

<br/>

## How it works

```mermaid
sequenceDiagram
    participant Browser
    participant React as React Frontend
    participant API as FastAPI Backend
    participant YOLO as YOLOv8 Model

    Browser->>React: Webcam frame (~2 fps)
    React->>API: POST /detect (base64 JPEG)
    API->>YOLO: Run inference
    YOLO-->>API: Boxes + labels + confidence
    API-->>React: JSON response
    React->>Browser: Draw boxes on canvas
```

<br/>

## Roadmap

- [ ] Fine-tune the model for a specific use case (e.g. safety-gear detection)
- [ ] Add a stats view — detections over time, most common objects
- [ ] Tighten backend CORS to only allow the deployed frontend origin

<br/>

<div align="center">

Built by **[Manish M P](https://github.com/manishkshtriya)** — extending computer vision research from a CV internship at NITK Surathkal into a shipped product.

</div>
