import React from 'react';
import ConfidenceBar from './ConfidenceBar';
import FrameTable from './FrameTable';
import DMCASection from './DMCASection';
import FeedbackForm from './FeedbackForm';

export default function ResultSection({ result, confidence, outputImage, isVideo, uploadedImage, frameResults }) {
  if (!result) return null;

  const isReal = result === 'REAL IMAGE' || result === 'REAL';
  const label = isReal
    ? `✔ Real ${isVideo ? 'Video' : 'Image'}`
    : `⚠ Deepfake Detected in ${isVideo ? 'Video' : 'Image'}`;

  const badgeStyle = isReal
    ? { background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid #22c55e' }
    : { background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid #ef4444' };

  const barColor = isReal ? '#22c55e' : '#ef4444';

  return (
    <div style={{ marginTop: '35px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
      <div style={{ ...badgeStyle, padding: '8px 16px', borderRadius: '99px', display: 'inline-block', marginBottom: '15px' }}>
        {label}
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Confidence Score: {confidence}%</p>
      <ConfidenceBar confidence={confidence} color={barColor} />

      {isVideo && uploadedImage && (
        <>
          <h3 style={{ fontSize: '16px', margin: '20px 0 10px' }}>Uploaded Video</h3>
          <video
            controls
            style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '15px' }}
          >
            <source src={`/static/uploads/${uploadedImage}`} />
            Your browser does not support video playback.
          </video>
        </>
      )}

      <FrameTable frameResults={frameResults} />

      {outputImage && !isVideo && (
        <>
          <h3 style={{ fontSize: '16px', margin: '20px 0 10px' }}>Suspicious Region Analysis</h3>
          <img src={`/${outputImage}`} className="image-preview" alt="result" />
        </>
      )}

      {!isReal && <DMCASection mediaType={isVideo ? 'video' : 'image'} />}

      <FeedbackForm />
    </div>
  );
}
