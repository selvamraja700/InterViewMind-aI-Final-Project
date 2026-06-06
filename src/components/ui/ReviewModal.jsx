import React, { useEffect, useState } from 'react';
import { useInterview } from '../../context/InterviewContext';

const CATEGORY_LABELS = {
  problem_solving: 'Problem Solving Approach',
  communication: 'Communication and Explanation',
  code_quality: 'Code Quality',
  optimization: 'Optimization Thinking',
  edge_cases: 'Edge Case Awareness',
};

const CATEGORY_KEYS = [
  'problem_solving',
  'communication',
  'code_quality',
  'optimization',
  'edge_cases',
];

export default function ReviewModal() {
  const { review, setReview } = useInterview();
  const [animated, setAnimated] = useState(false);

  // Trigger bar animations after mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!review) return null;

  function handleDownload() {
    const lines = [
      '═══════════════════════════════════════',
      '        INTERVIEWMIND AI — REVIEW      ',
      '═══════════════════════════════════════',
      '',
      `Overall Score: ${review.overall_score}/100`,
      '',
      '── Category Scores ──────────────────',
      '',
    ];

    CATEGORY_KEYS.forEach((key) => {
      const label = CATEGORY_LABELS[key];
      const score = review[key];
      lines.push(`  ${label}: ${score}/100`);
    });

    lines.push('');
    lines.push('── Strengths & Weaknesses ───────────');
    lines.push(`  Strongest: ${review.strongest}`);
    lines.push(`  Weakest: ${review.weakest}`);
    lines.push('');
    lines.push('── Detailed Feedback ────────────────');
    lines.push('');
    lines.push(review.detailed_feedback);
    lines.push('');
    lines.push('═══════════════════════════════════════');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interviewmind-review.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getScoreColor(score) {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return 'var(--warning-yellow)';
    return 'var(--danger-red)';
  }

  return (
    <div className="overlay" style={{ zIndex: 200 }}>
      <div
        className="overlay-card"
        style={{
          maxWidth: '600px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '32px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}
          >
            Interview Performance Review
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Here's how you performed in this session
          </p>
        </div>

        {/* Overall Score */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '28px',
          }}
        >
          <div className="overall-score-circle">
            {review.overall_score}
          </div>
        </div>

        {/* Category Score Bars */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {CATEGORY_KEYS.map((key) => {
            const score = review[key];
            const label = CATEGORY_LABELS[key];
            return (
              <div key={key}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: getScoreColor(score),
                    }}
                  >
                    {score}
                  </span>
                </div>
                <div className="score-bar-track">
                  <div
                    className="score-bar-fill"
                    style={{ width: animated ? `${score}%` : '0%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Strongest / Weakest */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              minWidth: '200px',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--accent-green)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              💪 Strongest
            </span>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                marginTop: '4px',
                fontWeight: 500,
              }}
            >
              {review.strongest}
            </p>
          </div>

          <div
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(248, 81, 73, 0.08)',
              border: '1px solid rgba(248, 81, 73, 0.2)',
              minWidth: '200px',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--danger-red)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              🎯 Needs Work
            </span>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                marginTop: '4px',
                fontWeight: 500,
              }}
            >
              {review.weakest}
            </p>
          </div>
        </div>

        {/* Detailed Feedback */}
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '10px',
            }}
          >
            Detailed Feedback
          </h3>
          <p
            style={{
              fontSize: '0.85rem',
              lineHeight: '1.7',
              color: 'var(--text-primary)',
            }}
          >
            {review.detailed_feedback}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            id="download-review-btn"
            className="btn btn-primary"
            onClick={handleDownload}
            style={{ flex: 1 }}
          >
            📥 Download Report
          </button>
          <button
            id="close-review-btn"
            className="btn btn-outline"
            onClick={() => setReview(null)}
            style={{ flex: 1 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
