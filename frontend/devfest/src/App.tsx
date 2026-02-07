import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from './api/client';
import Onboarding from './screens/Onboarding';
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
  const [profile, setProfile] = useState<{ user_id: string } | null | undefined>(undefined);

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

  return isAuthenticated ? (
    <>
      <p>Logged in as {user?.email}</p>
      <h1>User Profile</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <button onClick={logout}>Logout</button>
    </>
  ) : (
    <>
      {error && <p>Error: {error.message}</p>}
      <button onClick={signup}>Signup</button>
      <button onClick={() => login()}>Login</button>
    </>
  );
}

export default App;
