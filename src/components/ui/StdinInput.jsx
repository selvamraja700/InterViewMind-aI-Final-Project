import React from 'react';
import { useInterview } from '../../context/InterviewContext';

export default function StdinInput() {
  const { stdinText, setStdinText } = useInterview();

  return (
    <div style={{ padding: '10px 14px' }}>
      <label
        htmlFor="stdin-input"
        style={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Test Input
      </label>
      <textarea
        id="stdin-input"
        className="input-field monospace"
        placeholder='Test input (optional) — e.g. [2,7,11,15]'
        value={stdinText}
        onChange={(e) => setStdinText(e.target.value)}
        rows={2}
        style={{
          resize: 'none',
          fontSize: '0.8rem',
          minHeight: '48px',
        }}
        aria-label="Standard input for code execution"
      />
    </div>
  );
}
