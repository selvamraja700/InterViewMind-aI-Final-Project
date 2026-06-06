import React, { useState, useRef, useEffect } from 'react';
import { useInterview } from '../../context/InterviewContext';
import { sendMessageToAI, analyzeScreen } from '../../services/api';
import VoiceButton from '../ui/VoiceButton';

export default function ChatInput({ speakText, voice }) {
  const {
    sessionId,
    currentCode,
    messages,
    addMessage,
    setSubtitleText,
    setJakeState,
    userName,
  } = useInterview();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle voice transcript
  useEffect(() => {
    if (
      voice &&
      voice.liveTranscript &&
      voice.voiceState === 'listening'
    ) {
      // Show live transcript in input area
    }
  }, [voice?.liveTranscript, voice?.voiceState]);

  async function sendMessage(text) {
    const msg = text?.trim();
    if (!msg) return;

    // Add user message
    addMessage({
      id: Date.now(),
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    });

    setInputText('');
    setIsTyping(true);

    try {
      const response = await sendMessageToAI(sessionId, msg, currentCode);

      // Add AI message
      addMessage({
        id: Date.now() + 1,
        role: 'ai',
        content: response,
        timestamp: new Date().toISOString(),
      });

      setSubtitleText(response);

      if (speakText) {
        speakText(response);
      }
    } catch (err) {
      addMessage({
        id: Date.now() + 2,
        role: 'ai',
        content: 'Sorry, I encountered an error. Could you repeat that?',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  }

  function handleVoiceToggle() {
    if (!voice) return;

    if (voice.voiceState === 'off') {
      voice.startListening();
    } else {
      voice.stopListening();
    }
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const imageUrl = URL.createObjectURL(file);
          
          addMessage({
            id: Date.now(),
            role: 'user',
            content: `📋 Pasted screenshot: ${file.name || 'image.png'}`,
            imageUrl: imageUrl,
            timestamp: new Date().toISOString(),
          });

          setIsTyping(true);

          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target.result.split(',')[1];
            try {
              const response = await analyzeScreen(sessionId, base64);
              addMessage({
                id: Date.now() + 1,
                role: 'ai',
                content: response,
                timestamp: new Date().toISOString(),
              });
              if (speakText) {
                speakText(response);
              }
            } catch (err) {
              addMessage({
                id: Date.now() + 1,
                role: 'ai',
                content: "I've received your screenshot. Let's look at your code together.",
                timestamp: new Date().toISOString(),
              });
            } finally {
              setIsTyping(false);
            }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  // Listen for final voice transcripts
  useEffect(() => {
    if (voice?.finalTranscriptEvent) {
      sendMessage(voice.finalTranscriptEvent.text);
    }
  }, [voice?.finalTranscriptEvent]);

  return (
    <div style={{ background: 'var(--panel-bg)' }}>
      {/* Chat Messages */}
      <div
        style={{
          maxHeight: '180px',
          overflowY: 'auto',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {msg.role === 'user' ? (userName ? userName[0].toUpperCase() : 'U') : 'J'}
            </div>

            {/* Message Bubble + Time */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              <div
                className={`chat-bubble ${
                  msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                }`}
                style={{
                  maxWidth: '100%',
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ wordBreak: 'break-word' }}>{msg.content}</div>
                {msg.imageUrl && (
                  <div
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      marginTop: '4px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '4px',
                      display: 'inline-block'
                    }}
                  >
                    <img
                      src={msg.imageUrl}
                      alt="Attachment"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '160px',
                        borderRadius: '6px',
                        display: 'block',
                        cursor: 'zoom-in',
                      }}
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                    />
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  padding: '0 4px',
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              J
            </div>
            <div className="chat-bubble chat-bubble-ai typing-indicator" style={{ margin: 0 }}>
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Live transcript / User subtitle */}
      {voice && voice.voiceState === 'listening' && voice.liveTranscript && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row-reverse',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            animation: 'subtitle-fade-in 0.3s ease',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 0 12px 3px rgba(59, 130, 246, 0.25)', // soft blue glow
            }}
          >
            {userName ? userName[0].toUpperCase() : 'U'}
          </div>
          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              fontStyle: 'italic',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              padding: '10px 14px',
              borderRadius: '14px',
              borderBottomRightRadius: '0',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              maxWidth: '85%',
            }}
          >
            🎤 {voice.liveTranscript}
          </div>
        </div>
      )}

      {/* Input Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          padding: '10px 14px',
          borderTop: '1px solid var(--border-color)',
        }}
        onPaste={handlePaste}
      >
        <VoiceButton
          voiceState={voice?.voiceState || 'off'}
          onToggle={handleVoiceToggle}
        />

        {/* Attachment Button */}
        <input
          type="file"
          id="chat-file-upload"
          style={{ display: 'none' }}
          accept="image/*"
          onChange={(e) => {
            // Safety fallback, focus handler usually clears it
            window.isTabGuardSuspended = false;
            
            if (e.target.files && e.target.files.length > 0) {
              const file = e.target.files[0];
              const imageUrl = URL.createObjectURL(file);
              // Simulate uploading image
              addMessage({
                id: Date.now(),
                role: 'user',
                content: `📎 Attached image: ${file.name}`,
                imageUrl: imageUrl,
                timestamp: new Date().toISOString(),
              });
              
              setIsTyping(true);
              const reader = new FileReader();
              reader.onload = async (event) => {
                const base64 = event.target.result.split(',')[1];
                try {
                  const response = await analyzeScreen(sessionId, base64);
                  addMessage({
                    id: Date.now() + 1,
                    role: 'ai',
                    content: response,
                    timestamp: new Date().toISOString(),
                  });
                  if (speakText) {
                    speakText(response);
                  }
                } catch (err) {
                  addMessage({
                    id: Date.now() + 1,
                    role: 'ai',
                    content: "I've received your screenshot. Walk me through what you're showing me.",
                    timestamp: new Date().toISOString(),
                  });
                } finally {
                  setIsTyping(false);
                }
              };
              reader.readAsDataURL(file);
            }
            
            // Clear value so the same file can be uploaded again if needed
            e.target.value = '';
          }}
        />
        <button
          className="btn"
          style={{
            padding: '8px',
            borderRadius: '50%',
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            marginBottom: '1px',
          }}
          onClick={() => {
            window.isTabGuardSuspended = true;
            document.getElementById('chat-file-upload').click();
          }}
          title="Attach Screenshot"
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          className="input-field"
          placeholder="Type or speak..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            minHeight: '38px',
            maxHeight: '80px',
            fontSize: '0.85rem',
          }}
          aria-label="Chat input"
        />

        <button
          id="send-msg-btn"
          className="btn btn-primary"
          onClick={() => sendMessage(inputText)}
          disabled={!inputText.trim() && !isTyping}
          style={{
            padding: '8px 14px',
            fontSize: '0.8rem',
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
