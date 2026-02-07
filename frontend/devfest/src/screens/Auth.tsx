import { useAuth0 } from '@auth0/auth0-react';
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
        <h1>Sign in</h1>
        <p className="auth-hint">Sign in or create an account to continue</p>
        <div className="auth-actions">
          <button type="button" onClick={() => loginWithRedirect()}>
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
