import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useInterview } from '../../context/InterviewContext';
import { endInterview, reportTabSwitch } from '../../services/api';
import useTabGuard from '../../hooks/useTabGuard';

export default function TabGuard() {
  const { interviewActive, sessionId, setReview } = useInterview();
  const switchCount = useTabGuard();
  const [bannerState, setBannerState] = useState(null); // { text, colorClass }
  const [showBanner, setShowBanner] = useState(false);
  const bannerTimerRef = useRef(null);

  useEffect(() => {
    if (!interviewActive || switchCount === 0) return;

    // Report switch count to backend
    if (sessionId) {
      reportTabSwitch(sessionId, switchCount, switchCount >= 3).catch(console.error);
    }

    // Clear previous banner timer
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }

    if (switchCount === 1) {
      setBannerState({
        text: 'Tab switch detected. Warning 1 of 3.',
        colorClass: 'warning-yellow',
      });
      setShowBanner(true);

      bannerTimerRef.current = setTimeout(() => setShowBanner(false), 4000);
    } else if (switchCount === 2) {
      setBannerState({
        text: 'Second tab switch detected. Warning 2 of 3.',
        colorClass: 'warning-orange',
      });
      setShowBanner(true);

      bannerTimerRef.current = setTimeout(() => setShowBanner(false), 4000);
    } else if (switchCount >= 3) {
      setBannerState({
        text: 'Interview ended due to tab switching.',
        colorClass: 'warning-red',
      });
      setShowBanner(true);

      // End interview
      endInterview(sessionId).then((reviewData) => {
        setReview(reviewData);
      });
    }

    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, [switchCount, interviewActive, sessionId, setReview]);

  if (!showBanner || !bannerState) return null;

  return ReactDOM.createPortal(
    <div className={`tab-warning-banner ${bannerState.colorClass}`}>
      {bannerState.text}
    </div>,
    document.body
  );
}
