import React from 'react';

// Loader component displaying a spinner and status message
export default function Loader({ text = 'Analyzing...' }) {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p className="loader-text">{text}</p>
    </div>
  );
}
