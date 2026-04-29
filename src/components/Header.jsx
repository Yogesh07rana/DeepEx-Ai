import React, { useEffect, useRef, useState } from 'react';

export default function Header() {
  const fullText = 'DeepEx AI';
  const [typed, setTyped] = useState('');
  
  const i = useRef(0);

  useEffect(() => {
    i.current = 0;
    
    const interval = setInterval(() => {
      if (i.current <= fullText.length) {
        setTyped(fullText.slice(0, i.current));
        i.current=i.current + 1;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="header">
      <h1 className="title">
        <span style={{ background: 'none', WebkitTextFillColor: 'initial' }}>🔍 </span>
        <span>{typed}</span>
      </h1>

      <div className="social-icons">
        <a href="https://www.linkedin.com/in/yogesh07rana" target="_blank" rel="noreferrer">
          <i className="fa-brands fa-linkedin"></i>
        </a>
        <a href="https://github.com/Yogesh07rana" target="_blank" rel="noreferrer">
          <i className="fa-brands fa-github"></i>
        </a>
      </div>

      <div className="subtitle">
        AI Powered Deepfake Detection<br />
        <span style={{ opacity: 0.7, fontSize: '12px' }}>
          Using Vision Transformers
        </span>
      </div>
    </div>
  );
}