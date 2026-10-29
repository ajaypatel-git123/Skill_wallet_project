import React, { useState } from 'react';
import { analyzeSafety } from '../api';
import ImageUpload from '../components/ImageUpload';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';

// Safety Monitoring page: uploads site photo and performs PPE & hazard inspection
export default function SafetyMonitoring() {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drag-and-drop a construction site image first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);
    if (notes.trim()) {
      formData.append('notes', notes.trim());
    }

    try {
      const response = await analyzeSafety(formData);
      const body = response?.data || {};
      if (body.success === false) {
        setError(body.error || 'Safety analysis failed.');
        return;
      }
      setResult(body.data || body);
    } catch (err) {
      console.error('Safety analysis failed:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to analyze safety image. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to return CSS class based on severity/risk string
  const getSeverityBadgeClass = (level) => {
    const l = String(level || '').toLowerCase();
    if (l.includes('critical')) return 'badge-critical';
    if (l.includes('high')) return 'badge-high';
    if (l.includes('medium') || l.includes('moderate')) return 'badge-medium';
    if (l.includes('low') || l.includes('pass') || l.includes('safe')) return 'badge-low';
    return 'badge-medium';
  };

  // Safely extract overall risk
  const overallRisk = result?.overall_risk || result?.risk_level || result?.risk || 'Unknown';

  // Normalize PPE compliance items into a unified array [{ label, compliant, details }]
  const renderPpeItems = () => {
    const rawPpe = result?.ppe_compliance || result?.ppe || {};
    if (Array.isArray(rawPpe)) {
      return rawPpe.map((item, idx) => {
        if (typeof item === 'string') {
          return { label: item, compliant: !item.toLowerCase().includes('missing'), key: idx };
        }
        return {
          label: item.item || item.name || item.equipment || `PPE Item #${idx + 1}`,
          compliant: item.compliant !== undefined ? Boolean(item.compliant) : Boolean(item.detected || item.present),
          details: item.details || item.status || '',
          key: idx
        };
      });
    } else if (typeof rawPpe === 'object' && rawPpe !== null) {
      return Object.entries(rawPpe).map(([key, val], idx) => {
        const isCompliant = typeof val === 'boolean' ? val : Boolean(val?.compliant ?? val?.detected ?? true);
        const details = typeof val === 'object' && val !== null ? val.details || val.status : '';
        return {
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          compliant: isCompliant,
          details: details || (isCompliant ? 'Compliant' : 'Missing / Incomplete'),
          key: idx
        };
      });
    }
    return [];
  };

  const ppeList = renderPpeItems();
  const violations = Array.isArray(result?.violations) ? result.violations : [];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Site Safety & PPE Monitoring</h1>
          <p className="page-subtitle">
            Upload site inspection photos to automatically audit Personal Protective Equipment (PPE) compliance and identify safety hazards.
          </p>
        </div>
      </div>

      <div className="page-grid-2col">
        {/* Input Form Column */}
        <div className="form-column">
          <div className="card">
            <h2 className="card-section-title">Site Inspection Input</h2>
            <form onSubmit={handleSubmit}>
              <ImageUpload
                label="Site Photo (Inspects PPE, fall hazards, scaffolding)"
                onFileSelect={(selected) => setFile(selected)}
              />

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label" htmlFor="safety-notes">
                  Observation Notes (Optional)
                </label>
                <textarea
                  id="safety-notes"
                  className="form-control"
                  rows="3"
                  placeholder="e.g. Scaffolding section B on the 4th floor, morning shift inspection..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Analyzing Site Safety...' : 'Analyze Safety'}
              </button>
            </form>
          </div>
        </div>

        {/* Results Column */}
        <div className="results-column">
          {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

          {loading && <Loader text="Analyzing PPE compliance and hazard zones..." />}

          {!loading && !result && !error && (
            <div className="card empty-state-card">
              <span className="empty-state-icon">📋</span>
              <p className="empty-state-title">No Safety Analysis Run Yet</p>
              <p className="empty-state-subtitle">
                Select a construction site photo on the left and click "Analyze Safety" to review risk scores, PPE checklists, and violations.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="results-stack">
              {/* Overall Risk Header Card */}
              <ResultCard title="Safety Audit Summary">
                <div className="risk-overview-row">
                  <div>
                    <span className="overview-label">Overall Site Risk Level</span>
                    <div style={{ marginTop: '0.35rem' }}>
                      <span className={`badge badge-large ${getSeverityBadgeClass(overallRisk)}`}>
                        {overallRisk.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {result.confidence !== undefined && (
                    <div className="overview-stat">
                      <span className="overview-label">Confidence Score</span>
                      <span className="overview-value">
                        {typeof result.confidence === 'number'
                          ? `${(result.confidence * (result.confidence <= 1 ? 100 : 1)).toFixed(0)}%`
                          : result.confidence}
                      </span>
                    </div>
                  )}
                  {result.worker_count !== undefined && (
                    <div className="overview-stat">
                      <span className="overview-label">Workers Detected</span>
                      <span className="overview-value">{result.worker_count}</span>
                    </div>
                  )}
                </div>

                {result.summary && (
                  <div className="summary-box">
                    <p>{result.summary}</p>
                  </div>
                )}
              </ResultCard>

              {/* PPE Compliance Grid */}
              <ResultCard title="PPE Compliance Checklist">
                {ppeList.length > 0 ? (
                  <div className="ppe-grid">
                    {ppeList.map((item) => (
                      <div
                        key={item.key}
                        className={`ppe-item ${item.compliant ? 'ppe-pass' : 'ppe-fail'}`}
                      >
                        <div className="ppe-status-icon">
                          {item.compliant ? '✅' : '❌'}
                        </div>
                        <div className="ppe-info">
                          <span className="ppe-name">{item.label}</span>
                          <span className="ppe-detail">
                            {item.details || (item.compliant ? 'Compliant' : 'Non-compliant')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No specific PPE items reported.</p>
                )}
              </ResultCard>

              {/* Violations & Hazards List */}
              <ResultCard
                title={`Detected Violations (${violations.length})`}
                badge={
                  violations.length > 0 ? (
                    <span className="badge badge-high">{violations.length} Hazard(s)</span>
                  ) : (
                    <span className="badge badge-low">Zero Violations</span>
                  )
                }
              >
                {violations.length > 0 ? (
                  <ul className="violations-list">
                    {violations.map((v, i) => {
                      const title = typeof v === 'string' ? v : v.violation || v.issue || v.description || 'Violation';
                      const severity = typeof v === 'object' && v?.severity ? v.severity : 'Medium';
                      const recommendation = typeof v === 'object' ? v.recommendation || v.fix : null;

                      return (
                        <li key={i} className="violation-item">
                          <div className="violation-header">
                            <span className="violation-title">{title}</span>
                            <span className={`badge ${getSeverityBadgeClass(severity)}`}>
                              {severity}
                            </span>
                          </div>
                          {recommendation && (
                            <p className="violation-recommendation">
                              <strong>Corrective Action:</strong> {recommendation}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="alert-success-box">
                    🎉 Excellent! No safety violations or missing PPE detected in this image.
                  </div>
                )}
              </ResultCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
