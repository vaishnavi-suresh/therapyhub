import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../api/client';
import './Dashboard.css';

type Message = {
  message_id: string;
  role: 'user' | 'bot';
  message_content: string;
};

type Conversation = {
  conversation_id: string;
  user_id: string;
  therapist_id: string;
  conversation_created_at: string;
  status?: 'open' | 'closed';
  care_plan_id?: string | null;
};

type Profile = {
  user_id: string;
  therapist_id: string | null;
  role: string;
};

type Homework = {
  homework_id: string;
  homework_title: string;
  homework_prompt: string;
  homework_response: string | null;
  homework_status: 'pending' | 'completed';
  homework_created_at?: string;
  homework_updated_at?: string;
};

export default function Dashboard({ profile }: { profile: Profile }) {
  const { getAccessTokenSilently } = useAuth0();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'homework'>('chat');
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [homeworksLoading, setHomeworksLoading] = useState(false);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
  const [homeworkResponse, setHomeworkResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const sendingRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
    });
    const list = (await apiFetch('/therabot_conversations/me', { token })) as Conversation[];
    setConversations(list);
  }, [getAccessTokenSilently]);

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
  }, [fetchConversations]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      const list = (await apiFetch(`/${profile.user_id}/${conversationId}/therabot_messages`, { token })) as Message[];
      setMessages(list);
    },
    [profile.user_id, getAccessTokenSilently]
  );

  useEffect(() => {
    if (selectedId) fetchMessages(selectedId);
    else setMessages([]);
  }, [selectedId, fetchMessages]);

  const therapistId = profile.therapist_id;
  const canChat = therapistId && profile.role === 'user';

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !canChat || sendingRef.current) return;

    sendingRef.current = true;
    setInput('');
    setSending(true);

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });

      let conversationId = selectedId;

      if (!conversationId) {
        const conv = (await apiFetch('/therabot_conversations', {
          method: 'POST',
          token,
          body: JSON.stringify({ user_id: profile.user_id, therapist_id: therapistId }),
        })) as { conversation_id: string };
        conversationId = conv.conversation_id;
        await fetchConversations();
        setSelectedId(conversationId);
      }

      const res = (await apiFetch(`/${profile.user_id}/${conversationId}/therabot_messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ message_content: text, therapist_id: therapistId }),
      })) as { userMessage?: Message; botMessage?: Message; conversationClosed?: boolean };

      setMessages((prev) => {
        const next = [...prev];
        if (res.userMessage) next.push(res.userMessage);
        if (res.botMessage) next.push(res.botMessage);
        return next;
      });
      if (res.conversationClosed) {
        await fetchConversations();
        setSelectedId(null);
        setMessages([]);
      }
    } catch (err) {
      setInput(text);
      console.error(err);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedId || messages.length === 0 || closing) return;
    setClosing(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      await apiFetch(`/therabot_conversations/${selectedId}/close`, { method: 'POST', token });
      await fetchConversations();
      setSelectedId(null);
      setMessages([]);
    } catch (err) {
      console.error(err);
    } finally {
      setClosing(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.conversation_id === selectedId);
  const isClosed = selectedConversation?.status === 'closed' || !!selectedConversation?.care_plan_id;
  const canClose = canChat && selectedId && messages.length > 0 && selectedConversation?.status !== 'closed' && !selectedConversation?.care_plan_id;

  const activeConversations = conversations.filter((c) => c.status !== 'closed' && !c.care_plan_id);
  const archivedConversations = conversations.filter((c) => c.status === 'closed' || !!c.care_plan_id);

  const fetchHomeworks = useCallback(async () => {
    if (!therapistId) return;
    setHomeworksLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      const list = (await apiFetch(`/homeworks/${profile.user_id}/${therapistId}`, { token })) as Homework[];
      setHomeworks(list);
    } catch {
      setHomeworks([]);
    } finally {
      setHomeworksLoading(false);
    }
  }, [profile.user_id, therapistId, getAccessTokenSilently]);

  useEffect(() => {
    if (activeTab === 'homework' && therapistId) {
      fetchHomeworks();
    }
  }, [activeTab, therapistId, fetchHomeworks]);

  useEffect(() => {
    if (selectedHomeworkId) {
      const h = homeworks.find((x) => x.homework_id === selectedHomeworkId);
      setHomeworkResponse(h?.homework_response ?? '');
    } else {
      setHomeworkResponse('');
    }
  }, [selectedHomeworkId, homeworks]);

  const handleSubmitHomework = async () => {
    const h = homeworks.find((x) => x.homework_id === selectedHomeworkId);
    if (!h || !therapistId || h.homework_status === 'completed' || submitting) return;
    const response = homeworkResponse.trim();
    if (!response) return;
    setSubmitting(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
      await apiFetch(`/homeworks/${profile.user_id}/${therapistId}/${h.homework_id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          homework_title: h.homework_title,
          homework_prompt: h.homework_prompt,
          homework_response: response,
          homework_status: 'completed',
        }),
      });
      await fetchHomeworks();
      setSelectedHomeworkId(null);
      setHomeworkResponse('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const activeHomeworks = homeworks.filter((h) => h.homework_status === 'pending');
  const archivedHomeworks = homeworks.filter((h) => h.homework_status === 'completed');
  const selectedHomework = homeworks.find((h) => h.homework_id === selectedHomeworkId);

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <button
          type="button"
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button
          type="button"
          className={activeTab === 'homework' ? 'active' : ''}
          onClick={() => setActiveTab('homework')}
        >
          Homework
        </button>
      </nav>
      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
        {activeTab === 'chat' ? (
          <>
        <button type="button" className="new-chat-btn" onClick={() => { setSelectedId(null); setMessages([]); }}>
          + New chat
        </button>
        {loading ? (
          <p className="dashboard-muted">Loading…</p>
        ) : (
          <>
            <h3>Conversations</h3>
            {activeConversations.length > 0 && (
              <ul className="conversation-list">
                {activeConversations.map((c) => (
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
            {(activeConversations.length === 0 && archivedConversations.length === 0) && (
              <p className="dashboard-muted">No conversations yet</p>
            )}
            {archivedConversations.length > 0 && (
              <>
                <h3 className="archive-header">Archive</h3>
                <ul className="conversation-list archive-list">
                  {archivedConversations.map((c) => (
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
              </>
            )}
          </>
        )}
          </>
        ) : (
          <>
            <h3>Homework</h3>
            {!therapistId ? (
              <p className="dashboard-muted">Connect with a therapist to see homework.</p>
            ) : homeworksLoading ? (
              <p className="dashboard-muted">Loading…</p>
            ) : homeworks.length === 0 ? (
              <p className="dashboard-muted">No homework yet</p>
            ) : (
              <>
                {activeHomeworks.length > 0 && (
                  <>
                    <p className="dashboard-tab-label">Active</p>
                    <ul className="conversation-list">
                      {activeHomeworks.map((h) => (
                        <li key={h.homework_id}>
                          <button
                            type="button"
                            className={selectedHomeworkId === h.homework_id ? 'selected' : ''}
                            onClick={() => setSelectedHomeworkId(h.homework_id)}
                          >
                            <span className="homework-date">{h.homework_created_at ? new Date(h.homework_created_at).toLocaleDateString() : ''}</span>
                            {h.homework_title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {archivedHomeworks.length > 0 && (
                  <>
                    <p className="dashboard-tab-label archive-header">Completed</p>
                    <ul className="conversation-list archive-list">
                      {archivedHomeworks.map((h) => (
                        <li key={h.homework_id}>
                          <button
                            type="button"
                            className={selectedHomeworkId === h.homework_id ? 'selected' : ''}
                            onClick={() => setSelectedHomeworkId(h.homework_id)}
                          >
                            <span className="homework-date">{h.homework_created_at ? new Date(h.homework_created_at).toLocaleDateString() : ''}</span>
                            {h.homework_title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </>
        )}
        </aside>
        <main className="dashboard-main">
        {activeTab === 'chat' ? (
          <>
        <div className="chat-header">
          <h2>Harbor</h2>
          <p>Your supportive therapeutic chat assistant</p>
        </div>
        <div className="chat-messages">
          {messages.length === 0 && !selectedId && (
            <div className="welcome-hero">
              <div className="welcome-hero-content">
                <h2>Welcome to Harbor</h2>
                <p className="welcome-tagline">Your supportive therapeutic chat assistant</p>
                <p className="welcome-desc">I&apos;m here to listen and offer support. Send a message to start our conversation.</p>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.message_id} className={`message ${m.role}`}>
              <span className="message-role">{m.role === 'user' ? 'You' : 'Harbor'}</span>
              <p>{m.message_content}</p>
            </div>
          ))}
        </div>
        {canChat && !isClosed && (
          <div className="chat-input-wrap">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Type a message…"
              rows={2}
              disabled={sending}
            />
            <div className="chat-actions">
              <button type="button" onClick={handleSend} disabled={sending || !input.trim()}>
                {sending ? 'Sending…' : 'Send'}
              </button>
              {canClose && (
                <button
                  type="button"
                  className="close-conversation-btn"
                  onClick={handleCloseConversation}
                  disabled={closing}
                >
                  {closing ? 'Closing…' : 'Close conversation'}
                </button>
              )}
            </div>
          </div>
        )}
        {canChat && isClosed && selectedId && (
          <p className="conversation-closed-hint">This conversation is closed. Start a new chat to continue.</p>
        )}
        {!canChat && <p className="dashboard-muted">Connect with a therapist to use the chat.</p>}
          </>
        ) : (
          <>
            <div className="chat-header">
              <h2>Homework</h2>
              <p>View and complete assignments from your therapist</p>
            </div>
            <div className="homework-client-content">
              {!selectedHomework ? (
                <p className="dashboard-muted homework-placeholder">Select a homework from the list to view and respond.</p>
              ) : (
                <div className="homework-detail">
                  {selectedHomework.homework_created_at && (
                    <p className="homework-detail-date">{new Date(selectedHomework.homework_created_at).toLocaleDateString()}</p>
                  )}
                  <h3 className="homework-detail-title">{selectedHomework.homework_title}</h3>
                  <div className="homework-detail-prompt">
                    <p className="homework-detail-label">Assignment</p>
                    <pre>{selectedHomework.homework_prompt}</pre>
                  </div>
                  {selectedHomework.homework_status === 'completed' ? (
                    <div className="homework-detail-response">
                      <p className="homework-detail-label">Your response</p>
                      <pre>{selectedHomework.homework_response || '—'}</pre>
                    </div>
                  ) : (
                    <div className="homework-detail-response-form">
                      <label>
                        <p className="homework-detail-label">Your response</p>
                        <textarea
                          value={homeworkResponse}
                          onChange={(e) => setHomeworkResponse(e.target.value)}
                          placeholder="Write your response here (long form text supported)"
                          rows={8}
                        />
                      </label>
                      <button
                        type="button"
                        className="homework-submit-btn"
                        onClick={handleSubmitHomework}
                        disabled={!homeworkResponse.trim() || submitting}
                      >
                        {submitting ? 'Submitting…' : 'Submit response'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        </main>
      </div>
    </div>
  );
}
