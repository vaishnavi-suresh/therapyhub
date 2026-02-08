import { useAuth0 } from '@auth0/auth0-react';
import logo from '../assets/logo.png';
import './Auth.css';

export default function Auth() {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="auth">
        <div className="auth-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="auth">
        <div className="auth-card">
          <img src="/harbor-logo.png" alt="Harbor" className="auth-logo auth-logo-sm" />
          <h1>Signed in</h1>
          <p className="auth-user">{user.email ?? user.name}</p>
          <button type="button" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <img src={logo} alt="Harbor" className="auth-logo" />
        <h1 className="auth-welcome">Welcome to Harbor</h1>
        <p className="auth-tagline">Your supportive therapeutic chat assistant</p>
        <p className="auth-hint">Sign in or create an account to get started</p>
        <div className="auth-actions">
          <button type="button" className="auth-primary" onClick={() => loginWithRedirect()}>
            Sign in
          </button>
          <button
            type="button"
            className="auth-secondary"
            onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
