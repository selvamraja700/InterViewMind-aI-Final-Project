import React from 'react';
import { useInterview } from '../../context/InterviewContext';

export default function ProblemPanel() {
  const { problem } = useInterview();

  if (!problem) {
    return (
      <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        No problem loaded.
      </div>
    );
  }

  const difficultyClass =
    problem.difficulty === 'Easy'
      ? 'badge-easy'
      : problem.difficulty === 'Hard'
        ? 'badge-hard'
        : 'badge-medium';

  return (
    <div
      style={{
        padding: '14px 16px',
        overflowY: 'auto',
        maxHeight: '100%',
        fontSize: '0.85rem',
      }}
    >
      {/* Title Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {problem.title}
        </h2>
        <span className={`badge ${difficultyClass}`}>{problem.difficulty}</span>
        {problem.topic && (
          <span
            style={{
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 500,
              background: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--accent-blue)',
            }}
          >
            {problem.topic}
          </span>
        )}
      </div>

      {/* Problem Statement */}
      <div
        style={{
          color: 'var(--text-primary)',
          lineHeight: '1.65',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {problem.statement}
      </div>

      {/* Constraints */}
      {problem.constraints && problem.constraints.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            Constraints
          </h3>
          <ul
            style={{
              paddingLeft: '18px',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
            }}
          >
            {problem.constraints.map((c, i) => (
              <li key={i} className="monospace" style={{ fontSize: '0.8rem' }}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Examples */}
      {problem.examples && problem.examples.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            Examples
          </h3>
          {problem.examples.map((ex, i) => (
            <div
              key={i}
              className="monospace"
              style={{
                padding: '10px 12px',
                background: 'var(--bg-dark)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '8px',
                fontSize: '0.8rem',
                lineHeight: '1.6',
              }}
            >
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Input:</strong>{' '}
                {ex.input}
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Output:</strong>{' '}
                {ex.output}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
