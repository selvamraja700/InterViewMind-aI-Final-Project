import { useState, useCallback } from 'react';
import { useInterview } from '../context/InterviewContext';
import { analyzeScreen, reportScreenShare } from '../services/api';

export default function useScreenShare() {
  const { sessionId, screenShareCount, incrementScreenShare } = useInterview();
  const [screenShareActive, setScreenShareActive] = useState(false);

  const startCapture = useCallback(async () => {
    if (screenShareActive) return null;

    if (screenShareCount >= 15) {
      alert('Screen share limit reached (15). No more captures allowed.');
      return null;
    }

    setScreenShareActive(true);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
      });

      // Create hidden video + canvas
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());

      // Convert to base64
      const base64 = canvas.toDataURL('image/png').split(',')[1];

      incrementScreenShare();
      if (sessionId) {
        reportScreenShare(sessionId, screenShareCount + 1).catch(console.error);
      }

      // Send to API
      const analysis = await analyzeScreen(sessionId, base64);
      setScreenShareActive(false);
      return analysis;
    } catch (err) {
      // User cancelled — don't increment count
      setScreenShareActive(false);
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        console.error('Screen capture error:', err);
      }
      return null;
    }
  }, [screenShareActive, screenShareCount, sessionId, incrementScreenShare]);

  return {
    screenShareActive,
    startCapture,
    screenShareCount,
  };
}
