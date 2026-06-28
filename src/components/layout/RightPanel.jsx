import React, { useCallback, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useInterview } from '../../context/InterviewContext';
import { submitCode } from '../../services/api';
import LanguageSelector from '../ui/LanguageSelector';
import StdinInput from '../ui/StdinInput';
import OutputConsole from '../ui/OutputConsole';

const LANGUAGE_MAP = {
  Python: 'python',
  JavaScript: 'javascript',
  Java: 'java',
  'C++': 'cpp',
};

const CODE_TEMPLATES = {
  Python: `def solution():
    pass
`,
  JavaScript: `function solution() {
    // your code here
}
`,
  Java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // your code here
    }
}
`,
  'C++': `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // your code here
    return 0;
}
`,
};

export default function RightPanel() {
  const { language, currentCode, setCurrentCode, stdinText, setCodeOutput } = useInterview();
  const [submitting, setSubmitting] = useState(false);

  const monacoLang = LANGUAGE_MAP[language] || 'python';

  // Always load the correct template when language changes
  useEffect(() => {
    setCurrentCode(CODE_TEMPLATES[language] || '');
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load initial template on mount (only if editor is empty)
  useEffect(() => {
    if (!currentCode || currentCode.trim() === '') {
      setCurrentCode(CODE_TEMPLATES['Python']);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditorChange = useCallback(
    (value) => {
      setCurrentCode(value || '');
    },
    [setCurrentCode]
  );

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await submitCode(currentCode, language, stdinText);
      setCodeOutput(result);
    } catch (err) {
      setCodeOutput({
        stdout: '',
        stderr: err.message || 'Execution failed',
        exit_code: 1,
        time_ms: 0,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--panel-bg)',
      }}
    >
      {/* Language Selector */}
      <div
        className="panel-border-b"
        style={{
          flex: '0 0 auto',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <LanguageSelector />
      </div>

      {/* Monaco Editor */}
      <div className="monaco-container panel-border-b" style={{ flex: '1 1 0', minHeight: '300px' }}>
        <Editor
          height="100%"
          language={monacoLang}
          theme="vs-dark"
          value={currentCode}
          onChange={handleEditorChange}
          options={{
            fontSize: 14,
            fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12 },
            wordWrap: 'on',
            tabSize: 4,
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            bracketPairColorization: { enabled: true },
          }}
          loading={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              Loading editor...
            </div>
          }
        />
      </div>

      {/* Console Toolbar (Run Code) */}
      <div
        className="panel-border-b"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--panel-bg)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Console
        </span>
        <button
          id="submit-code-btn"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ padding: '6px 16px', fontSize: '0.8rem', minWidth: '120px' }}
        >
          {submitting ? '⏳ Running...' : '▶ Run Code'}
        </button>
      </div>

      {/* Stdin and Output */}
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', maxHeight: '40%' }}>
        <div className="panel-border-b" style={{ flex: '0 0 auto' }}>
          <StdinInput />
        </div>
        <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
          <OutputConsole />
        </div>
      </div>
    </div>
  );
}
