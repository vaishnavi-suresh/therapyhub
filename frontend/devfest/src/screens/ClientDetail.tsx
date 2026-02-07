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
  care_plan_id?: string | null;
};

type Message = {
  message_id: string;
  role: 'user' | 'bot';
  message_content: string;
};

type CarePlan = {
  care_plan_id: string;
  care_plan_description: string;
};

export default function ClientDetail({ client, onBack }: { client: Client; onBack: () => void }) {
  const { getAccessTokenSilently } = useAuth0();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
    });
    const list = (await apiFetch(`/conversations/client/${client.user_id}`, { token })) as Conversation[];
    setConversations(list.filter((c) => c.care_plan_id));
  }, [client.user_id, getAccessTokenSilently]);

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setCarePlan(null);
      return;
    }
    const conv = conversations.find((c) => c.conversation_id === selectedId);
    if (!conv) return;

    const load = async () => {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      const msgs = (await apiFetch(`/${client.user_id}/${selectedId}/messages`, { token })) as Message[];
      setMessages(msgs);

      if (conv.care_plan_id) {
        const cp = (await apiFetch(`/care_plans/${conv.care_plan_id}`, { token })) as CarePlan;
        setCarePlan(cp);
      } else {
        setCarePlan(null);
      }
    };
    load();
  }, [selectedId, conversations, client.user_id, getAccessTokenSilently]);

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
      </header>
      <div className="client-detail-body">
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
            <p className="client-muted">Select a conversation to view history and care plan.</p>
          ) : (
            <div className="content-panels">
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
              <section className="care-plan-panel">
                <h4>Care plan</h4>
                {carePlan ? (
                  <pre className="care-plan-content">{carePlan.care_plan_description}</pre>
                ) : (
                  <p className="client-muted">Loading care plan…</p>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
