import React, { useState, useRef } from 'react';

// ImageUpload component with drag-and-drop and image preview
export default function ImageUpload({ onFileSelect, label = 'Upload Site Image' }) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null);
  };

  return (
    <div className="image-upload-wrapper">
      {label && <label className="form-label">{label}</label>}
      <div
        className={`dropzone ${isDragging ? 'dragover' : ''} ${preview ? 'has-preview' : ''}`}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={onInputChange}
          className="file-input-hidden"
        />

        {preview ? (
          <div className="preview-container">
            <img src={preview} alt="Site preview" className="preview-image" />
            <div className="preview-overlay">
              <span className="file-name-tag">{fileName}</span>
              <button
                type="button"
                className="btn-clear-image"
                onClick={handleClear}
                title="Remove image"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="dropzone-placeholder">
            <span className="dropzone-icon">📷</span>
            <p className="dropzone-text">
              <strong>Click to upload</strong> or drag & drop an image here
            </p>
            <p className="dropzone-hint">Supports PNG, JPG, JPEG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
}
