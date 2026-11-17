import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          role="alert"
          className="panel panel-pad"
          style={{
            maxWidth: 520,
            margin: '48px auto',
            textAlign: 'center',
            padding: '36px 24px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(255, 107, 107, 0.15)',
              color: 'var(--coral, #ff6b6b)',
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
            An unexpected error occurred while rendering this view. Your saved data is safe.
          </p>
          {this.state.error && (
            <pre
              style={{
                background: 'var(--panel-alt, rgba(0,0,0,0.2))',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 11,
                color: 'var(--coral)',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: 20,
                maxHeight: 120,
              }}
            >
              {this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" type="button" onClick={this.handleReload}>
              <RotateCcw size={15} /> Reload app
            </button>
            <button className="btn btn-quiet" type="button" onClick={this.handleReset}>
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
