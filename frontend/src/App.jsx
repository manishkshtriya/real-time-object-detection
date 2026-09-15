import { useCallback, useEffect, useRef, useState } from "react";

// Point this at your deployed backend URL once you deploy (Render, etc).
// Falls back to localhost for local development.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CAPTURE_INTERVAL_MS = 500; // ~2 requests/sec — gentle on a CPU backend

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [detections, setDetections] = useState([]);
  const [inferenceMs, setInferenceMs] = useState(null);
  const [error, setError] = useState(null);
  const [log, setLog] = useState([]); // simple event log

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);
    } catch (err) {
      setError(
        "Could not access webcam. Check browser permissions and try again."
      );
      console.error(err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRunning(false);
    setDetections([]);
  }, []);

  const captureAndDetect = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const ctx = captureCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.7);

    try {
      const res = await fetch(`${API_URL}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setDetections(data.detections);
      setInferenceMs(data.inference_ms);

      if (data.detections.length > 0) {
        const summary = data.detections
          .map((d) => `${d.label} (${(d.confidence * 100).toFixed(0)}%)`)
          .join(", ");
        setLog((prev) =>
          [
            { time: new Date().toLocaleTimeString(), summary },
            ...prev,
          ].slice(0, 20)
        );
      }
      setError(null);
    } catch (err) {
      setError(
        "Couldn't reach the detection backend. Is it running at " +
          API_URL +
          "?"
      );
      console.error(err);
    }
  }, []);

  // Poll the backend on an interval while the camera is running.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(captureAndDetect, CAPTURE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [running, captureAndDetect]);

  // Draw bounding boxes on the overlay canvas, matched to the video's
  // displayed size.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!video.videoWidth) return;
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.box;
      const boxX = x1 * scaleX;
      const boxY = y1 * scaleY;
      const boxW = (x2 - x1) * scaleX;
      const boxH = (y2 - y1) * scaleY;

      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      const label = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = "14px system-ui, sans-serif";
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = "#22d3ee";
      ctx.fillRect(boxX, boxY - 20, textWidth + 8, 20);
      ctx.fillStyle = "#0f172a";
      ctx.fillText(label, boxX + 4, boxY - 5);
    });
  }, [detections]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Real-Time Object Detection</h1>
        <p style={styles.subtitle}>YOLOv8 · FastAPI · React</p>
      </header>

      <div style={styles.videoWrap}>
        <video ref={videoRef} muted playsInline style={styles.video} />
        <canvas ref={canvasRef} style={styles.canvasOverlay} />
        {!running && (
          <div style={styles.placeholder}>Camera is off</div>
        )}
      </div>

      <div style={styles.controls}>
        {!running ? (
          <button style={styles.buttonPrimary} onClick={startCamera}>
            Start Detection
          </button>
        ) : (
          <button style={styles.buttonDanger} onClick={stopCamera}>
            Stop
          </button>
        )}
        {inferenceMs !== null && running && (
          <span style={styles.stat}>Inference: {inferenceMs} ms</span>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.logPanel}>
        <h2 style={styles.logTitle}>Detection Log</h2>
        {log.length === 0 ? (
          <p style={styles.logEmpty}>No detections yet.</p>
        ) : (
          <ul style={styles.logList}>
            {log.map((entry, i) => (
              <li key={i} style={styles.logItem}>
                <span style={styles.logTime}>{entry.time}</span>{" "}
                {entry.summary}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
    fontFamily: "system-ui, sans-serif",
    padding: "32px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: { textAlign: "center", marginBottom: 24 },
  title: { margin: 0, fontSize: 28, fontWeight: 700 },
  subtitle: { margin: "4px 0 0", color: "#94a3b8", fontSize: 14 },
  videoWrap: {
    position: "relative",
    width: "100%",
    maxWidth: 640,
    aspectRatio: "4 / 3",
    background: "#1e293b",
    borderRadius: 12,
    overflow: "hidden",
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  canvasOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  placeholder: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: 15,
  },
  controls: {
    marginTop: 20,
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  buttonPrimary: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 15,
    cursor: "pointer",
  },
  buttonDanger: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 15,
    cursor: "pointer",
  },
  stat: { color: "#94a3b8", fontSize: 14 },
  error: {
    marginTop: 16,
    color: "#fca5a5",
    background: "#450a0a",
    padding: "10px 16px",
    borderRadius: 8,
    maxWidth: 640,
    textAlign: "center",
    fontSize: 14,
  },
  logPanel: {
    marginTop: 28,
    width: "100%",
    maxWidth: 640,
    background: "#1e293b",
    borderRadius: 12,
    padding: 16,
  },
  logTitle: { margin: "0 0 8px", fontSize: 16 },
  logEmpty: { color: "#64748b", fontSize: 14, margin: 0 },
  logList: { listStyle: "none", margin: 0, padding: 0, fontSize: 13 },
  logItem: {
    padding: "6px 0",
    borderBottom: "1px solid #334155",
    color: "#cbd5e1",
  },
  logTime: { color: "#64748b", marginRight: 8 },
};
