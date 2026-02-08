import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.tsx'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong</h1>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      )
    }

    return this.props.children
  }
}

// Validate environment variables
if (!domain || !clientId) {
  console.error('Missing Auth0 configuration:', { domain, clientId, audience })
}

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <Auth0Provider
          domain={domain ?? ''}
          clientId={clientId ?? ''}
          authorizationParams={{
            redirect_uri: window.location.origin,
            ...(audience && { audience }),
          }}
        >
          <App />
        </Auth0Provider>
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (error) {
  console.error('Failed to render app:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Failed to start application</h1>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${error}</pre>
      <button onclick="window.location.reload()">Reload Page</button>
    </div>
  `
}
