import React, { useState, useEffect, useRef } from 'react';
import { useInterview } from '../../context/InterviewContext';
import SoundWave from '../ui/SoundWave';

export default function JakePanel() {
  const { jakeState, subtitleText } = useInterview();
  const [imgError, setImgError] = useState(false);
  const [visibleSubtitle, setVisibleSubtitle] = useState('');
  const [subtitleFading, setSubtitleFading] = useState(false);
  const fadeTimerRef = useRef(null);

  // Handle subtitle display and fade-out
  useEffect(() => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    if (subtitleText) {
      setVisibleSubtitle(subtitleText);
      setSubtitleFading(false);
    }
  }, [subtitleText]);

  // Fade out 3 seconds after jakeState returns to idle
  useEffect(() => {
    if (jakeState === 'idle' && visibleSubtitle) {
      fadeTimerRef.current = setTimeout(() => {
        setSubtitleFading(true);
        // Clear after fade completes
        setTimeout(() => {
          setVisibleSubtitle('');
          setSubtitleFading(false);
        }, 500);
      }, 3000);
    }

    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [jakeState, visibleSubtitle]);

  // Avatar CSS class
  const avatarClass =
    jakeState === 'speaking'
      ? 'jake-speaking'
      : jakeState === 'listening'
        ? 'jake-listening'
        : '';

  return (
    <div
      style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: 'var(--panel-bg)',
      }}
    >
      {/* Avatar */}
      {imgError ? (
        <div className={`jake-avatar-fallback ${avatarClass}`}>
          J
        </div>
      ) : (
        <img
          src="/jake-avatar.png"
          alt="Jake"
          className={`jake-avatar ${avatarClass}`}
          onError={() => setImgError(true)}
        />
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + Sound Wave row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px',
          }}
        >
          <div>
            <span
              style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
              }}
            >
              Jake
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginLeft: '8px',
              }}
            >
              Technical Recruiter
            </span>
          </div>
          <SoundWave isActive={jakeState === 'speaking'} />
        </div>

        {/* Subtitle */}
        {visibleSubtitle && (
          <p
            className={`subtitle-text ${subtitleFading ? 'fade-out' : ''}`}
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: '1.4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              margin: 0,
            }}
          >
            {visibleSubtitle}
          </p>
        )}
      </div>

      {/* Status dot */}
      <div
        className={`status-dot ${
          jakeState === 'speaking'
            ? 'status-dot-speaking'
            : jakeState === 'listening'
              ? 'status-dot-listening'
              : 'status-dot-idle'
        }`}
      />
    </div>
  );
}
