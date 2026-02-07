import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../api/client';
import ClientDetail from './ClientDetail';
import './TherapistDashboard.css';

type Client = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  last_activity: string | null;
};

export default function TherapistDashboard() {
  const { getAccessTokenSilently } = useAuth0();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
    });
    const list = (await apiFetch('/therapist/clients', { token })) as Client[];
    setClients(list);
  }, [getAccessTokenSilently]);

  useEffect(() => {
    fetchClients().finally(() => setLoading(false));
  }, [fetchClients]);

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
      />
    );
  }

  return (
    <div className="therapist-dashboard">
      <h2>Clients</h2>
      {loading ? (
        <p className="therapist-muted">Loading…</p>
      ) : clients.length === 0 ? (
        <p className="therapist-muted">No clients yet</p>
      ) : (
        <div className="client-tiles">
          {clients.map((c) => (
            <button
              key={c.user_id}
              type="button"
              className="client-tile"
              onClick={() => setSelectedClient(c)}
            >
              <span className="client-name">
                {c.first_name} {c.last_name}
              </span>
              <span className="client-email">{c.email}</span>
              {c.last_activity && (
                <span className="client-activity">
                  Last active: {new Date(c.last_activity).toLocaleDateString()}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
