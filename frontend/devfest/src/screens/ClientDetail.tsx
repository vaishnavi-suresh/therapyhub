import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../api/client';
import VideoCall from '../components/VideoCall';
import './ClientDetail.css';

type Client = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  last_activity: string | null;
};

type Conversation = {
  conversation_id: string;
  user_id: string;
  therapist_id: string;
  conversation_created_at: string;
  conversation_updated_at?: string;
  status?: 'open' | 'closed';
  care_plan_id?: string | null;
};

type Message = {
  message_id: string;
  role: 'user' | 'bot';
  message_content: string;
};

type Homework = {
  homework_id: string;
  homework_title: string;
  homework_prompt: string;
  homework_response: string | null;
  homework_status: 'pending' | 'completed' | 'archived';
  homework_created_at?: string;
  homework_updated_at?: string;
};

type CarePlan = {
  care_plan_id: string;
  user_id: string;
  therapist_id: string;
  care_plan_description: string;
  care_plan_created_at?: string;
  care_plan_updated_at?: string;
};

type MeetingRecording = {
  meeting_id: string;
  user_id: string;
  therapist_id: string;
  recording_url: string;
  recording_created_at: string;
  transcript: string | null;
  analysis: string;
};

export default function ClientDetail({ client, therapistId, onBack }: { client: Client; therapistId: string; onBack: () => void }) {
  const { getAccessTokenSilently } = useAuth0();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversations' | 'homework' | 'careplans' | 'recordings' | 'video'>('conversations');
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [homeworksLoading, setHomeworksLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [carePlansLoading, setCarePlansLoading] = useState(false);
  const [selectedCarePlanId, setSelectedCarePlanId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [recordings, setRecordings] = useState<MeetingRecording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<MeetingRecording | null>(null);
  const [deletingRecording, setDeletingRecording] = useState(false);

  const fetchConversations = useCallback(async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
    });
    const list = (await apiFetch(`/therabot_conversations/client/${client.user_id}`, { token })) as Conversation[];
    setConversations(list.filter((c) => c.status === 'closed' || c.care_plan_id));
  }, [client.user_id, getAccessTokenSilently]);

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
  }, [fetchConversations]);

  const fetchHomeworks = useCallback(async () => {
    setHomeworksLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      const list = (await apiFetch(`/homeworks/${client.user_id}/${therapistId}`, { token })) as Homework[];
      setHomeworks(list);
    } catch {
      setHomeworks([]);
    } finally {
      setHomeworksLoading(false);
    }
  }, [client.user_id, therapistId, getAccessTokenSilently]);

  useEffect(() => {
    if (activeTab === 'homework') {
      fetchHomeworks();
    }
  }, [activeTab, fetchHomeworks]);

  const fetchCarePlans = useCallback(async () => {
    setCarePlansLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      const list = (await apiFetch(`/care_plans/client/${client.user_id}`, { token })) as CarePlan[];
      setCarePlans(list);
    } catch {
      setCarePlans([]);
    } finally {
      setCarePlansLoading(false);
    }
  }, [client.user_id, getAccessTokenSilently]);

  useEffect(() => {
    if (activeTab === 'careplans') {
      fetchCarePlans();
    }
  }, [activeTab, fetchCarePlans]);

  const fetchRecordings = useCallback(async () => {
    setRecordingsLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      const list = (await apiFetch(`/meeting_recordings/${client.user_id}/${therapistId}`, { token })) as MeetingRecording[];
      console.log('Fetched recordings:', list);
      // Sort by date (newest first)
      list.sort((a, b) => 
        new Date(b.recording_created_at).getTime() - new Date(a.recording_created_at).getTime()
      );
      setRecordings(list);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      setRecordings([]);
    } finally {
      setRecordingsLoading(false);
    }
  }, [client.user_id, therapistId, getAccessTokenSilently]);

  useEffect(() => {
    if (activeTab === 'recordings') {
      fetchRecordings();
    }
  }, [activeTab, fetchRecordings]);

  const handleDeleteRecording = async (recording: MeetingRecording, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent selecting the recording when clicking delete from list
    }
    if (!window.confirm('Are you sure you want to delete this recording? This cannot be undone.')) {
      return;
    }

    setDeletingRecording(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      await apiFetch(`/meeting_recordings/${client.user_id}/${therapistId}/${recording.meeting_id}`, {
        method: 'DELETE',
        token,
      });
      
      // If the deleted recording was selected, clear selection
      if (selectedRecording?.meeting_id === recording.meeting_id) {
        setSelectedRecording(null);
      }
      
      // Refresh the recordings list
      await fetchRecordings();
    } catch (err) {
      console.error('Error deleting recording:', err);
      alert('Failed to delete recording. Please try again.');
    } finally {
      setDeletingRecording(false);
    }
  };

  const handleGenerateCarePlan = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      const created = (await apiFetch(`/care_plans/generate`, {
        method: 'POST',
        token,
        body: JSON.stringify({ user_id: client.user_id }),
      })) as CarePlan;
      await fetchCarePlans();
      setSelectedCarePlanId(created.care_plan_id);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateHomework = async () => {
    const title = newTitle.trim();
    const prompt = newPrompt.trim();
    if (!title || !prompt || creating) return;
    setCreating(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      await apiFetch(`/homeworks/${client.user_id}/${therapistId}`, {
        method: 'POST',
        token,
        body: JSON.stringify({ homework: { homework_title: title, homework_prompt: prompt } }),
      });
      setNewTitle('');
      setNewPrompt('');
      await fetchHomeworks();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleArchiveHomework = async () => {
    const h = homeworks.find((x) => x.homework_id === selectedHomeworkId);
    if (!h || h.homework_status !== 'pending' || archiving) return;
    setArchiving(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      await apiFetch(`/homeworks/${client.user_id}/${therapistId}/${h.homework_id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          homework_title: h.homework_title,
          homework_prompt: h.homework_prompt,
          homework_response: h.homework_response,
          homework_status: 'archived',
        }),
      });
      await fetchHomeworks();
      setSelectedHomeworkId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setArchiving(false);
    }
  };

  const handleDeleteHomework = async () => {
    const h = homeworks.find((x) => x.homework_id === selectedHomeworkId);
    if (!h || deleting) return;
    if (!window.confirm('Delete this homework? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      await apiFetch(`/homeworks/${client.user_id}/${therapistId}/${h.homework_id}`, {
        method: 'DELETE',
        token,
      });
      await fetchHomeworks();
      setSelectedHomeworkId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const pendingHomeworks = homeworks.filter((h) => h.homework_status === 'pending');
  const completedHomeworks = homeworks
    .filter((h) => h.homework_status === 'completed' || h.homework_status === 'archived')
    .sort((a, b) => {
      const aDate = a.homework_updated_at || a.homework_created_at || '';
      const bDate = b.homework_updated_at || b.homework_created_at || '';
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    const load = async () => {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      const msgs = (await apiFetch(`/${client.user_id}/${selectedId}/therabot_messages`, { token })) as Message[];
      setMessages(msgs);
    };
    load();
  }, [selectedId, client.user_id, getAccessTokenSilently]);

  return (
    <div className="client-detail">
      <header className="client-detail-header">
        <button type="button" className="back-btn" onClick={onBack}>
          ← Back to clients
        </button>
        <h2>
          {client.first_name} {client.last_name}
        </h2>
        <p className="client-email">{client.email}</p>
        <div className="client-detail-tabs">
          <button
            type="button"
            className={activeTab === 'conversations' ? 'active' : ''}
            onClick={() => setActiveTab('conversations')}
          >
            Conversations
          </button>
          <button
            type="button"
            className={activeTab === 'homework' ? 'active' : ''}
            onClick={() => setActiveTab('homework')}
          >
            Homework
          </button>
          <button
            type="button"
            className={activeTab === 'careplans' ? 'active' : ''}
            onClick={() => setActiveTab('careplans')}
          >
            Care Plans
          </button>
          <button
            type="button"
            className={activeTab === 'recordings' ? 'active' : ''}
            onClick={() => setActiveTab('recordings')}
          >
            Recordings
          </button>
          <button
            type="button"
            className={activeTab === 'video' ? 'active' : ''}
            onClick={() => setActiveTab('video')}
          >
            Video Call
          </button>
        </div>
      </header>
      <div className="client-detail-body">
        {activeTab === 'conversations' ? (
          <>
            <aside className="conversations-sidebar">
              <h3>Archived conversations</h3>
              {loading ? (
                <p className="client-muted">Loading…</p>
              ) : conversations.length === 0 ? (
                <p className="client-muted">No archived conversations</p>
              ) : (
                <ul className="conversation-list">
                  {conversations.map((c) => (
                    <li key={c.conversation_id}>
                      <button
                        type="button"
                        className={selectedId === c.conversation_id ? 'selected' : ''}
                        onClick={() => setSelectedId(c.conversation_id)}
                      >
                        {new Date(c.conversation_created_at).toLocaleDateString()}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
            <main className="client-detail-main">
              {!selectedId ? (
                <p className="client-muted">Select a conversation to view history.</p>
              ) : (
                <section className="conversation-panel">
                  <h4>Conversation</h4>
                  <div className="messages">
                    {messages.map((m) => (
                      <div key={m.message_id} className={`message ${m.role}`}>
                        <span className="message-role">{m.role === 'user' ? 'Client' : 'Harbor'}</span>
                        <p>{m.message_content}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </main>
          </>
        ) : activeTab === 'homework' ? (
          <>
            <aside className="conversations-sidebar homework-sidebar">
              <h3>Homework</h3>
              {homeworksLoading ? (
                <p className="client-muted">Loading…</p>
              ) : homeworks.length === 0 ? (
                <p className="client-muted">No homework yet</p>
              ) : null}
              {!homeworksLoading && (
                <>
                  {pendingHomeworks.length > 0 && (
                    <>
                      <p className="homework-section-label">Pending</p>
                      <ul className="conversation-list">
                        {pendingHomeworks.map((h) => (
                          <li key={h.homework_id}>
                            <button
                              type="button"
                              className={`homework-item-btn ${selectedHomeworkId === h.homework_id ? 'selected' : ''}`}
                              onClick={() => setSelectedHomeworkId(h.homework_id)}
                            >
                              {h.homework_created_at && (
                                <span className="homework-date">{new Date(h.homework_created_at).toLocaleDateString()}</span>
                              )}
                              <span className="homework-title">{h.homework_title}</span>
                              <span className={`homework-status ${h.homework_status}`}>{h.homework_status}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {completedHomeworks.length > 0 && (
                    <>
                      <p className="homework-section-label archive-header">Completed</p>
                      <ul className="conversation-list">
                        {completedHomeworks.map((h) => (
                          <li key={h.homework_id}>
                            <button
                              type="button"
                              className={`homework-item-btn ${selectedHomeworkId === h.homework_id ? 'selected' : ''}`}
                              onClick={() => setSelectedHomeworkId(h.homework_id)}
                            >
                              {h.homework_created_at && (
                                <span className="homework-date">{new Date(h.homework_created_at).toLocaleDateString()}</span>
                              )}
                              <span className="homework-title">{h.homework_title}</span>
                              <span className={`homework-status ${h.homework_status}`}>{h.homework_status}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <button
                    type="button"
                    className="homework-new-btn"
                    onClick={() => {
                      setNewTitle('');
                      setNewPrompt('');
                      setSelectedHomeworkId(null);
                    }}
                    title="Create new homework"
                  >
                    <span className="homework-new-btn-icon">⊕</span>
                    New homework
                  </button>
                </>
              )}
            </aside>
            <main className="client-detail-main homework-main">
              {selectedHomeworkId ? (
                (() => {
                  const h = homeworks.find((x) => x.homework_id === selectedHomeworkId);
                  if (!h) return <p className="client-muted">Loading…</p>;
                  return (
                    <div className="homework-detail-view">
                      {h.homework_created_at && (
                        <p className="homework-detail-date">{new Date(h.homework_created_at).toLocaleDateString()}</p>
                      )}
                      <h4>{h.homework_title}</h4>
                      <div className="homework-detail-section">
                        <p className="homework-detail-label">Prompt</p>
                        <pre className="homework-detail-content">{h.homework_prompt}</pre>
                      </div>
                      <div className="homework-detail-section">
                        <p className="homework-detail-label">Client response</p>
                        <pre className="homework-detail-content">{h.homework_response || '— No response yet'}</pre>
                      </div>
                      <div className="homework-detail-actions">
                        {h.homework_status === 'pending' && (
                          <button
                            type="button"
                            className="homework-archive-btn"
                            onClick={handleArchiveHomework}
                            disabled={archiving}
                          >
                            {archiving ? 'Archiving…' : 'Archive'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="homework-delete-btn"
                          onClick={handleDeleteHomework}
                          disabled={deleting}
                        >
                          {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="homework-create">
                  <h4>Create new homework</h4>
                  <input
                    type="text"
                    placeholder="Homework title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="homework-create-input"
                  />
                  <textarea
                    placeholder="Describe the homework assignment (long form text supported)"
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    className="homework-create-textarea"
                    rows={8}
                  />
                  <button
                    type="button"
                    className="homework-create-btn"
                    onClick={handleCreateHomework}
                    disabled={creating}
                  >
                    {creating ? 'Creating…' : 'Create homework'}
                  </button>
                </div>
              )}
            </main>
          </>
        ) : activeTab === 'careplans' ? (
          <>
            <aside className="conversations-sidebar homework-sidebar">
              <h3>Care Plans</h3>
              {carePlansLoading ? (
                <p className="client-muted">Loading…</p>
              ) : carePlans.length === 0 ? (
                <p className="client-muted">No care plans yet</p>
              ) : null}
              {!carePlansLoading && (
                <>
                  {carePlans.length > 0 && (
                    <ul className="conversation-list">
                      {carePlans.map((cp) => (
                        <li key={cp.care_plan_id}>
                          <button
                            type="button"
                            className={`homework-item-btn ${selectedCarePlanId === cp.care_plan_id ? 'selected' : ''}`}
                            onClick={() => setSelectedCarePlanId(cp.care_plan_id)}
                          >
                            {cp.care_plan_created_at && (
                              <span className="homework-date">{new Date(cp.care_plan_created_at).toLocaleDateString()}</span>
                            )}
                            <span className="homework-title">Care plan</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="homework-new-btn"
                    onClick={handleGenerateCarePlan}
                    disabled={generating}
                    title="Generate new care plan from last week's messages and homeworks"
                  >
                    <span className="homework-new-btn-icon">⊕</span>
                    {generating ? 'Generating…' : 'New care plan'}
                  </button>
                </>
              )}
            </aside>
            <main className="client-detail-main homework-main">
              {selectedCarePlanId ? (
                (() => {
                  const cp = carePlans.find((x) => x.care_plan_id === selectedCarePlanId);
                  if (!cp) return <p className="client-muted">Loading…</p>;
                  return (
                    <div className="homework-detail-view">
                      {cp.care_plan_created_at && (
                        <p className="homework-detail-date">{new Date(cp.care_plan_created_at).toLocaleDateString()}</p>
                      )}
                      <h4>Care Plan</h4>
                      <div className="homework-detail-section">
                        <pre className="homework-detail-content">{cp.care_plan_description}</pre>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="homework-create">
                  <h4>Care Plans</h4>
                  <p className="client-muted">Generate a care plan based on the past week&apos;s messages and homeworks, or select one from the list.</p>
                  <button
                    type="button"
                    className="homework-create-btn"
                    onClick={handleGenerateCarePlan}
                    disabled={generating}
                  >
                    {generating ? 'Generating…' : 'Generate care plan'}
                  </button>
                </div>
              )}
            </main>
          </>
        ) : activeTab === 'recordings' ? (
          <>
            <aside className="conversations-sidebar homework-sidebar">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>Recordings</h3>
                <button
                  type="button"
                  onClick={fetchRecordings}
                  disabled={recordingsLoading}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.85rem',
                    background: 'var(--color-bg-elevated, #f8f9fa)',
                    border: '1px solid var(--color-border, #e0e0e0)',
                    borderRadius: '4px',
                    cursor: recordingsLoading ? 'not-allowed' : 'pointer',
                    opacity: recordingsLoading ? 0.6 : 1
                  }}
                  title="Refresh recordings"
                >
                  {recordingsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {recordingsLoading ? (
                <p className="client-muted">Loading…</p>
              ) : recordings.length === 0 ? (
                <p className="client-muted">No recordings yet</p>
              ) : (
                <ul className="conversation-list">
                  {recordings.map((recording) => (
                    <li key={recording.meeting_id}>
                      <button
                        type="button"
                        className={selectedRecording?.meeting_id === recording.meeting_id ? 'selected' : ''}
                        onClick={() => setSelectedRecording(recording)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
                          <span className="homework-date">
                            {new Date(recording.recording_created_at).toLocaleDateString()}
                          </span>
                          {recording.transcript && (
                            <span className="homework-status completed">Has Transcript</span>
                          )}
                          {recording.analysis && (
                            <span className="homework-status completed" style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                              Has Summary
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRecording(recording, e)}
                            disabled={deletingRecording}
                            style={{
                              marginLeft: 'auto',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              background: 'transparent',
                              border: '1px solid var(--color-border, #e0e0e0)',
                              borderRadius: '4px',
                              color: '#c53030',
                              cursor: deletingRecording ? 'not-allowed' : 'pointer',
                              opacity: deletingRecording ? 0.5 : 1,
                            }}
                            title="Delete recording"
                          >
                            Delete
                          </button>
                        </div>
                        {recording.analysis ? (
                          <p 
                            className="client-muted" 
                            style={{ 
                              fontSize: '0.85rem', 
                              margin: 0, 
                              textAlign: 'left',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: '1.3',
                              fontWeight: 500
                            }}
                            title={recording.analysis}
                          >
                            {recording.analysis}
                          </p>
                        ) : recording.transcript ? (
                          <p 
                            className="client-muted" 
                            style={{ 
                              fontSize: '0.85rem', 
                              margin: 0, 
                              textAlign: 'left',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: '1.3',
                              fontStyle: 'italic'
                            }}
                          >
                            Summary being generated...
                          </p>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
            <main className="client-detail-main homework-main">
              {selectedRecording ? (
                <div className="homework-detail-view">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p className="homework-detail-date" style={{ margin: 0 }}>
                      Recorded: {new Date(selectedRecording.recording_created_at).toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDeleteRecording(selectedRecording)}
                      disabled={deletingRecording}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        background: 'transparent',
                        border: '1px solid #c53030',
                        borderRadius: '8px',
                        color: '#c53030',
                        cursor: deletingRecording ? 'not-allowed' : 'pointer',
                        opacity: deletingRecording ? 0.5 : 1,
                        fontWeight: 500,
                      }}
                      title="Delete recording"
                    >
                      {deletingRecording ? 'Deleting...' : 'Delete Recording'}
                    </button>
                  </div>
                  <div className="recording-video-container">
                    <video
                      controls
                      src={selectedRecording.recording_url}
                      className="recording-video"
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        display: 'block',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        console.error('Video loading error:', e);
                        console.error('Video URL:', selectedRecording.recording_url);
                      }}
                      onLoadStart={() => {
                        console.log('Video loading started:', selectedRecording.recording_url);
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                    {!selectedRecording.recording_url && (
                      <p className="client-muted" style={{ fontStyle: 'italic', marginTop: '1rem' }}>
                        No video URL available for this recording.
                      </p>
                    )}
                  </div>
                  {selectedRecording.transcript ? (
                    <div className="homework-detail-section" style={{ marginTop: '1.5rem' }}>
                      <p className="homework-detail-label">Transcript</p>
                      <div 
                        className="homework-detail-content" 
                        style={{ 
                          whiteSpace: 'pre-wrap',
                          padding: '1rem',
                          backgroundColor: 'var(--color-bg-elevated, #f8f9fa)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border, #e0e0e0)',
                          maxHeight: '400px',
                          overflowY: 'auto',
                          lineHeight: '1.6',
                          fontSize: '0.95rem'
                        }}
                      >
                        {selectedRecording.transcript}
                      </div>
                    </div>
                  ) : (
                    <div className="homework-detail-section" style={{ marginTop: '1.5rem' }}>
                      <p className="homework-detail-label">Transcript</p>
                      <p className="client-muted" style={{ fontStyle: 'italic' }}>
                        Transcript is being generated... Please check back in a few minutes.
                      </p>
                    </div>
                  )}
                  {selectedRecording.analysis ? (
                    <div className="homework-detail-section" style={{ marginTop: '1.5rem' }}>
                      <p className="homework-detail-label">Session Summary</p>
                      <div 
                        className="homework-detail-content" 
                        style={{ 
                          whiteSpace: 'pre-wrap',
                          padding: '1rem',
                          backgroundColor: 'var(--color-bg-elevated, #f8f9fa)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border, #e0e0e0)',
                          maxHeight: '400px',
                          overflowY: 'auto',
                          lineHeight: '1.6',
                          fontSize: '0.95rem'
                        }}
                      >
                        {selectedRecording.analysis}
                      </div>
                    </div>
                  ) : selectedRecording.transcript ? (
                    <div className="homework-detail-section" style={{ marginTop: '1.5rem' }}>
                      <p className="homework-detail-label">Session Summary</p>
                      <p className="client-muted" style={{ fontStyle: 'italic' }}>
                        Summary is being generated... Please check back in a few minutes.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="homework-create">
                  <h4>Meeting Recordings</h4>
                  <p className="client-muted">
                    {recordings.length === 0
                      ? 'No recordings available yet. Recordings will appear here after video sessions are completed.'
                      : 'Select a recording from the list to view it.'}
                  </p>
                </div>
              )}
            </main>
          </>
        ) : activeTab === 'video' ? (
          <div className="client-detail-video-container">
            <VideoCall
              therapistId={therapistId}
              clientId={client.user_id}
              userName={`${client.first_name} ${client.last_name}`}
              userRole="therapist"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
