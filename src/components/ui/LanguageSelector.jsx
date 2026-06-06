import React from 'react';
import { useInterview } from '../../context/InterviewContext';

const LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++'];

export default function LanguageSelector() {
  const { language, setLanguage } = useInterview();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <label
        htmlFor="language-select"
        style={{
          fontSize: '0.8rem',
          fontWeight: 500,
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        Language
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-dark)',
          color: 'var(--text-primary)',
          fontSize: '0.8rem',
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
        }}
        aria-label="Programming language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
}
