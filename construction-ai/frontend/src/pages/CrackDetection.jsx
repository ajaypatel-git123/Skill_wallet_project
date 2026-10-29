import React, { useState } from 'react';
import { analyzeCrack } from '../api';
import ImageUpload from '../components/ImageUpload';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';

// Crack Detection page: inspects structural surfaces for cracks, faults, and integrity risks
export default function CrackDetection() {
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or upload a crack or structural surface image first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);
    if (location.trim()) {
      formData.append('location', location.trim());
    }
    if (notes.trim()) {
      formData.append('notes', notes.trim());
    }

    try {
      const response = await analyzeCrack(formData);
      const body = response?.data || {};
      if (body.success === false) {
        setError(body.error || 'Crack detection failed.');
        return;
      }
      setResult(body.data || body);
    } catch (err) {
      console.error('Crack detection failed:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to detect cracks. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for badge color styling
  const getBadgeClass = (val) => {
    const s = String(val || '').toLowerCase();
    if (s.includes('critical') || s.includes('immediate') || s.includes('severe')) return 'badge-critical';
    if (s.includes('high') || s.includes('urgent') || s.includes('yes') || s.includes('structural')) return 'badge-high';
    if (s.includes('medium') || s.includes('moderate')) return 'badge-medium';
    if (s.includes('low') || s.includes('no') || s.includes('minor') || s.includes('surface')) return 'badge-low';
    return 'badge-medium';
  };

  // Safe defaults
  const crackDetected = result?.crack_detected ?? result?.detected ?? true;
  const crackType = result?.crack_type || result?.type || 'Not specified';
  const severity = result?.severity || result?.severity_level || 'Moderate';
  const urgency = result?.urgency || result?.urgency_level || 'Medium';
  const causes = Array.isArray(result?.possible_causes || result?.causes)
    ? result?.possible_causes || result?.causes
    : [];
  const actions = Array.isArray(result?.recommended_actions || result?.actions || result?.recommendations)
    ? result?.recommended_actions || result?.actions || result?.recommendations
    : [];
  const summary = result?.summary || result?.description || '';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Structural Crack Detection</h1>
          <p className="page-subtitle">
            Diagnose concrete and masonry cracks with AI vision. Assess crack classification, depth severity, root causes, and repair actions.
          </p>
        </div>
      </div>

      <div className="page-grid-2col">
        {/* Form Column */}
        <div className="form-column">
          <div className="card">
            <h2 className="card-section-title">Structural Image Input</h2>
            <form onSubmit={handleSubmit}>
              <ImageUpload
                label="Crack / Wall Photo"
                onFileSelect={(selected) => setFile(selected)}
              />

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label" htmlFor="crack-location">
                  Structural Location (Optional)
                </label>
                <input
                  id="crack-location"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Basement retaining wall, East pillar joint, Ceiling slab"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="crack-notes">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="crack-notes"
                  className="form-control"
                  rows="3"
                  placeholder="e.g. Noticeable widening after recent heavy rains, dampness detected..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Analyzing Structural Integrity...' : 'Detect Cracks'}
              </button>
            </form>
          </div>
        </div>

        {/* Results Column */}
        <div className="results-column">
          {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

          {loading && <Loader text="Diagnosing structural fissures and risk levels..." />}

          {!loading && !result && !error && (
            <div className="card empty-state-card">
              <span className="empty-state-icon">🔍</span>
              <p className="empty-state-title">No Crack Diagnosis Performed</p>
              <p className="empty-state-subtitle">
                Upload a photo of any beam, column, or masonry wall to detect fractures, evaluate depth risk, and view actionable repair guidance.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="results-stack">
              {/* Primary Assessment Badges */}
              <ResultCard title="Diagnostic Findings">
                <div className="badge-metrics-grid">
                  <div className="metric-box">
                    <span className="metric-box-label">Crack Detected</span>
                    <span className={`badge badge-large ${crackDetected ? 'badge-high' : 'badge-low'}`}>
                      {crackDetected ? 'YES' : 'NO'}
                    </span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-box-label">Crack Classification</span>
                    <span className={`badge badge-large ${getBadgeClass(crackType)}`}>
                      {crackType}
                    </span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-box-label">Severity Level</span>
                    <span className={`badge badge-large ${getBadgeClass(severity)}`}>
                      {severity}
                    </span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-box-label">Urgency</span>
                    <span className={`badge badge-large ${getBadgeClass(urgency)}`}>
                      {urgency}
                    </span>
                  </div>
                </div>

                {summary && (
                  <div className="summary-box" style={{ marginTop: '1.25rem' }}>
                    <p>{summary}</p>
                  </div>
                )}
              </ResultCard>

              {/* Possible Causes */}
              <ResultCard title="Possible Root Causes">
                {causes.length > 0 ? (
                  <ul className="bullet-list">
                    {causes.map((cause, idx) => (
                      <li key={idx} className="bullet-item">
                        <span className="bullet-dot">•</span>
                        <span>{typeof cause === 'string' ? cause : cause.cause || cause.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No specific causes identified or minimal degradation.</p>
                )}
              </ResultCard>

              {/* Recommended Actions */}
              <ResultCard title="Recommended Engineering Actions">
                {actions.length > 0 ? (
                  <ul className="bullet-list">
                    {actions.map((act, idx) => (
                      <li key={idx} className="bullet-item action-item">
                        <span className="action-step-num">{idx + 1}</span>
                        <span>{typeof act === 'string' ? act : act.action || act.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No immediate structural remediation required.</p>
                )}
              </ResultCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
