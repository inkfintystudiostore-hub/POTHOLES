import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#0F172A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'monospace',
          zIndex: 999999
        }}>
          <div style={{
            background: '#1E293B',
            border: '2px solid #EF4444',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '650px',
            width: '100%'
          }}>
            <h2 style={{ color: '#EF4444', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              ⚠️ Application Render Error
            </h2>
            <p style={{ color: '#FCA5A5', fontSize: '13px', marginBottom: '16px' }}>
              {this.state.error?.toString()}
            </p>
            <pre style={{
              background: '#090D16',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '11px',
              overflowX: 'auto',
              color: '#94A3B8'
            }}>
              {this.state.error?.stack || this.state.errorInfo?.componentStack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                background: '#2563EB',
                color: '#FFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
