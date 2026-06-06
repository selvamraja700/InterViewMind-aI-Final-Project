import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';

export default function ProblemLoadScreen() {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [shakeActive, setShakeActive] = useState(false);
  const { userName, setProblem } = useInterview();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  function handleCreate() {
    setError('');

    if (!text.trim()) {
      setShakeActive(true);
      setError('Please paste a LeetCode problem before continuing.');
      setTimeout(() => setShakeActive(false), 500);
      return;
    }

    const problemObj = {
      title: 'Interview Problem',
      difficulty: 'Medium',
      topic: 'Algorithm',
      statement: text.trim(),
      constraints: [],
      examples: [],
    };

    setProblem(problemObj);
    navigate('/interview');
  }

  function handleDiscard() {
    setText('');
    setError('');
  }

  const greeting = userName
    ? `Hi ${userName}, load your LeetCode question`
    : 'Load your LeetCode question';

  return (
    <div className="overlay" style={{ background: 'var(--bg-dark)' }}>
      <div
        className="overlay-card"
        style={{ maxWidth: '640px' }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            InterviewMind AI
          </span>
        </div>

        {/* Greeting */}
        <h1
          style={{
            fontSize: '1.35rem',
            fontWeight: 600,
            marginBottom: '20px',
            color: 'var(--text-primary)',
          }}
        >
          {greeting}
        </h1>

        {/* Textarea */}
        <div className={shakeActive ? 'shake' : ''}>
          <textarea
            id="problem-textarea"
            ref={textareaRef}
            className="input-field monospace"
            placeholder="Paste the full LeetCode problem statement here..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError('');
            }}
            rows={12}
            style={{
              resize: 'vertical',
              minHeight: '200px',
              fontSize: '0.85rem',
              lineHeight: '1.6',
            }}
            aria-label="Problem statement"
          />
        </div>

        {/* Error */}
        {error && (
          <p
            style={{
              color: 'var(--danger-red)',
              fontSize: '0.8rem',
              marginTop: '8px',
            }}
          >
            {error}
          </p>
        )}

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px',
          }}
        >
          <button
            id="create-interview-btn"
            className="btn btn-primary"
            onClick={handleCreate}
            style={{ flex: 1 }}
          >
            🚀 Create Interview
          </button>
          <button
            id="discard-btn"
            className="btn btn-outline"
            onClick={handleDiscard}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
