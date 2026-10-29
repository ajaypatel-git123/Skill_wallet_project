import React, { useState } from 'react';
import { getValuation } from '../api';
import ImageUpload from '../components/ImageUpload';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';

// Real Estate Valuation page: automated multimodal property assessment
export default function Valuation() {
  const [formData, setFormData] = useState({
    location: '',
    property_type: 'Apartment',
    area_sqft: '',
    age_years: '',
    bedrooms: '2',
    condition: 'Good',
    amenities: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location.trim()) {
      setError('Please provide a property location.');
      return;
    }
    if (!formData.area_sqft || Number(formData.area_sqft) <= 0) {
      setError('Please specify a valid area in sq ft.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const payload = new FormData();
    payload.append('location', formData.location.trim());
    payload.append('property_type', formData.property_type);
    payload.append('area_sqft', formData.area_sqft);
    payload.append('age_years', formData.age_years || '0');
    payload.append('bedrooms', formData.bedrooms);
    payload.append('condition', formData.condition);
    payload.append('amenities', formData.amenities.trim());

    if (imageFile) {
      payload.append('image', imageFile);
    }

    try {
      const response = await getValuation(payload);
      const body = response?.data || {};
      if (body.success === false) {
        setError(body.error || 'Valuation failed.');
        return;
      }
      setResult(body.data || body);
    } catch (err) {
      console.error('Valuation error:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to calculate property valuation. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Safe currency formatter (INR ₹)
  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  // Safe impact badge styling
  const getImpactBadgeClass = (impact) => {
    const s = String(impact || '').toLowerCase();
    if (s.includes('positive') || s.includes('+') || s.includes('high') || s.includes('gain')) return 'badge-low';
    if (s.includes('negative') || s.includes('-') || s.includes('loss') || s.includes('drop')) return 'badge-high';
    return 'badge-medium';
  };

  // Normalize factors list
  const factors = Array.isArray(result?.factors)
    ? result.factors
    : typeof result?.factors === 'object' && result?.factors !== null
    ? Object.entries(result.factors).map(([factor, impact]) => ({ factor, impact }))
    : [];

  const estimatedValue = result?.estimated_value ?? result?.valuation ?? result?.price ?? 0;
  const minRange = result?.price_range?.min ?? result?.min_price ?? (estimatedValue ? Math.round(estimatedValue * 0.92) : 0);
  const maxRange = result?.price_range?.max ?? result?.max_price ?? (estimatedValue ? Math.round(estimatedValue * 1.08) : 0);
  const pricePerSqft = result?.price_per_sqft ?? (formData.area_sqft > 0 ? Math.round(estimatedValue / Number(formData.area_sqft)) : 0);
  const disclaimer = result?.disclaimer || 'Disclaimer: This estimated valuation is generated using AI market analysis heuristics, location trends, and condition assessments. It should be used as a guide and does not substitute for a certified structural appraisal or bank assessment.';

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Real Estate AI Valuation</h1>
          <p className="page-subtitle">
            Estimate market valuation and price per sqft using structural attributes, property age, amenity scoring, and visual appraisal.
          </p>
        </div>
      </div>

      <div className="page-grid-2col">
        {/* Form Column */}
        <div className="form-column">
          <div className="card">
            <h2 className="card-section-title">Property Details</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="prop-loc">
                  Location / Micro-Market *
                </label>
                <input
                  id="prop-loc"
                  name="location"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Bandra West, Mumbai or Whitefield, Bangalore"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="prop-type">
                    Property Type
                  </label>
                  <select
                    id="prop-type"
                    name="property_type"
                    className="form-select"
                    value={formData.property_type}
                    onChange={handleInputChange}
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Villa">Villa</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Land">Land</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prop-area">
                    Area (sq. ft) *
                  </label>
                  <input
                    id="prop-area"
                    name="area_sqft"
                    type="number"
                    min="1"
                    required
                    className="form-control"
                    placeholder="e.g. 1250"
                    value={formData.area_sqft}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="prop-bedrooms">
                    Bedrooms
                  </label>
                  <select
                    id="prop-bedrooms"
                    name="bedrooms"
                    className="form-select"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} BHK / Room{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prop-age">
                    Property Age (Years)
                  </label>
                  <input
                    id="prop-age"
                    name="age_years"
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="e.g. 5"
                    value={formData.age_years}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prop-condition">
                  Structural Condition
                </label>
                <select
                  id="prop-condition"
                  name="condition"
                  className="form-select"
                  value={formData.condition}
                  onChange={handleInputChange}
                >
                  <option value="Excellent">Excellent (New / Fully Renovated)</option>
                  <option value="Good">Good (Well Maintained)</option>
                  <option value="Average">Average (Minor Wear & Tear)</option>
                  <option value="Poor">Poor (Major Repairs Required)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prop-amenities">
                  Key Amenities & Upgrades
                </label>
                <textarea
                  id="prop-amenities"
                  name="amenities"
                  className="form-control"
                  rows="2"
                  placeholder="e.g. Covered parking, 24/7 backup power, modular kitchen, balcony garden, swimming pool..."
                  value={formData.amenities}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <ImageUpload
                  label="Optional Property Photo (Facade / Interior)"
                  onFileSelect={(file) => setImageFile(file)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Evaluating Market Factors...' : 'Get Valuation'}
              </button>
            </form>
          </div>
        </div>

        {/* Results Column */}
        <div className="results-column">
          {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

          {loading && <Loader text="Running automated comparative valuation algorithm..." />}

          {!loading && !result && !error && (
            <div className="card empty-state-card">
              <span className="empty-state-icon">💰</span>
              <p className="empty-state-title">Ready for Valuation</p>
              <p className="empty-state-subtitle">
                Enter the property location, square footage, condition, and optional site photos to calculate instant market appraisal.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="results-stack">
              {/* Valuation Hero Card */}
              <ResultCard title="Estimated Property Valuation">
                <div className="valuation-hero-display">
                  <div className="valuation-amount-box">
                    <span className="valuation-currency-tag">Estimated Market Price</span>
                    <h2 className="valuation-amount">{formatCurrency(estimatedValue)}</h2>
                  </div>

                  <div className="valuation-secondary-metrics">
                    <div className="val-submetric">
                      <span className="val-submetric-label">Estimated Range</span>
                      <span className="val-submetric-val">
                        {formatCurrency(minRange)} – {formatCurrency(maxRange)}
                      </span>
                    </div>

                    <div className="val-submetric">
                      <span className="val-submetric-label">Price per Sq. Ft</span>
                      <span className="val-submetric-val">{formatCurrency(pricePerSqft)} / sqft</span>
                    </div>
                  </div>
                </div>

                {result.summary && (
                  <div className="summary-box" style={{ marginTop: '1.25rem' }}>
                    <p>{result.summary}</p>
                  </div>
                )}
              </ResultCard>

              {/* Valuation Factors Table */}
              <ResultCard title="Valuation Breakdown & Market Factors">
                {factors.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Valuation Driver</th>
                          <th>Market Influence</th>
                          <th>Impact Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {factors.map((f, i) => {
                          const name = typeof f === 'object' ? f.factor || f.name || f.driver || 'Factor' : String(f);
                          const impact = typeof f === 'object' ? f.impact || f.description || f.weight || 'Neutral' : 'Analyzed';
                          const status = typeof f === 'object' ? f.status || f.level || impact : 'Neutral';

                          return (
                            <tr key={i}>
                              <td className="fw-medium">{name}</td>
                              <td>{impact}</td>
                              <td>
                                <span className={`badge ${getImpactBadgeClass(status)}`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">Standard market baseline applied without variance factors.</p>
                )}
              </ResultCard>

              {/* Disclaimer */}
              <div className="disclaimer-container">
                <p className="disclaimer-text">
                  <em>{disclaimer}</em>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
