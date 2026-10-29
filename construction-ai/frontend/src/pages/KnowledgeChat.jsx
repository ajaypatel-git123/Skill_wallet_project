import React, { useState, useRef, useEffect } from 'react';
import { askKnowledge } from '../api';
import ErrorBox from '../components/ErrorBox';

// Knowledge Chat page: conversational construction AI specialist
export default function KnowledgeChat() {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Hello! I am your AI Construction & Structural Engineering Assistant. Ask me about building codes (IS / NBC / ACI), concrete technology, safety compliance, site planning, or structural remediation.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedTopics: [
        'Concrete curing standards for summer',
        'Scaffolding safety inspection rules',
        'Causes of shear cracks in RCC beams',
        'Recommended water-cement ratio for M25'
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setError(null);
    setInput('');

    // Append user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Send last 10 messages as conversation context
      const contextHistory = updatedMessages.slice(-10).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await askKnowledge({
        message: query,
        question: query,
        history: contextHistory
      });

      const body = response?.data || {};
      const inner = body.data || body;
      const aiReply =
        inner.answer ||
        inner.response ||
        inner.reply ||
        inner.message ||
        'I have analyzed your query based on construction engineering standards.';

      const topics = Array.isArray(inner.related_topics || inner.topics || inner.suggestions)
        ? inner.related_topics || inner.topics || inner.suggestions
        : [];

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedTopics: topics
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Knowledge chat error:', err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Failed to receive response from Knowledge Assistant. Check backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (topic) => {
    handleSend(topic);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page-container chat-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Engineering Knowledge Assistant</h1>
          <p className="page-subtitle">
            Query structural engineering standards, building codes (IS, ACI, Eurocodes), site safety mandates, and material specifications.
          </p>
        </div>
      </div>

      {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

      {/* Main Chat Interface */}
      <div className="chat-card">
        <div className="chat-messages-area">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-row ${msg.sender === 'user' ? 'chat-row-user' : 'chat-row-ai'}`}
            >
              {msg.sender === 'ai' && (
                <div className="chat-avatar ai-avatar">🤖</div>
              )}

              <div className="chat-bubble-wrapper">
                <div
                  className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-ai'}`}
                >
                  <p className="bubble-text">{msg.text}</p>
                  <span className="bubble-time">{msg.timestamp}</span>
                </div>

                {/* Related Topics Chips */}
                {msg.relatedTopics && msg.relatedTopics.length > 0 && (
                  <div className="chip-container">
                    <span className="chip-label">Related Questions:</span>
                    <div className="chip-list">
                      {msg.relatedTopics.map((topic, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="topic-chip"
                          onClick={() => handleChipClick(topic)}
                          disabled={loading}
                        >
                          🔍 {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="chat-avatar user-avatar">👷</div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-row chat-row-ai">
              <div className="chat-avatar ai-avatar">🤖</div>
              <div className="chat-bubble bubble-ai typing-bubble">
                <span className="dot-flashing"></span>
                <span style={{ marginLeft: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Consulting engineering manuals & building codes...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          <input
            type="text"
            className="chat-input-field"
            placeholder="Ask a technical question (e.g. 'Minimum slab thickness for residential spans?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            type="button"
            className="btn btn-primary chat-send-btn"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
          >
            <span>Send</span>
            <span>➤</span>
          </button>
        </div>
      </div>
    </div>
  );
}
