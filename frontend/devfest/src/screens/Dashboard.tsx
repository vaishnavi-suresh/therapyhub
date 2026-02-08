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
  care_plan_id?: string | null;
};

type Profile = {
  user_id: string;
  therapist_id: string | null;
  role: string;
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
  const sendingRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
    });
    const list = (await apiFetch('/conversations/me', { token })) as Conversation[];
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
      const list = (await apiFetch(`/${profile.user_id}/${conversationId}/messages`, { token })) as Message[];
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
        const conv = (await apiFetch('/conversations', {
          method: 'POST',
          token,
          body: JSON.stringify({ user_id: profile.user_id, therapist_id: therapistId }),
        })) as { conversation_id: string };
        conversationId = conv.conversation_id;
        await fetchConversations();
        setSelectedId(conversationId);
      }

      const res = (await apiFetch(`/${profile.user_id}/${conversationId}/messages`, {
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
      await apiFetch(`/conversations/${selectedId}/close`, { method: 'POST', token });
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
  const isClosed = !!selectedConversation?.care_plan_id;
  const canClose = canChat && selectedId && messages.length > 0 && !selectedConversation?.care_plan_id;

  const activeConversations = conversations.filter((c) => !c.care_plan_id);
  const archivedConversations = conversations.filter((c) => c.care_plan_id);

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
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
      </aside>
      <main className="dashboard-main">
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
      </main>
    </div>
  );
}
