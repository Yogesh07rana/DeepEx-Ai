# DeepEx AI — React Frontend

This is the React version of the DeepEx AI Deepfake Detector.
The Flask backend (`app.py`) now serves the React build and exposes JSON APIs.

## Project Structure

```
deepex-react/
├── app.py                        ← Updated Flask backend (JSON APIs + serves React build)
├── deepfake_detector.py          ← Face highlight utility (unchanged)
├── requirement.txt               ← Python dependencies (unchanged)
├── feedback.json                 ← Feedback storage (unchanged)
│
└── src/
    ├── index.js                  ← React entry point
    ├── index.css                 ← All global styles (from original index.html)
    ├── App.jsx                   ← Root component, handles upload + state
    └── components/
        ├── Header.jsx            ← Typing animation + social icons
        ├── UploadForm.jsx        ← File upload with image/video preview + scan effect
        ├── ConfidenceBar.jsx     ← Animated confidence progress bar
        ├── FrameTable.jsx        ← Frame-by-frame video analysis table
        ├── ResultSection.jsx     ← Image result display (badge, bar, region analysis)
        ├── VideoPolling.jsx      ← Polls /status/:jobId every 2s for video jobs
        ├── DMCASection.jsx       ← Platform report links + DMCA notice generator
        └── FeedbackForm.jsx      ← Star rating + prediction feedback form
```

## API Changes in app.py

| Old route (HTML)    | New route (JSON)      | Purpose                          |
|---------------------|-----------------------|----------------------------------|
| `POST /`            | `POST /api/analyze`   | Upload image or video, get result|
| `GET /status/:id`   | `GET /status/:id`     | Poll video job (unchanged)       |
| `POST /feedback`    | `POST /feedback`      | Submit feedback (returns JSON)   |
| —                   | `GET /*`              | Serve React build (index.html)   |

## Setup & Run

### 1. Install Python dependencies
```bash
pip install -r requirement.txt
```

### 2. Build the React app
```bash
npm install
npm run build
```
This creates a `build/` folder that Flask serves automatically.

### 3. Start Flask
```bash
python app.py
```

Visit: http://localhost:7860

### Development (hot-reload React)
```bash
# Terminal 1 — React dev server (port 3000, proxies /api/* to Flask)
npm start

# Terminal 2 — Flask backend
python app.py
```
Add this to `package.json` for proxying during development:
```json
"proxy": "http://localhost:7860"
```

## What Changed vs Original

- **index.html** → replaced by React components (no more Jinja2 templating)
- **app.py** → added `POST /api/analyze` JSON endpoint; serves React `build/` folder
- All features preserved: scan animation, DMCA generator, video polling, star rating, feedback form
