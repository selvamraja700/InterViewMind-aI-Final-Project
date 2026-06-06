import React from 'react';

export default function VoiceButton({ voiceState, onToggle }) {
  // Check browser support
  const speechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  if (!speechSupported) {
    return (
      <div
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          padding: '4px 8px',
          maxWidth: '100px',
        }}
      >
        Voice requires Chrome
      </div>
    );
  }

  let bgColor = '#374151'; // off - gray
  let icon = '🎤';
  let statusLabel = '';
  let showPulse = false;

  if (voiceState === 'listening') {
    bgColor = 'var(--accent-green)';
    icon = '🎤';
    statusLabel = 'Listening';
    showPulse = true;
  } else if (voiceState === 'speaking') {
    bgColor = 'var(--accent-blue)';
    icon = '🔊';
    statusLabel = 'Jake Speaking';
    showPulse = false;
  } else {
    // off
    icon = '🎤';
    statusLabel = '';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        flexShrink: 0,
      }}
    >
      <button
        id="voice-toggle-btn"
        onClick={onToggle}
        aria-label={`Voice ${voiceState}`}
        style={{
          position: 'relative',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: 'none',
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        {showPulse && <span className="voice-pulse-ring" />}
        <span style={{ position: 'relative', zIndex: 1 }}>{icon}</span>
      </button>

      {statusLabel && (
        <span
          style={{
            fontSize: '0.6rem',
            color:
              voiceState === 'listening'
                ? 'var(--accent-green)'
                : 'var(--accent-blue)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {statusLabel}
        </span>
      )}
    </div>
  );
}
