import React, { useState } from 'react';
import Header from './components/Header';
import UploadForm from './components/UploadForm';
import ResultSection from './components/ResultSection';
import VideoPolling from './components/VideoPolling';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [outputImage, setOutputImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [frameResults, setFrameResults] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(file) {
    setIsLoading(true);
    setResult(null);
    setConfidence(null);
    setOutputImage(null);
    setUploadedImage(null);
    setIsVideo(false);
    setFrameResults(null);
    setJobId(null);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({ error: res.statusText }));
        setError(msg.error || 'Upload failed.');
        return;
      }

      const data = await res.json().catch(() => null);

      if (data) {
        if (data.job_id) {
          // Video job — poll for results
          setIsVideo(true);
          setJobId(data.job_id);
          setUploadedImage(data.uploaded_image);
        } else {
          // Image result — immediate
          setResult(data.result);
          setConfidence(data.confidence);
          setOutputImage(data.output_image);
          setUploadedImage(data.uploaded_image);
          setIsVideo(data.is_video || false);
          setFrameResults(data.frame_results || null);
        }
      }
    } catch (e) {
      setError('Network error. Please make sure the Flask server is running.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="card">
      <Header />
      <UploadForm onSubmit={handleSubmit} isLoading={isLoading} />

      {error && (
        <div style={{
          marginTop: '20px',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          color: '#f87171',
          borderRadius: '10px',
          padding: '14px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {jobId && !result && <VideoPolling jobId={jobId} />}

      {result && (
        <ResultSection
          result={result}
          confidence={confidence}
          outputImage={outputImage}
          isVideo={isVideo}
          uploadedImage={uploadedImage}
          frameResults={frameResults}
        />
      )}
    </div>
  );
}
