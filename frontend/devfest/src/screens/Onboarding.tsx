import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../api/client';
import './Onboarding.css';

type Therapist = { user_id: string; email: string; first_name: string; last_name: string };

export default function Onboarding() {
  const { user, getAccessTokenSilently } = useAuth0();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'therapist' | 'client'>('client');
  const [therapistSearch, setTherapistSearch] = useState('');
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!therapistSearch.trim() || role !== 'client') {
      setTherapists([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
        });
        const list = await apiFetch(`/therapists`, { token });
        const filtered = (list as Therapist[]).filter((t) =>
          t.email.toLowerCase().includes(therapistSearch.trim().toLowerCase())
        );
        setTherapists(filtered);
        setSelectedTherapist(null);
      } catch {
        setTherapists([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [therapistSearch, role, getAccessTokenSilently]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const nameParts = name.trim().split(/\s+/);
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    if (!first_name) {
      setError('Please enter your name');
      return;
    }

    if (!user?.sub || !user?.email) {
      setError('Authentication error');
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });

      if (role === 'therapist') {
        await apiFetch('/', {
          method: 'POST',
          token,
          body: JSON.stringify({
            external_auth_id: user.sub,
            email: user.email,
            first_name,
            last_name,
            role: 'therapist',
            therapist_id: null,
            client_ids: [],
          }),
        });
        window.location.reload();
        return;
      }

      if (!selectedTherapist) {
        setError('Please select your therapist');
        setLoading(false);
        return;
      }

      const created = await apiFetch('/', {
        method: 'POST',
        token,
        body: JSON.stringify({
          external_auth_id: user.sub,
          email: user.email,
          first_name,
          last_name,
          role: 'user',
          therapist_id: selectedTherapist.user_id,
          client_ids: [],
        }),
      });

      await apiFetch('/therapists/add-client', {
        method: 'POST',
        token,
        body: JSON.stringify({
          therapist_user_id: selectedTherapist.user_id,
          client_user_id: created.user_id,
        }),
      });

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <h1>Complete your profile</h1>
        <p>Set up your account to get started</p>
        <form onSubmit={handleSubmit} className="onboarding-form">
          <label>
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </label>
          <label>
            Phone number
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </label>
          <label>
            I am a
            <div className="onboarding-radio">
              <label className="radio-option">
                <input
                  type="radio"
                  name="role"
                  checked={role === 'client'}
                  onChange={() => setRole('client')}
                />
                Client
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="role"
                  checked={role === 'therapist'}
                  onChange={() => setRole('therapist')}
                />
                Therapist
              </label>
            </div>
          </label>
          {role === 'client' && (
            <label>
              Search for your therapist by email
              <input
                type="email"
                value={therapistSearch}
                onChange={(e) => setTherapistSearch(e.target.value)}
                placeholder="therapist@example.com"
              />
              {therapists.length > 0 && (
                <ul className="therapist-list">
                  {therapists.map((t) => (
                    <li
                      key={t.user_id}
                      className={selectedTherapist?.user_id === t.user_id ? 'selected' : ''}
                      onClick={() => setSelectedTherapist(t)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedTherapist(t)}
                      role="button"
                      tabIndex={0}
                    >
                      {t.first_name} {t.last_name} — {t.email}
                    </li>
                  ))}
                </ul>
              )}
              {therapistSearch && therapists.length === 0 && (
                <p className="onboarding-hint">No therapist found with that email</p>
              )}
              {selectedTherapist && (
                <p className="onboarding-selected">
                  Selected: {selectedTherapist.first_name} {selectedTherapist.last_name}
                </p>
              )}
            </label>
          )}
          {error && <p className="onboarding-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Complete'}
          </button>
        </form>
      </div>
    </div>
  );
}
