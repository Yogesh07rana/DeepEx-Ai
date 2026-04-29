import React from 'react';

export default function FrameTable({ frameResults }) {
  if (!frameResults || !frameResults.length) return null;

  return (
    <>
      <h3 style={{ fontSize: '16px', margin: '20px 0 10px' }}>📊 Frame-by-Frame Analysis</h3>
      <div style={{ maxHeight: '220px', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.07)', position: 'sticky', top: 0 }}>
              <th style={{ padding: '10px' }}>Frame</th>
              <th style={{ padding: '10px' }}>Label</th>
              <th style={{ padding: '10px' }}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {frameResults.map((fr, idx) => (
              <tr
                key={idx}
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  background: fr.label === 'FAKE' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.06)',
                }}
              >
                <td style={{ padding: '8px' }}>#{fr.frame}</td>
                <td style={{ padding: '8px', fontWeight: 600, color: fr.label === 'FAKE' ? '#f87171' : '#4ade80' }}>
                  {fr.label}
                </td>
                <td style={{ padding: '8px' }}>{fr.confidence}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
