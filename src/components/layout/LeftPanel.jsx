import React from 'react';
import ProblemPanel from '../interview/ProblemPanel';
import JakePanel from '../interview/JakePanel';
import ChatInput from '../interview/ChatInput';

export default function LeftPanel({ speakText, voice }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Problem Panel — takes most of the space */}
      <div
        className="panel-border-b"
        style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}
      >
        <ProblemPanel />
      </div>

      {/* Jake Panel */}
      <div className="panel-border-b" style={{ flex: '0 0 auto' }}>
        <JakePanel />
      </div>

      {/* Chat Input — pinned at bottom */}
      <div
        className="panel-border-b"
        style={{ flex: '0 0 auto', marginTop: 'auto' }}
      >
        <ChatInput speakText={speakText} voice={voice} />
      </div>
    </div>
  );
}
