import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../api/client';
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

export default function ClientDetail({ client, therapistId, onBack }: { client: Client; therapistId: string; onBack: () => void }) {
  const { getAccessTokenSilently } = useAuth0();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversations' | 'homework' | 'careplans'>('conversations');
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
        ) : (
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
                      <ul className="conversation-list archive-list">
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
                    onClick={() => setSelectedHomeworkId(null)}
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
                  if (!h) return null;
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
                            disabled={archiving || deleting}
                          >
                            {archiving ? 'Archiving…' : 'Archive'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="homework-delete-btn"
                          onClick={handleDeleteHomework}
                          disabled={archiving || deleting}
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
                <label>
                  Title
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Homework title"
                  />
                </label>
                <label>
                  Prompt
                  <textarea
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Describe the homework assignment (long form text supported)"
                    rows={6}
                  />
                </label>
                <button
                  type="button"
                  className="homework-create-btn"
                  onClick={handleCreateHomework}
                  disabled={!newTitle.trim() || !newPrompt.trim() || creating}
                >
                  {creating ? 'Creating…' : 'Create homework'}
                </button>
              </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}
