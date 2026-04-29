import json
import os
import uuid
import threading

from deepfake_detector import highlight_face
from flask import Flask, request, redirect, url_for, jsonify, send_from_directory
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
import cv2

app = Flask(__name__, static_folder="build", static_url_path="")

# ===============================
# Model Setup
# ===============================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

try:
    processor = AutoImageProcessor.from_pretrained("prithivMLmods/Deep-Fake-Detector-Model")
    model = AutoModelForImageClassification.from_pretrained("prithivMLmods/Deep-Fake-Detector-Model")
    model.to(device)
    model.eval()
except Exception as e:
    raise RuntimeError(f"Failed to load model: {e}")

# Warmup
with torch.no_grad():
    _dummy = processor(images=Image.new("RGB", (224, 224)), return_tensors="pt").to(device)
    model(**_dummy)

# ===============================
# Config
# ===============================
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg"}
ALLOWED_VIDEO_EXTENSIONS = {"mp4", "avi", "mov", "mkv"}
ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS

app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 100MB limit

MAX_VIDEO_FRAMES = 20
FRAME_BATCH_SIZE = 8
MODEL_INPUT_SIZE = (224, 224)

_jobs: dict = {}
_jobs_lock = threading.Lock()


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def is_video(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS


def preprocess_image(image: Image.Image) -> Image.Image:
    return image.resize(MODEL_INPUT_SIZE, Image.BILINEAR)


def predict_batch(images: list) -> list:
    inputs = processor(images=images, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    probs = torch.softmax(outputs.logits, dim=1)
    predicted = torch.argmax(probs, dim=1)
    results = []
    for i in range(len(images)):
        label = model.config.id2label[predicted[i].item()]
        confidence = round(probs[i][predicted[i]].item() * 100, 2)
        results.append((label.upper() if label else "UNKNOWN", confidence))
    return results


def predict_image(image: Image.Image):
    return predict_batch([preprocess_image(image)])[0]


def _sample_frame_indices(total_frames: int, max_frames: int) -> list:
    if total_frames <= max_frames:
        return list(range(total_frames))
    step = total_frames / max_frames
    return [int(i * step) for i in range(max_frames)]


def _run_video_job(job_id: str, video_path: str):
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        sample_indices = set(_sample_frame_indices(total_frames, MAX_VIDEO_FRAMES))

        frames_by_index = {}
        frame_index = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_index in sample_indices:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames_by_index[frame_index] = preprocess_image(Image.fromarray(rgb))
            frame_index += 1
        cap.release()

        if not frames_by_index:
            raise ValueError("No frames could be extracted from the video.")

        sorted_indices = sorted(frames_by_index.keys())
        all_images = [frames_by_index[i] for i in sorted_indices]

        frame_results = []
        for batch_start in range(0, len(all_images), FRAME_BATCH_SIZE):
            batch = all_images[batch_start: batch_start + FRAME_BATCH_SIZE]
            batch_preds = predict_batch(batch)
            for j, (label, conf) in enumerate(batch_preds):
                frame_results.append({
                    "frame": sorted_indices[batch_start + j],
                    "label": label,
                    "confidence": conf,
                })

        fake_frames = [r for r in frame_results if r["label"] == "FAKE"]
        real_frames = [r for r in frame_results if r["label"] == "REAL"]

        if len(fake_frames) >= len(real_frames):
            majority_label = "FAKE"
            avg_confidence = round(sum(r["confidence"] for r in fake_frames) / len(fake_frames), 2)
        else:
            majority_label = "REAL"
            avg_confidence = round(sum(r["confidence"] for r in real_frames) / len(real_frames), 2)

        with _jobs_lock:
            _jobs[job_id].update({
                "status": "done",
                "result": majority_label,
                "confidence": avg_confidence,
                "frame_results": frame_results,
            })

    except Exception as e:
        with _jobs_lock:
            _jobs[job_id].update({"status": "error", "error": str(e)})


# ===============================
# React App — serve build/index.html for all non-API routes
# ===============================
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


# ===============================
# API Routes
# ===============================
@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    JSON endpoint consumed by the React frontend.
    Returns:
      - Image: { result, confidence, output_image, uploaded_image, is_video: false }
      - Video: { job_id, uploaded_image, is_video: true }
    """
    file = request.files.get("image")

    if file is None or file.filename == "":
        return jsonify({"error": "No file uploaded"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, mp4, avi, mov, mkv"}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_name = str(uuid.uuid4())

    if is_video(file.filename):
        filename = f"{unique_name}.{ext}"
        video_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(video_path)

        job_id = unique_name
        with _jobs_lock:
            _jobs[job_id] = {"status": "processing", "result": None}

        t = threading.Thread(target=_run_video_job, args=(job_id, video_path), daemon=True)
        t.start()

        return jsonify({
            "job_id": job_id,
            "uploaded_image": filename,
            "is_video": True,
        })

    else:
        image = Image.open(file).convert("RGB")
        filename = f"{unique_name}.jpg"
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image.save(image_path)

        result, confidence = predict_image(image)

        output_image = filename
        try:
            output_image = highlight_face(image_path)
        except Exception as e:
            print("Highlight error:", e)

        return jsonify({
            "result": result,
            "confidence": confidence,
            "output_image": output_image,
            "uploaded_image": filename,
            "is_video": False,
            "frame_results": None,
        })


@app.route("/status/<job_id>")
def job_status(job_id: str):
    with _jobs_lock:
        job = _jobs.get(job_id)
    if job is None:
        return jsonify({"status": "error", "error": "Job not found"}), 404
    return jsonify(job)


@app.route("/feedback", methods=["POST"])
def feedback():
    name = request.form.get("name", "")[:100]
    rating = request.form.get("rating", "")[:10]
    message = request.form.get("message", "")[:1000]
    prediction_correct = request.form.get("prediction_correct", "")[:10]

    data = {
        "name": name,
        "rating": rating,
        "message": message,
        "was_prediction_correct": prediction_correct,
    }

    file_path = "feedback.json"

    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            try:
                feedback_data = json.load(f)
            except json.JSONDecodeError:
                feedback_data = []
    else:
        feedback_data = []

    feedback_data.append(data)

    with open(file_path, "w") as f:
        json.dump(feedback_data, f, indent=4)

    return jsonify({"status": "ok"})


# ===============================
# Run App
# ===============================
if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=7860, debug=debug_mode, threaded=True)
