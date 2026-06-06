import { useState, useRef, useEffect, useCallback } from 'react';
import { useInterview } from '../context/InterviewContext';

export default function useVoice() {
  const { setJakeState, setSubtitleText } = useInterview();

  const [voiceState, setVoiceState] = useState('off'); // 'off' | 'listening' | 'speaking'
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscriptEvent, setFinalTranscriptEvent] = useState(null);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const silenceTimerRef = useRef(null);
  const onTranscriptRef = useRef(null);
  const isMountedRef = useRef(true);

  // Check browser support
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  // Initialize recognition once
  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (finalText) {
        finalTranscriptRef.current += finalText;
      }

      setLiveTranscript(finalTranscriptRef.current + interim);

      // Reset silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      silenceTimerRef.current = setTimeout(() => {
        if (finalTranscriptRef.current.trim()) {
          const text = finalTranscriptRef.current.trim();
          if (onTranscriptRef.current) {
            onTranscriptRef.current(text);
          }
          setFinalTranscriptEvent({ text, id: Date.now() });
          finalTranscriptRef.current = '';
          setLiveTranscript('');
        }
      }, 1500);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceState('off');
      }
      // 'no-speech' and 'aborted' are non-fatal
    };

    recognition.onend = () => {
      // Auto-restart if we should still be listening
      if (isMountedRef.current && voiceState === 'listening') {
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isMountedRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep recognition's onend in sync with voiceState
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        if (isMountedRef.current && voiceState === 'listening') {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Already started
          }
        }
      };
    }
  }, [voiceState]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    finalTranscriptRef.current = '';
    setLiveTranscript('');
    setVoiceState('listening');

    try {
      recognitionRef.current.start();
    } catch (e) {
      // May already be started
    }
  }, []);

  const stopListening = useCallback(() => {
    setVoiceState('off');
    setLiveTranscript('');

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }

    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
  }, []);

  const speakText = useCallback(
    (text, onTranscript) => {
      if (!text || typeof window === 'undefined') return;

      onTranscriptRef.current = onTranscript || null;

      // Stop recognition while speaking
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setVoiceState('speaking');
        setJakeState('speaking');
        setSubtitleText(text);
      };

      utterance.onend = () => {
        setVoiceState('listening');
        setJakeState('listening');

        // Restart recognition
        finalTranscriptRef.current = '';
        setLiveTranscript('');
        try {
          recognitionRef.current?.start();
        } catch (e) {
          // ignore
        }
      };

      utterance.onerror = () => {
        setVoiceState('listening');
        setJakeState('listening');
        try {
          recognitionRef.current?.start();
        } catch (e) {
          // ignore
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [setJakeState, setSubtitleText]
  );

  return {
    voiceState,
    liveTranscript,
    finalTranscriptEvent,
    speakText,
    startListening,
    stopListening,
  };
}
