import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from './api/client';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import TherapistDashboard from './screens/TherapistDashboard';
import Auth from './screens/Auth';
import './App.css';

function App() {
  const { isLoading, isAuthenticated, logout: auth0Logout, user, getAccessTokenSilently } = useAuth0();
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
        <div className="app-brand">
          <img src="/harbor-logo.png" alt="Harbor" className="app-logo" />
          <span className="app-name">Harbor</span>
        </div>
        <div className="app-header-right">
          <span>Logged in as {user?.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
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
    <Auth />
  );
}

export default App;
