import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui' }}>
          <h1 style={{ color: '#ef4444' }}>Something went wrong</h1>
          <pre style={{ 
            background: '#1e1e1e', 
            color: '#f0f0f0', 
            padding: 20, 
            borderRadius: 8,
            overflow: 'auto'
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              marginTop: 20, 
              padding: '10px 20px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
