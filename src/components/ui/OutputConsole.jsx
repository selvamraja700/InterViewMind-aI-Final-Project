import React from 'react';
import { useInterview } from '../../context/InterviewContext';

export default function OutputConsole() {
  const { codeOutput } = useInterview();

  // Empty state
  if (!codeOutput) {
    return (
      <div
        style={{
          padding: '14px 16px',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          fontStyle: 'italic',
        }}
      >
        Run your code to see output
      </div>
    );
  }

  const { stdout, stderr, exit_code, time_ms } = codeOutput;

  // Timeout (time_ms > 5000 treated as TLE)
  const isTimeout = time_ms > 5000;
  const isError = exit_code !== 0 && !isTimeout;
  const isSuccess = exit_code === 0 && !isTimeout;

  let headerText = 'Output';
  let headerColor = 'var(--accent-green)';

  if (isTimeout) {
    headerText = '⏱ Time Limit Exceeded';
    headerColor = 'var(--warning-orange)';
  } else if (isError) {
    headerText = '✕ Error';
    headerColor = 'var(--danger-red)';
  } else {
    headerText = '✓ Output';
    headerColor = 'var(--accent-green)';
  }

  return (
    <div style={{ padding: '10px 14px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: headerColor,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {headerText}
        </span>

        {isSuccess && time_ms != null && (
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            {time_ms}ms
          </span>
        )}
      </div>

      {/* Content */}
      <div
        className="monospace"
        style={{
          padding: '10px 12px',
          background: 'var(--bg-dark)',
          borderRadius: '8px',
          border: `1px solid ${isError ? 'var(--danger-red)' : 'var(--border-color)'}`,
          fontSize: '0.8rem',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: isError ? 'var(--danger-red)' : 'var(--text-primary)',
          maxHeight: '120px',
          overflowY: 'auto',
        }}
      >
        {isError ? stderr || 'Unknown error' : stdout || '(no output)'}
      </div>
    </div>
  );
}
