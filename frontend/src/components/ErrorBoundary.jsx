import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: 'var(--bg)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ background: 'var(--surface)', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: '#E24B4A15' }}
            >
              <AlertTriangle size={32} style={{ color: '#E24B4A' }} />
            </div>
            <h2
              className="text-lg font-black mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Oups, une erreur est survenue
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              L&apos;application a rencontré un problème. Veuillez réessayer.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #863bff, #7c3aed)',
                color: '#fff',
                border: 'none',
              }}
            >
              <RefreshCw size={15} />
              Réessayer
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
