import React, { useRef, useState } from 'react';

export default function UploadForm({ onSubmit, isLoading }) {
  const [btnLabel, setBtnLabel] = useState('Analyze');
  const [preview, setPreview] = useState(null);
  const [previewType, setPreviewType] = useState(null); // 'image' | 'video'
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef();

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setPreviewType(isVideo ? 'video' : 'image');
      setBtnLabel(isVideo ? 'Analyze Video' : 'Analyze Image');
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setScanning(true);
    const file = fileRef.current.files[0];
    if (!file) return;
    onSubmit(file);
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label className="upload-label" onClick={() => fileRef.current.click()}>
          <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }}></i>
          <span>Click or Drag Image / Video Here</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/avi,video/quicktime,video/x-matroska"
            onChange={handleFileChange}
            hidden
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Analysing…' : btnLabel}
        </button>
      </form>

      {preview && (
        <div className={`image-container${scanning ? ' scanning' : ''}`}>
          <div className="scan-line"></div>
          {previewType === 'image' ? (
            <img src={preview} alt="preview" style={{ maxWidth: '300px', display: 'block' }} />
          ) : (
            <video
              src={preview}
              controls
              style={{ display: 'block', maxWidth: '300px', borderRadius: '10px' }}
            />
          )}
        </div>
      )}
    </>
  );
}
