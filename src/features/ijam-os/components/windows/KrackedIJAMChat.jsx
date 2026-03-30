import React, { useEffect, useState } from 'react';
import { useIJAMConversation } from '../../hooks/useIJAMConversation';

function sanitizeAssistantText(text) {
  return text
    .replace(/\([^()]*[^\x00-\x7F][^()]*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default function KrackedIJAMChat({ prefillMessage = '', onPrefillConsumed = null, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [isResuming, setIsResuming] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const {
    startNewConversation,
    resumeConversation,
    saveCurrentConversation,
    conversations,
    diaryMeta,
    diaryEntries,
    saveDiaryEntry,
    reviewDiaryEntries,
    loadDiaryArchive,
    loadSaveDiary,
    loadMajiMemory,
    submitMajiOnboardingName,
    saveMajiMemory,
    majiPendingOnboarding,
    normalizeCommand
  } = useIJAMConversation();

  const recentDiaryEntries = [...(Array.isArray(diaryEntries) ? diaryEntries : [])].slice(-3).reverse();

  useEffect(() => {
    if (!prefillMessage) return;
    setInputValue(prefillMessage);
    onPrefillConsumed?.();
  }, [onPrefillConsumed, prefillMessage]);

  const dispatchMessage = async (rawMessage) => {
    const userMessage = rawMessage.trim();
    if (!userMessage || isResuming) return;

    const nextMessages = [
      ...messages,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() }
    ];

    setMessages(nextMessages);
    setInputValue('');

    const normalizedCommand = normalizeCommand(userMessage);
    let aiResponse;

    if (majiPendingOnboarding) {
      aiResponse = await submitMajiOnboardingName(userMessage);
    } else if (normalizedCommand === 'maji') {
      aiResponse = await loadMajiMemory();
    } else if (normalizedCommand === 'save' || normalizedCommand === 'maji save') {
      aiResponse = await saveMajiMemory(nextMessages);
    } else if (normalizedCommand === 'save diary') {
      aiResponse = saveDiaryEntry(nextMessages);
    } else if (normalizedCommand === 'review diary') {
      aiResponse = reviewDiaryEntries();
    } else if (normalizedCommand === 'load diary archive') {
      aiResponse = loadDiaryArchive();
    } else if (normalizedCommand === 'load save-diary') {
      aiResponse = loadSaveDiary();
    } else {
      aiResponse = await import('../../lib/ijamsAIService').then((m) =>
        m.callIJAMAI('groq', userMessage, nextMessages)
      );
    }

    const finalMessages = [
      ...nextMessages,
      {
        role: 'assistant',
        content: sanitizeAssistantText(aiResponse),
        timestamp: new Date().toISOString()
      }
    ];

    setMessages(finalMessages);
    saveCurrentConversation(finalMessages);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isResuming) return;
    await dispatchMessage(inputValue);
    setInputValue('');
  };

  const handleResumeConversation = async (conversationId) => {
    setIsResuming(true);
    const resumedMessages = await resumeConversation(conversationId);
    setMessages(Array.isArray(resumedMessages) ? resumedMessages : []);
    setTimeout(() => setIsResuming(false), 1000);
  };

  const handleQuickCommand = async (command) => {
    setInputValue('');
    await dispatchMessage(command);
  };

  return (
    <div className="kracked-ijam-chat">
      <div className="chat-header">
        <div className="chat-title">
          <h2>IJAM Chat</h2>
        </div>

        {conversations.length > 1 && (
          <button
            className="secondary-button"
            onClick={() => handleResumeConversation(conversations[conversations.length - 1].id)}
            disabled={isResuming}
          >
            Resume Conversation
          </button>
        )}

        {conversations.length > 0 && !isResuming && (
          <button className="secondary-button" onClick={startNewConversation}>
            New Chat
          </button>
        )}
      </div>

      <div className="diary-panel">
        <div className="diary-panel-header">
          <div>
            <p className="diary-kicker">Diary Layer</p>
            <h3>{diaryMeta?.name || 'Session Diary'}</h3>
          </div>
          <div className="diary-count-pill">{diaryEntries.length} entry</div>
        </div>

        <div className="diary-actions">
          <button type="button" className="secondary-button" onClick={() => handleQuickCommand('save diary')}>
            Save Diary
          </button>
          <button type="button" className="secondary-button" onClick={() => handleQuickCommand('review diary')}>
            Review Diary
          </button>
          <button type="button" className="secondary-button" onClick={() => handleQuickCommand('load diary archive')}>
            Load Archive
          </button>
        </div>

        {recentDiaryEntries.length > 0 ? (
          <div className="diary-entry-list">
            {recentDiaryEntries.map((entry) => (
              <div key={entry.id} className="diary-entry-card">
                <div className="diary-entry-meta">
                  <strong>{entry.dateKey}</strong>
                  <span>{entry.sessionType}</span>
                </div>
                <p>{entry.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="diary-empty-state">
            Belum ada entry browser-layer lagi. Guna <code>save diary</code> untuk mula simpan milestone sesi.
          </div>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={index}
              className={`message ${isUser ? 'user' : 'ai'}`}
            >
              <div className="message-content">{msg.content}</div>
              <div className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString('ms-MY', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
              handleSendMessage();
            }
          }}
          placeholder="Tanya IJAM tentang apa-apa..."
          disabled={isResuming}
        />
        <button
          onClick={handleSendMessage}
          disabled={isResuming || !inputValue.trim()}
          className="send-button"
        >
          Hantar
        </button>
      </div>

      <style>{`
        .kracked-ijam-chat {
          width: 100%;
          max-width: ${compact ? 'none' : '1200px'};
          height: ${compact ? '100%' : '600px'};
          margin: 0 auto;
          background: #f8fafc;
          border: 1px solid #dbe4ef;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: #0f172a;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 20px;
          background: #ffffff;
          border-bottom: 1px solid #dbe4ef;
        }

        .chat-title {
          flex: 1;
        }

        .chat-title h2 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: ${compact ? '16px' : '20px'};
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .diary-panel {
          padding: 16px 20px;
          border-bottom: 1px solid #dbe4ef;
          background:
            radial-gradient(circle at top left, rgba(34, 197, 94, 0.16), transparent 42%),
            linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%);
        }

        .diary-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .diary-kicker {
          margin: 0 0 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #166534;
        }

        .diary-panel h3 {
          margin: 0;
          font-size: 18px;
          color: #14532d;
        }

        .diary-count-pill {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(34, 197, 94, 0.18);
          color: #166534;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .diary-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }

        .diary-entry-list {
          display: grid;
          gap: 10px;
        }

        .diary-entry-card {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(148, 163, 184, 0.24);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
        }

        .diary-entry-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
          font-size: 12px;
          color: #475569;
        }

        .diary-entry-card p,
        .diary-empty-state {
          margin: 0;
          line-height: 1.5;
          color: #0f172a;
          font-size: 13px;
        }

        .message {
          max-width: 72%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid #dbe4ef;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
        }

        .message.user {
          align-self: flex-end;
          background: #dcfce7;
          border-color: #86efac;
        }

        .message.ai {
          align-self: flex-start;
          background: #ffffff;
        }

        .message-content {
          line-height: 1.6;
          color: #0f172a;
          white-space: pre-wrap;
        }

        .timestamp {
          font-size: 11px;
          color: #64748b;
          text-align: right;
          margin-top: 8px;
        }

        .chat-input {
          display: flex;
          gap: 10px;
          padding: ${compact ? '14px 16px' : '16px 20px'};
          background: #ffffff;
          border-top: 1px solid #dbe4ef;
        }

        .chat-input input {
          flex: 1;
          padding: 12px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          background: #ffffff;
          outline: none;
        }

        .chat-input input::placeholder {
          color: #64748b;
        }

        .chat-input input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
        }

        .send-button,
        .secondary-button {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
        }

        .send-button {
          background: #16a34a;
          color: #ffffff;
        }

        .send-button:hover {
          background: #15803d;
        }

        .secondary-button {
          background: #ffffff;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        .secondary-button:hover {
          background: #f8fafc;
        }

        .send-button:disabled,
        .secondary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 720px) {
          .diary-panel,
          .chat-header,
          .chat-input {
            padding-left: 16px;
            padding-right: 16px;
          }

          .diary-panel-header,
          .diary-entry-meta,
          .chat-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .message {
            max-width: 88%;
          }
        }
      `}</style>
    </div>
  );
}
