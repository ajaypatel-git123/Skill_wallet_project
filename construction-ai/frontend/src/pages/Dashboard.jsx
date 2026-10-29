import React, { useEffect, useState } from 'react';
import { healthCheck } from '../api';

// Dashboard landing page displaying platform overview and feature cards
export default function Dashboard({ onNavigate }) {
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  useEffect(() => {
    // Check backend connectivity on mount
    healthCheck()
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'));
  }, []);

  const features = [
    {
      id: 'safety',
      icon: '📋',
      title: 'Safety Monitoring',
      description: 'Upload site photos to inspect PPE compliance (helmets, vests, boots) and detect hazardous violations in real-time.',
      badge: 'Vision AI',
      color: '#3b82f6'
    },
    {
      id: 'crack',
      icon: '🔍',
      title: 'Crack Detection',
      description: 'Automated structural defect diagnostics. Classify crack types, severity levels, root causes, and recommended repairs.',
      badge: 'Diagnostics',
      color: '#10b981'
    },
    {
      id: 'valuation',
      icon: '💰',
      title: 'Real Estate Valuation',
      description: 'Multimodal valuation engine analyzing location, square footage, property age, condition, and visual appraisal.',
      badge: 'Valuation',
      color: '#f59e0b'
    },
    {
      id: 'planning',
      icon: '📐',
      title: 'Project Planning',
      description: 'Generate comprehensive construction work breakdown structures, timeline phases, material costs, and manpower charts.',
      badge: 'Planning',
      color: '#8b5cf6'
    },
    {
      id: 'assistant',
      icon: '🌤️',
      title: 'Daily Assistant',
      description: 'Site manager daily briefing integrating weather forecasts, concrete pouring advisories, safety precautions, and checklists.',
      badge: 'Site Ops',
      color: '#06b6d4'
    },
    {
      id: 'knowledge',
      icon: '💬',
      title: 'Knowledge Chat',
      description: 'Conversational assistant trained on building codes, structural engineering standards, materials, and safety regulations.',
      badge: 'Expert Chat',
      color: '#ec4899'
    }
  ];

  return (
    <div className="page-container dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-tag">
            <span>🏗️ Next-Gen Construction AI</span>
            <span className={`status-pill ${serverStatus}`}>
              <span className="status-dot"></span>
              {serverStatus === 'online' ? 'API Connected' : serverStatus === 'offline' ? 'API Offline' : 'Connecting...'}
            </span>
          </div>
          <h1 className="hero-title">Construction Intelligence Platform</h1>
          <p className="hero-description">
            A comprehensive multimodal AI operations platform designed for construction engineers, site supervisors, and real estate professionals.
            Monitor site safety, diagnose structural integrity, estimate property valuations, and streamline project execution.
          </p>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-details">
            <span className="stat-number">Real-Time</span>
            <span className="stat-label">PPE & Hazard Detection</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧱</div>
          <div className="stat-details">
            <span className="stat-number">Sub-mm</span>
            <span className="stat-label">Structural Crack Analysis</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-details">
            <span className="stat-number">Automated</span>
            <span className="stat-label">Cost & Planning Estimation</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌤️</div>
          <div className="stat-details">
            <span className="stat-number">Weather-Aware</span>
            <span className="stat-label">Site Operations Advisory</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="section-header">
        <h2>Intelligence Modules</h2>
        <p>Select a module below to launch automated AI analysis and reporting.</p>
      </div>

      <div className="features-grid">
        {features.map((item) => (
          <div
            key={item.id}
            className="feature-card"
            onClick={() => onNavigate && onNavigate(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigate && onNavigate(item.id);
              }
            }}
          >
            <div className="feature-card-top">
              <span className="feature-icon" style={{ backgroundColor: `${item.color}15` }}>
                {item.icon}
              </span>
              <span className="badge badge-light">{item.badge}</span>
            </div>
            <h3 className="feature-title">{item.title}</h3>
            <p className="feature-description">{item.description}</p>
            <div className="feature-footer">
              <span className="feature-link">
                Open Tool <span>→</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
