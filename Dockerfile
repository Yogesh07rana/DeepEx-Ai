# ── Base image ──────────────────────────────────────────────────────────────
FROM python:3.10-slim

# ── System dependencies ──────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
  libglib2.0-0 \
  libsm6 \
  libxext6 \
  libxrender-dev \
  libgl1 \
  && rm -rf /var/lib/apt/lists/*

# ── Create a non-root user (required by Hugging Face Spaces) ─────────────────
RUN useradd -m -u 1000 appuser

# ── Working directory ────────────────────────────────────────────────────────
WORKDIR /app

# ── Install Python dependencies ──────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Pre-download the model at build time ─────────────────────────────────────
# This avoids a slow cold-start on first request and prevents timeout errors.
RUN python - <<'EOF'
from transformers import AutoImageProcessor, AutoModelForImageClassification
AutoImageProcessor.from_pretrained("prithivMLmods/Deep-Fake-Detector-Model")
AutoModelForImageClassification.from_pretrained("prithivMLmods/Deep-Fake-Detector-Model")
print("Model downloaded successfully.")
EOF

# ── Copy application code ────────────────────────────────────────────────────
COPY . .

# ── Create writable directories and fix ownership ────────────────────────────
# static/uploads is used for uploaded files AND feedback.json
RUN mkdir -p static/uploads \
  && chown -R appuser:appuser /app

# ── Switch to non-root user ──────────────────────────────────────────────────
USER appuser

# ── Expose the port Hugging Face expects ────────────────────────────────────
EXPOSE 7860

# ── Start with Gunicorn (production-grade, multi-worker) ─────────────────────
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "2", "--timeout", "120", "app:app"]