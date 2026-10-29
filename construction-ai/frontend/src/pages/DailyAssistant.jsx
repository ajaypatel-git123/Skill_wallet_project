import React, { useState } from 'react';
import { getDailyAssistant } from '../api';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';

// Daily Assistant page: site manager daily briefing with weather advisory and checklists
export default function DailyAssistant() {
  const [city, setCity] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Interactive local checklist state for site supervisors
  const [checkedItems, setCheckedItems] = useState({});

  const toggleChecklist = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city.trim()) {
      setError('Please provide a site city or location name.');
      return;
    }
    if (!workDescription.trim()) {
      setError('Please describe the scheduled site activities for today.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCheckedItems({});

    try {
      const response = await getDailyAssistant({
        city: city.trim(),
        work_description: workDescription.trim()
      });
      const body = response?.data || {};
      if (body.success === false) {
        setError(body.error || 'Daily briefing failed.');
        return;
      }
      setResult(body.data || body);
    } catch (err) {
      console.error('Daily assistant failed:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to fetch daily briefing. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for recommendation badges
  const getAdvisoryBadgeClass = (rec) => {
    const s = String(rec || '').toLowerCase();
    if (s.includes('postpone') || s.includes('stop') || s.includes('danger')) return 'badge-critical';
    if (s.includes('caution') || s.includes('warning') || s.includes('delay')) return 'badge-medium';
    if (s.includes('proceed') || s.includes('safe') || s.includes('go')) return 'badge-low';
    return 'badge-medium';
  };

  // Extract weather details safely
  const weather = result?.weather || {};
  const temp = weather.temperature || weather.temp || '--';
  const rainChance = weather.rain_chance || weather.rain_probability || weather.precipitation || '--';
  const wind = weather.wind_speed || weather.wind || '--';
  const condition = weather.condition || weather.summary || 'Clear Skies';
  const weatherEmoji = weather.icon || (condition.toLowerCase().includes('rain') ? '🌧️' : condition.toLowerCase().includes('cloud') ? '⛅' : '☀️');

  // Extract advisories
  const advisories = Array.isArray(result?.work_advisory || result?.advisories)
    ? result?.work_advisory || result?.advisories
    : [];

  // Extract safety tips
  const safetyTips = Array.isArray(result?.safety_tips) ? result.safety_tips : [];

  // Extract daily checklist
  const dailyChecklist = Array.isArray(result?.daily_checklist || result?.checklist)
    ? result?.daily_checklist || result?.checklist
    : [];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Site Assistant & Weather Briefing</h1>
          <p className="page-subtitle">
            Get instant weather impact assessments on outdoor operations (concrete curing, lifting, earthworks), safety alerts, and daily site checklists.
          </p>
        </div>
      </div>

      <div className="page-grid-2col">
        {/* Form Column */}
        <div className="form-column">
          <div className="card">
            <h2 className="card-section-title">Site Operations Input</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="site-city">
                  Site City / Region *
                </label>
                <input
                  id="site-city"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Mumbai, New Delhi, Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="site-work">
                  Today's Scheduled Work Description *
                </label>
                <textarea
                  id="site-work"
                  rows="4"
                  required
                  className="form-control"
                  placeholder="e.g. Slab casting on Level 3, external crane lifting for steel trusses, excavation of drain trench..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Synthesizing Daily Briefing...' : 'Get Daily Briefing'}
              </button>
            </form>
          </div>
        </div>

        {/* Results Column */}
        <div className="results-column">
          {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

          {loading && <Loader text="Fetching meteorological reports and cross-referencing site protocols..." />}

          {!loading && !result && !error && (
            <div className="card empty-state-card">
              <span className="empty-state-icon">🌤️</span>
              <p className="empty-state-title">No Daily Briefing Yet</p>
              <p className="empty-state-subtitle">
                Provide your project site location and planned activities to generate automated weather advisories, hazard mitigations, and site execution checklists.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="results-stack">
              {/* Weather Card */}
              <ResultCard title={`Weather Advisory — ${city}`}>
                <div className="weather-display-card">
                  <div className="weather-main">
                    <span className="weather-emoji">{weatherEmoji}</span>
                    <div>
                      <span className="weather-condition-text">{condition}</span>
                      <span className="weather-temp-text">{temp}</span>
                    </div>
                  </div>

                  <div className="weather-metrics-grid">
                    <div className="weather-metric">
                      <span className="weather-label">Rain Risk</span>
                      <span className="weather-val">{rainChance}</span>
                    </div>
                    <div className="weather-metric">
                      <span className="weather-label">Wind Velocity</span>
                      <span className="weather-val">{wind}</span>
                    </div>
                    {weather.humidity && (
                      <div className="weather-metric">
                        <span className="weather-label">Humidity</span>
                        <span className="weather-val">{weather.humidity}</span>
                      </div>
                    )}
                  </div>
                </div>

                {result.summary && (
                  <div className="summary-box" style={{ marginTop: '1rem' }}>
                    <p>{result.summary}</p>
                  </div>
                )}
              </ResultCard>

              {/* Work Advisory Table */}
              <ResultCard title="Activity Feasibility & Weather Advisory">
                {advisories.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Scheduled Activity</th>
                          <th>Advisory Recommendation</th>
                          <th>Weather Rationale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advisories.map((item, idx) => {
                          const task = typeof item === 'string' ? item : item.task || item.activity || `Task #${idx + 1}`;
                          const recommendation = typeof item === 'object' ? item.recommendation || item.status || 'Proceed' : 'Proceed';
                          const rationale = typeof item === 'object' ? item.reason || item.rationale || item.notes || 'Normal operating window' : '';

                          return (
                            <tr key={idx}>
                              <td className="fw-medium">{task}</td>
                              <td>
                                <span className={`badge ${getAdvisoryBadgeClass(recommendation)}`}>
                                  {recommendation}
                                </span>
                              </td>
                              <td className="text-secondary">{rationale}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">All scheduled activities cleared for normal operation.</p>
                )}
              </ResultCard>

              {/* Safety Precautions Checklist */}
              <ResultCard title="Mandatory Safety Precautions">
                {safetyTips.length > 0 ? (
                  <ul className="checklist">
                    {safetyTips.map((tip, idx) => {
                      const tipId = `safety-tip-${idx}`;
                      const isChecked = !!checkedItems[tipId];
                      return (
                        <li
                          key={idx}
                          className={`checklist-item ${isChecked ? 'completed' : ''}`}
                          onClick={() => toggleChecklist(tipId)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="checkbox-custom"
                          />
                          <span className="checklist-text">
                            {typeof tip === 'string' ? tip : tip.tip || tip.description}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-muted">Standard safety PPE rules apply.</p>
                )}
              </ResultCard>

              {/* Daily Site Checklist */}
              <ResultCard title="Supervisor Daily Punch Checklist">
                {dailyChecklist.length > 0 ? (
                  <ul className="checklist">
                    {dailyChecklist.map((item, idx) => {
                      const checkId = `daily-check-${idx}`;
                      const isChecked = !!checkedItems[checkId];
                      return (
                        <li
                          key={idx}
                          className={`checklist-item ${isChecked ? 'completed' : ''}`}
                          onClick={() => toggleChecklist(checkId)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="checkbox-custom"
                          />
                          <span className="checklist-text">
                            {typeof item === 'string' ? item : item.task || item.item}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-muted">No custom checklist items generated.</p>
                )}
              </ResultCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
