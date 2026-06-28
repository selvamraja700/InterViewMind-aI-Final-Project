import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';

export default function NameScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { setUserName } = useInterview();
  const navigate = useNavigate();

  const charCount = name.length;
  const isOverLimit = charCount > 8;

  function handleContinue() {
    setError('');

    if (charCount === 0) {
      setError('Please enter your name to continue.');
      return;
    }

    if (isOverLimit) {
      setError('Name must be 8 characters or less.');
      return;
    }

    setUserName(name.trim());
    navigate('/problem');
  }

  function handleSkip() {
    setUserName(null);
    navigate('/problem');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleContinue();
    }
  }

  return (
    <div className="overlay" style={{ background: 'var(--bg-dark)' }}>
      <div className="overlay-card" style={{ textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            InterviewMind AI
          </span>
        </div>

        {/* Tagline */}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '28px' }}>
          AI-Powered Technical Interview Simulator
        </p>

        {/* Question */}
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '20px',
            color: 'var(--text-primary)',
          }}
        >
          Before we begin, what's your name?
        </h1>

        {/* Input */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <input
            id="name-input"
            type="text"
            className="input-field"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
            aria-label="Your name"
            maxLength={8}
            style={{
              borderColor: isOverLimit ? 'var(--danger-red)' : undefined,
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.75rem',
              color: isOverLimit ? 'var(--danger-red)' : 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            {charCount}/8
          </span>
        </div>

        {/* Error */}
        {error && (
          <p
            style={{
              color: 'var(--danger-red)',
              fontSize: '0.8rem',
              marginBottom: '12px',
              textAlign: 'left',
            }}
          >
            {error}
          </p>
        )}

        {/* Continue Button */}
        <button
          id="continue-btn"
          className="btn btn-primary"
          onClick={handleContinue}
          style={{ width: '100%', marginTop: '12px' }}
        >
          Continue
        </button>

        {/* Skip */}
        <button
          id="skip-btn"
          onClick={handleSkip}
          style={{
            marginTop: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: 'inherit',
          }}
        >
          Skip, I'd rather stay anonymous
        </button>
      </div>
    </div>
  );
}
