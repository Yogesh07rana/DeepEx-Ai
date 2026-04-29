import React, { useEffect, useState } from 'react';

export default function ConfidenceBar({ confidence, color }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(confidence), 100);
    return () => clearTimeout(t);
  }, [confidence]);

  return (
    <div className="progress-container">
      <div
        className="progress-fill"
        style={{ width: `${width}%`, background: color || 'var(--primary)' }}
      />
    </div>
  );
}
