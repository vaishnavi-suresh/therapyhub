import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../api/client';
import './MeetingRecordings.css';

type MeetingRecording = {
  meeting_id: string;
  user_id: string;
  therapist_id: string;
  recording_url: string;
  recording_created_at: string;
  transcript: string | null;
  analysis: string;
};

type Client = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export default function MeetingRecordings({ therapistId }: { therapistId: string }) {
  const { getAccessTokenSilently } = useAuth0();
  const [recordings, setRecordings] = useState<MeetingRecording[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<MeetingRecording | null>(null);
  const [filterClientId, setFilterClientId] = useState<string | null>(null);

  // Fetch recordings for all clients
  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });

      // Fetch clients first
      const clientList = (await apiFetch('/therapist/clients', { token })) as Client[];
      const clientsMap: Record<string, Client> = {};
      clientList.forEach((client) => {
        clientsMap[client.user_id] = client;
      });
      setClients(clientsMap);
      
      // Fetch recordings for each client
      const allRecordings: MeetingRecording[] = [];
      for (const client of clientList) {
        try {
          const clientRecordings = (await apiFetch(
            `/meeting_recordings/${client.user_id}/${therapistId}`,
            { token }
          )) as MeetingRecording[];
          allRecordings.push(...clientRecordings);
        } catch (error) {
          console.error(`Failed to fetch recordings for client ${client.user_id}:`, error);
        }
      }

      // Sort by date (newest first)
      allRecordings.sort((a, b) => 
        new Date(b.recording_created_at).getTime() - new Date(a.recording_created_at).getTime()
      );

      setRecordings(allRecordings);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  }, [therapistId, getAccessTokenSilently]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const filteredRecordings = filterClientId
    ? recordings.filter((r) => r.user_id === filterClientId)
    : recordings;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getClientName = (userId: string) => {
    const client = clients[userId];
    if (!client) return 'Unknown Client';
    return `${client.first_name} ${client.last_name}`;
  };

  if (selectedRecording) {
    const client = clients[selectedRecording.user_id];
    return (
      <div className="meeting-recordings-detail">
        <div className="meeting-recordings-detail-header">
          <button
            type="button"
            className="back-btn"
            onClick={() => setSelectedRecording(null)}
          >
            ← Back to recordings
          </button>
          <h2>Meeting Recording</h2>
          {client && (
            <p className="recording-client-name">
              {client.first_name} {client.last_name} ({client.email})
            </p>
          )}
          <p className="recording-date">
            Recorded: {formatDate(selectedRecording.recording_created_at)}
          </p>
        </div>
        <div className="meeting-recordings-detail-content">
          <div className="recording-video-container">
            <video
              controls
              src={selectedRecording.recording_url}
              className="recording-video"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          {selectedRecording.transcript && (
            <div className="recording-transcript">
              <h3>Transcript</h3>
              <p>{selectedRecording.transcript}</p>
            </div>
          )}
          {selectedRecording.analysis && (
            <div className="recording-analysis">
              <h3>Analysis</h3>
              <p>{selectedRecording.analysis}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-recordings">
      <div className="meeting-recordings-header">
        <h1>Meeting Recordings</h1>
        <p>View and manage video session recordings</p>
      </div>

      <div className="meeting-recordings-filters">
        <label htmlFor="client-filter">Filter by client:</label>
        <select
          id="client-filter"
          value={filterClientId || ''}
          onChange={(e) => setFilterClientId(e.target.value || null)}
          className="client-filter-select"
        >
          <option value="">All Clients</option>
          {Object.values(clients).map((client) => (
            <option key={client.user_id} value={client.user_id}>
              {client.first_name} {client.last_name}
            </option>
          ))}
        </select>
      </div>

      <section className="meeting-recordings-section">
        {loading ? (
          <p className="recordings-muted">Loading recordings...</p>
        ) : filteredRecordings.length === 0 ? (
          <div className="empty-state">
            <p className="recordings-muted">No recordings found</p>
            <p className="empty-hint">
              {filterClientId
                ? 'This client has no recordings yet.'
                : 'Recordings will appear here once video sessions are completed.'}
            </p>
          </div>
        ) : (
          <div className="recordings-grid">
            {filteredRecordings.map((recording) => {
              const client = clients[recording.user_id];
              return (
                <div
                  key={recording.meeting_id}
                  className="recording-card"
                  onClick={() => setSelectedRecording(recording)}
                >
                  <div className="recording-card-header">
                    <div className="recording-client-avatar">
                      {client
                        ? ((client.first_name?.[0] ?? '') + (client.last_name?.[0] ?? '')).toUpperCase()
                        : '?'}
                    </div>
                    <div className="recording-card-info">
                      <h3 className="recording-client-name">
                        {getClientName(recording.user_id)}
                      </h3>
                      <p className="recording-date">
                        {formatDate(recording.recording_created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="recording-card-preview">
                    <video
                      src={recording.recording_url}
                      className="recording-preview"
                      muted
                      preload="metadata"
                    />
                    <div className="recording-play-overlay">
                      <span className="play-icon">▶</span>
                    </div>
                  </div>
                  {recording.transcript && (
                    <div className="recording-badge">Has Transcript</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
