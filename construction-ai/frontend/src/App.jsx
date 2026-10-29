import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import SafetyMonitoring from './pages/SafetyMonitoring';
import CrackDetection from './pages/CrackDetection';
import Valuation from './pages/Valuation';
import ProjectPlanning from './pages/ProjectPlanning';
import DailyAssistant from './pages/DailyAssistant';
import KnowledgeChat from './pages/KnowledgeChat';
import History from './pages/History';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'safety', label: 'Safety Monitoring', icon: '📋' },
    { id: 'crack', label: 'Crack Detection', icon: '🔍' },
    { id: 'valuation', label: 'Real Estate Valuation', icon: '💰' },
    { id: 'planning', label: 'Project Planning', icon: '📐' },
    { id: 'assistant', label: 'Daily Assistant', icon: '🌤️' },
    { id: 'knowledge', label: 'Knowledge Chat', icon: '💬' },
    { id: 'history', label: 'History', icon: '📚' }
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={(id) => setActivePage(id)} />;
      case 'safety':
        return <SafetyMonitoring />;
      case 'crack':
        return <CrackDetection />;
      case 'valuation':
        return <Valuation />;
      case 'planning':
        return <ProjectPlanning />;
      case 'assistant':
        return <DailyAssistant />;
      case 'knowledge':
        return <KnowledgeChat />;
      case 'history':
        return <History />;
      default:
        return <Dashboard onNavigate={(id) => setActivePage(id)} />;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="mobile-brand">
          <span className="brand-logo">🏗️</span>
          <span className="brand-name">ConstructAI</span>
        </div>
        <button
          type="button"
          className="mobile-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Left Sidebar */}
      <aside className={`app-sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <span className="brand-icon">🏗️</span>
          </div>
          <div className="brand-text">
            <h2 className="brand-title">ConstructAI</h2>
            <span className="brand-subtitle">Intelligence Suite</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">NAVIGATION</div>
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.id} className="nav-list-item">
                <button
                  type="button"
                  className={`nav-button ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {activePage === item.id && <span className="nav-active-pip" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="system-status-indicator">
            <span className="status-indicator-dot"></span>
            <span className="status-indicator-text">System v1.0 • Connected</span>
          </div>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="app-content">
        <div className="content-inner">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
}
