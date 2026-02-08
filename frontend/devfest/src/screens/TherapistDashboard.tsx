import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../api/client';
import ClientDetail from './ClientDetail';
import MeetingRecordings from './MeetingRecordings';
import './TherapistDashboard.css';

type Client = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  last_activity: string | null;
};

export default function TherapistDashboard({ therapistId }: { therapistId: string }) {
  const { getAccessTokenSilently } = useAuth0();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeView, setActiveView] = useState<'clients' | 'recordings'>('clients');

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
        therapistId={therapistId}
        onBack={() => setSelectedClient(null)}
      />
    );
  }

  return (
    <div className="therapist-dashboard">
      <div className="therapist-hero">
        <div className="therapist-hero-content">
          <h1>Therapist Dashboard</h1>
          <p>Manage your clients, conversations, care plans, and recordings</p>
        </div>
      </div>

      <div className="therapist-tabs">
        <button
          type="button"
          className={`therapist-tab ${activeView === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveView('clients')}
        >
          Clients
        </button>
        <button
          type="button"
          className={`therapist-tab ${activeView === 'recordings' ? 'active' : ''}`}
          onClick={() => setActiveView('recordings')}
        >
          Recordings
        </button>
      </div>

      {activeView === 'clients' ? (
        <section className="therapist-section">
          <h2>Client directory</h2>
          {loading ? (
            <p className="therapist-muted">Loading…</p>
          ) : clients.length === 0 ? (
            <div className="empty-state">
              <p className="therapist-muted">No clients yet</p>
              <p className="empty-hint">Clients will appear here once they connect with you.</p>
            </div>
          ) : (
            <div className="client-tiles">
              {clients.map((c) => (
                <button
                  key={c.user_id}
                  type="button"
                  className="client-tile"
                  onClick={() => setSelectedClient(c)}
                >
                  <div className="client-avatar">
                    {((c.first_name?.[0] ?? '') + (c.last_name?.[0] ?? '')).toUpperCase() || '?'}
                  </div>
                  <span className="client-name">
                    {c.first_name} {c.last_name}
                  </span>
                  <span className="client-email">{c.email}</span>
                  {c.last_activity && (
                    <span className="client-activity">
                      Last active {new Date(c.last_activity).toLocaleDateString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <MeetingRecordings therapistId={therapistId} />
      )}
    </div>
  );
}
