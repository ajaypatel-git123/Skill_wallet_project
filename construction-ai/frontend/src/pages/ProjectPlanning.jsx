import React, { useState } from 'react';
import { createPlan } from '../api';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';

// Project Planning page: generates detailed WBS, phases, materials, manpower, and risk assessments
export default function ProjectPlanning() {
  const [formData, setFormData] = useState({
    project_type: 'Residential',
    area_sqft: '',
    budget: '',
    duration_months: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.area_sqft || Number(formData.area_sqft) <= 0) {
      setError('Please provide a valid project area in sq. ft.');
      return;
    }
    if (!formData.budget || Number(formData.budget) <= 0) {
      setError('Please provide an estimated project budget.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      project_type: formData.project_type,
      area_sqft: Number(formData.area_sqft),
      budget: Number(formData.budget),
      duration_months: formData.duration_months ? Number(formData.duration_months) : undefined,
      location: formData.location.trim() || undefined
    };

    try {
      const response = await createPlan(payload);
      const body = response?.data || {};
      if (body.success === false) {
        setError(body.error || 'Planning failed.');
        return;
      }
      setResult(body.data || body);
    } catch (err) {
      console.error('Project planning failed:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to generate project plan. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  // Safe defaults
  const phases = Array.isArray(result?.phases) ? result.phases : [];
  const materials = Array.isArray(result?.materials) ? result.materials : [];
  const manpower = Array.isArray(result?.manpower) ? result.manpower : [];
  const risks = Array.isArray(result?.risks) ? result.risks : [];
  const totalCost = result?.total_cost ?? result?.estimated_cost ?? (formData.budget ? Number(formData.budget) : 0);
  const totalDuration = result?.total_duration_months ?? result?.duration_months ?? (formData.duration_months ? Number(formData.duration_months) : 'TBD');

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Intelligent Project Planning</h1>
          <p className="page-subtitle">
            Generate an AI-driven Work Breakdown Structure (WBS), project timeline phases, material quantity forecasts, and manpower allocation.
          </p>
        </div>
      </div>

      <div className="page-grid-2col">
        {/* Form Column */}
        <div className="form-column">
          <div className="card">
            <h2 className="card-section-title">Project Parameters</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="plan-type">
                  Project Classification
                </label>
                <select
                  id="plan-type"
                  name="project_type"
                  className="form-select"
                  value={formData.project_type}
                  onChange={handleInputChange}
                >
                  <option value="Residential">Residential Building</option>
                  <option value="Commercial">Commercial Complex</option>
                  <option value="Industrial">Industrial Facility</option>
                  <option value="Renovation">Renovation & Structural Retrofit</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="plan-area">
                    Built-up Area (sq. ft) *
                  </label>
                  <input
                    id="plan-area"
                    name="area_sqft"
                    type="number"
                    min="10"
                    required
                    className="form-control"
                    placeholder="e.g. 5000"
                    value={formData.area_sqft}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="plan-budget">
                    Target Budget (₹) *
                  </label>
                  <input
                    id="plan-budget"
                    name="budget"
                    type="number"
                    min="1000"
                    required
                    className="form-control"
                    placeholder="e.g. 7500000"
                    value={formData.budget}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="plan-duration">
                    Target Duration (Months)
                  </label>
                  <input
                    id="plan-duration"
                    name="duration_months"
                    type="number"
                    min="1"
                    className="form-control"
                    placeholder="e.g. 12"
                    value={formData.duration_months}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="plan-location">
                    Project Site / City
                  </label>
                  <input
                    id="plan-location"
                    name="location"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Hyderabad, India"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Synthesizing Project Schedule...' : 'Generate Plan'}
              </button>
            </form>
          </div>
        </div>

        {/* Results Column */}
        <div className="results-column">
          {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

          {loading && <Loader text="Computing structural sequencing, BOM materials, and labor demand..." />}

          {!loading && !result && !error && (
            <div className="card empty-state-card">
              <span className="empty-state-icon">📐</span>
              <p className="empty-state-title">No Project Plan Generated</p>
              <p className="empty-state-subtitle">
                Fill in your project specifications on the left to automatically calculate timeline milestones, material bills, manpower allocations, and risk mitigations.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="results-stack">
              {/* Executive Summary Card */}
              <ResultCard title="Executive Plan Overview">
                <div className="stats-row" style={{ marginTop: 0 }}>
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-details">
                      <span className="stat-number">{formatCurrency(totalCost)}</span>
                      <span className="stat-label">Estimated Total Budget</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-details">
                      <span className="stat-number">{totalDuration} Months</span>
                      <span className="stat-label">Projected Timeline</span>
                    </div>
                  </div>
                </div>

                {result.summary && (
                  <div className="summary-box" style={{ marginTop: '1.25rem' }}>
                    <p>{result.summary}</p>
                  </div>
                )}
              </ResultCard>

              {/* Timeline Phases Table */}
              <ResultCard title="Project Phases & Milestone Breakdown">
                {phases.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Phase Name</th>
                          <th>Duration</th>
                          <th>Key Deliverables / Tasks</th>
                          <th>Phase Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phases.map((p, idx) => {
                          const phaseName = p.name || p.phase || `Phase ${idx + 1}`;
                          const durationStr = p.duration || p.duration_weeks || p.duration_months || '-';
                          const tasksStr = Array.isArray(p.tasks)
                            ? p.tasks.join(', ')
                            : p.tasks || p.description || '-';
                          const costStr = p.cost !== undefined ? formatCurrency(p.cost) : '-';

                          return (
                            <tr key={idx}>
                              <td className="fw-medium">{phaseName}</td>
                              <td><span className="badge badge-light">{durationStr}</span></td>
                              <td className="text-secondary">{tasksStr}</td>
                              <td className="fw-semibold">{costStr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">No phase breakdown details provided.</p>
                )}
              </ResultCard>

              {/* Bill of Materials Table */}
              <ResultCard title="Estimated Materials Required">
                {materials.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Material Item</th>
                          <th>Estimated Quantity</th>
                          <th>Projected Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((m, idx) => {
                          const itemName = m.item || m.material || m.name || `Material #${idx + 1}`;
                          const qty = m.quantity || m.qty || '-';
                          const cost = m.cost !== undefined ? formatCurrency(m.cost) : '-';

                          return (
                            <tr key={idx}>
                              <td className="fw-medium">{itemName}</td>
                              <td>{qty}</td>
                              <td className="fw-semibold">{cost}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">No material bill estimates provided.</p>
                )}
              </ResultCard>

              {/* Manpower Allocation Table */}
              <ResultCard title="Manpower & Labor Deployment">
                {manpower.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Role / Skillset</th>
                          <th>Headcount Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manpower.map((mp, idx) => {
                          const role = mp.role || mp.trade || mp.position || `Role #${idx + 1}`;
                          const count = mp.count || mp.quantity || mp.workers || 1;

                          return (
                            <tr key={idx}>
                              <td className="fw-medium">{role}</td>
                              <td>
                                <span className="badge badge-light">{count} personnel</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">No labor allocation details provided.</p>
                )}
              </ResultCard>

              {/* Key Project Risks */}
              <ResultCard title="Key Project Risks & Mitigation">
                {risks.length > 0 ? (
                  <ul className="bullet-list">
                    {risks.map((r, idx) => (
                      <li key={idx} className="bullet-item">
                        <span className="bullet-dot">⚠️</span>
                        <span>{typeof r === 'string' ? r : r.risk || r.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No high-level risks identified.</p>
                )}
              </ResultCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
