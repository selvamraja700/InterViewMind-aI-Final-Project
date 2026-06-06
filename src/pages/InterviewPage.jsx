import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInterview } from '../context/InterviewContext';
import { pingBackend } from '../services/api';
import useVoice from '../hooks/useVoice';
import PreparationScreen from '../components/preparation/PreparationScreen';
import ReviewModal from '../components/ui/ReviewModal';
import TabGuard from '../components/interview/TabGuard';
import TopBar from '../components/layout/TopBar';
import LeftPanel from '../components/layout/LeftPanel';
import RightPanel from '../components/layout/RightPanel';

export default function InterviewPage() {
  const {
    interviewActive,
    review,
    jakeState,
    setJakeState,
    setSubtitleText,
    addMessage,
  } = useInterview();

  const [backendReady, setBackendReady] = useState(false);
  const [showWakeup, setShowWakeup] = useState(true);

  // Resizable columns state
  const [leftWidth, setLeftWidth] = useState(60);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection while dragging
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const newLeftWidth = (e.clientX / window.innerWidth) * 100;
    // Constrain width between 30% and 70%
    if (newLeftWidth >= 30 && newLeftWidth <= 70) {
      setLeftWidth(newLeftWidth);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  // Initialize useVoice at this level
  const voice = useVoice();

  // Wrap speakText to manage jakeState transitions
  const speakText = useCallback(
    (text) => {
      if (!text) return;

      setJakeState('speaking');
      setSubtitleText(text);

      voice.speakText(text, (transcript) => {
        // onTranscript callback when user speaks after Jake finishes
        if (transcript && transcript.trim()) {
          // This is handled by ChatInput
        }
      });
    },
    [voice, setJakeState, setSubtitleText]
  );

  // Monitor voice state to sync jakeState
  useEffect(() => {
    if (voice.voiceState === 'speaking') {
      setJakeState('speaking');
    } else if (voice.voiceState === 'listening') {
      setJakeState('listening');
    } else {
      // 'off'
      if (jakeState === 'speaking' || jakeState === 'listening') {
        setJakeState('idle');
      }
    }
  }, [voice.voiceState]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Ping backend on mount
  useEffect(() => {
    let mounted = true;
    pingBackend().then(() => {
      if (mounted) {
        setBackendReady(true);
        setShowWakeup(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-dark)',
      }}
    >
      {/* Wakeup Banner */}
      {showWakeup && (
        <div className="wakeup-banner">
          ⚡ Waking up the backend server... This may take a moment.
        </div>
      )}

      {/* Preparation Overlay */}
      {!interviewActive && <PreparationScreen speakText={speakText} />}

      {/* Review Overlay */}
      {review && <ReviewModal />}

      {/* Tab Guard (invisible) */}
      <TabGuard />

      {/* Top Bar */}
      <TopBar />

      {/* Main Content — Resizable Split Layout */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Left Column */}
        <div style={{ width: `${leftWidth}%`, overflow: 'hidden', display: 'flex', flexShrink: 0 }}>
          <LeftPanel speakText={speakText} voice={voice} />
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: '8px',
            background: 'var(--panel-bg)',
            borderLeft: '1px solid var(--border-color)',
            borderRight: '1px solid var(--border-color)',
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            zIndex: 10,
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--panel-bg)')}
        >
          {/* Grip dots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ width: `calc(${100 - leftWidth}% - 8px)`, overflow: 'hidden', display: 'flex', flexShrink: 0 }}>
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
