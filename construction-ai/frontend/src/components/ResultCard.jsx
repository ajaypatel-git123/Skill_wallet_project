import React from 'react';

// ResultCard wrapper component for clean structured result display
export default function ResultCard({ title, subtitle, badge, action, children, className = '' }) {
  return (
    <div className={`card result-card ${className}`}>
      {(title || badge || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          <div className="card-header-actions">
            {badge && <span className="card-header-badge">{badge}</span>}
            {action && <div className="card-action-slot">{action}</div>}
          </div>
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}
