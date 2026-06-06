import React, { createContext, useContext, useState, useCallback } from 'react';

const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
  const [userName, setUserName] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [interviewActive, setInterviewActive] = useState(false);
  const [jakeState, setJakeState] = useState('idle'); // 'idle' | 'speaking' | 'listening'
  const [problem, setProblem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentCode, setCurrentCode] = useState('');
  const [language, setLanguage] = useState('Python');
  const [codeOutput, setCodeOutput] = useState(null);
  const [stdinText, setStdinText] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [review, setReview] = useState(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [screenShareCount, setScreenShareCount] = useState(0);

  const addMessage = useCallback((messageObject) => {
    setMessages((prev) => [...prev, messageObject]);
  }, []);

  const incrementScreenShare = useCallback(() => {
    setScreenShareCount((prev) => prev + 1);
  }, []);

  const value = {
    userName,
    setUserName,
    sessionId,
    setSessionId,
    interviewActive,
    setInterviewActive,
    jakeState,
    setJakeState,
    problem,
    setProblem,
    messages,
    addMessage,
    currentCode,
    setCurrentCode,
    language,
    setLanguage,
    codeOutput,
    setCodeOutput,
    stdinText,
    setStdinText,
    subtitleText,
    setSubtitleText,
    review,
    setReview,
    tabSwitchCount,
    setTabSwitchCount,
    screenShareCount,
    incrementScreenShare,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}
