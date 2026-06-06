import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../../context/InterviewContext';
import { endInterview } from '../../services/api';

export default function TopBar() {
  const { problem, jakeState, sessionId, setReview } = useInterview();
  const navigate = useNavigate();
  const [ending, setEnding] = useState(false);

  function handleClose() {
    navigate('/problem');
  }

  async function handleEndInterview() {
    if (ending) return;
    setEnding(true);
    try {
      const reviewData = await endInterview(sessionId);
      setReview(reviewData);
    } catch (err) {
      console.error('Failed to end interview:', err);
    } finally {
      setEnding(false);
    }
  }

  const difficultyClass =
    problem?.difficulty === 'Easy'
      ? 'badge-easy'
      : problem?.difficulty === 'Hard'
        ? 'badge-hard'
        : 'badge-medium';

  // Jake status display
  let statusText = 'Jake is idle';
  let dotClass = 'status-dot status-dot-idle';
  let statusColor = 'var(--text-muted)';

  if (jakeState === 'speaking') {
    statusText = 'Jake is speaking...';
    dotClass = 'status-dot status-dot-speaking';
    statusColor = 'var(--accent-green)';
  } else if (jakeState === 'listening') {
    statusText = 'Jake is listening...';
    dotClass = 'status-dot status-dot-listening';
    statusColor = 'var(--accent-blue)';
  }

  return (
    <header
      className="panel-border-b"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        background: 'var(--panel-bg)',
        flexShrink: 0,
        minHeight: '52px',
      }}
    >
      {/* Left: Logo + Problem info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          InterviewMind AI
        </span>

        {problem && (
          <>
            <span
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--border-color)',
              }}
            />
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {problem.title}
            </span>
            <span className={`badge ${difficultyClass}`}>
              {problem.difficulty}
            </span>
          </>
        )}
      </div>

      {/* Center: Jake status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span className={dotClass} />
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: statusColor,
          }}
        >
          {statusText}
        </span>
      </div>

      {/* Right: Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          id="close-interview-btn"
          className="btn btn-outline"
          onClick={handleClose}
          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
        >
          ✕ Close
        </button>
        <button
          id="end-interview-btn"
          className="btn btn-danger"
          onClick={handleEndInterview}
          disabled={ending}
          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
        >
          {ending ? 'Ending...' : '⏹ End Interview'}
        </button>
      </div>
    </header>
  );
}
