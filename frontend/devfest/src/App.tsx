import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from './api/client';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import TherapistDashboard from './screens/TherapistDashboard';
import './App.css';

function App() {
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect: login,
    logout: auth0Logout,
    user,
    getAccessTokenSilently,
  } = useAuth0();
  const [profile, setProfile] = useState<{ user_id: string; therapist_id?: string | null; role?: string } | null | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(undefined);
      return;
    }
    getAccessTokenSilently({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      },
    })
      .then((token) => apiFetch('/me', { token }))
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, [isAuthenticated, getAccessTokenSilently]);

  const signup = () =>
    login({ authorizationParams: { screen_hint: 'signup' } });

  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  if (isLoading || (isAuthenticated && profile === undefined)) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && profile === null) {
    return <Onboarding />;
  }

  return isAuthenticated && profile ? (
    <div className="app-authenticated">
      <header className="app-header">
        <span>Logged in as {user?.email}</span>
        <button onClick={logout}>Logout</button>
      </header>
      {profile.role === 'user' ? (
        <Dashboard profile={{ user_id: profile.user_id, therapist_id: profile.therapist_id ?? null, role: profile.role }} />
      ) : profile.role === 'therapist' ? (
        <TherapistDashboard />
      ) : (
        <div className="therapist-view">
          <p>Therapy chat is available for clients only.</p>
        </div>
      )}
    </div>
  ) : (
    <>
      {error && <p>Error: {error.message}</p>}
      <button onClick={signup}>Signup</button>
      <button onClick={() => login()}>Login</button>
    </>
  );
}

export default App;
