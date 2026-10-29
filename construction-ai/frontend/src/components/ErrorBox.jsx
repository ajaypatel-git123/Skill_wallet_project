import React from 'react';

// ErrorBox component for displaying dismissible error alerts
export default function ErrorBox({ message, onDismiss }) {
  if (!message) return null;

  const displayMessage =
    typeof message === 'string'
      ? message
      : message?.response?.data?.detail ||
        message?.response?.data?.message ||
        message?.message ||
        'An unexpected error occurred. Please try again.';

  return (
    <div className="error-box" role="alert">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <span className="error-text">{displayMessage}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="error-dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
