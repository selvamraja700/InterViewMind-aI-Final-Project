import React, { useState, useEffect, useRef } from 'react';
import { useInterview } from '../../context/InterviewContext';
import { createSession, prepareInterview } from '../../services/api';

const CHECKLIST_ITEMS = [
  { key: 'problem_loaded', label: 'Problem loaded' },
  { key: 'constraints_analyzed', label: 'Analyzing constraints' },
  { key: 'brute_force_mapped', label: 'Mapping brute force paths' },
  { key: 'hints_prepared', label: 'Preparing optimization hints' },
  { key: 'evaluation_ready', label: 'Setting up evaluation engine' },
];

export default function PreparationScreen({ speakText }) {
  const {
    problem,
    setProblem,
    userName,
    setSessionId,
    setInterviewActive,
    addMessage,
  } = useInterview();

  const [completed, setCompleted] = useState({});
  const [fadingOut, setFadingOut] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function run() {
      try {
        // Create session
        const { sessionId, problem: parsedProblem } = await createSession(problem?.statement || '', userName);
        setSessionId(sessionId);
        if (parsedProblem) {
          setProblem(parsedProblem);
        }

        // Prepare interview with SSE-style handlers
        await prepareInterview(sessionId, {
        onEvent: (eventName) => {
          setCompleted((prev) => ({ ...prev, [eventName]: true }));
        },
        onReady: () => {
          // Small delay then activate
          setTimeout(() => {
            setFadingOut(true);

            setTimeout(() => {
              setInterviewActive(true);

              // Jake's opening message
              const firstMessage =
                "Great, I've reviewed the problem. Walk me through your initial brute force approach.";

              addMessage({
                id: Date.now(),
                role: 'ai',
                content: firstMessage,
                timestamp: new Date().toISOString(),
              });

              if (speakText) {
                speakText(firstMessage);
              }
            }, 400);
          }, 300);
        },
      });
      } catch (err) {
        console.error("Failed to prepare interview:", err);
      }
    }

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="overlay"
      style={{
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      <div className="overlay-card" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Preparing Your Interview
          </span>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              marginTop: '8px',
            }}
          >
            Jake is reviewing your problem and setting up the session...
          </p>
        </div>

        {/* Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {CHECKLIST_ITEMS.map((item) => {
            const done = completed[item.key];
            return (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                {done ? (
                  <div className="prep-check" />
                ) : (
                  <div className="prep-spinner" />
                )}
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: done ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
