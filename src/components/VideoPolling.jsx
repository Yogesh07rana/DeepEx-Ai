import React, { useEffect, useRef, useState } from 'react';
import ConfidenceBar from './ConfidenceBar';
import FrameTable from './FrameTable';
import DMCASection from './DMCASection';

export default function VideoPolling({ jobId }) {
  const [status, setStatus] = useState('processing');
  const [statusText, setStatusText] = useState('Connecting to server…');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!jobId) return;

    function poll() {
      attemptsRef.current++;
      setStatusText(`Checking… (attempt ${attemptsRef.current})`);

      fetch(`/status/${jobId}`)
        .then(r => r.json())
        .then(data => {
          if (data.status === 'processing') {
            setTimeout(poll, 2000);
          } else if (data.status === 'done') {
            setResult(data);
            setStatus('done');
          } else {
            setStatus('error');
            setError(data.error || 'unknown error');
          }
        })
        .catch(() => {
          if (attemptsRef.current < 60) {
            setTimeout(poll, 3000);
          } else {
            setStatus('error');
            setError('Could not reach the server. Please refresh and try again.');
          }
        });
    }

    poll();
  }, [jobId]);

  if (status === 'processing') {
    return (
      <div className="video-processing-box">
        <div className="processing-spinner"></div>
        <div className="processing-label">Analysing your video…</div>
        <div className="processing-sub">Sampling frames &amp; running inference — this usually takes under a minute.</div>
        <div className="pulse-bar"><div className="pulse-fill"></div></div>
        <div className="poll-status-text">{statusText}</div>
      </div>
    );
  }

  if (status === 'error') {
    return <div className="poll-error-box">Processing failed: {error}</div>;
  }

  if (!result) return null;

  const isFake = result.result !== 'REAL' && result.result !== 'REAL IMAGE';
  const label = isFake ? '⚠ Deepfake Detected in Video' : '✔ Real Video';
  const badgeStyle = isFake
    ? { background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid #ef4444' }
    : { background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid #22c55e' };
  const barColor = isFake ? '#ef4444' : '#22c55e';

  return (
    <div style={{ marginTop: '35px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
      <div style={{ ...badgeStyle, padding: '8px 16px', borderRadius: '99px', display: 'inline-block', marginBottom: '15px' }}>
        {label}
      </div>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Confidence Score: {result.confidence}%</p>
      <ConfidenceBar confidence={result.confidence} color={barColor} />
      <FrameTable frameResults={result.frame_results} />
      {isFake && <DMCASection mediaType="video" />}
    </div>
  );
}
