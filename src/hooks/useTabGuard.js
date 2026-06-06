import { useState, useEffect, useRef } from 'react';

export default function useTabGuard() {
  const [switchCount, setSwitchCount] = useState(0);
  const cooldownRef = useRef(false);

  useEffect(() => {
    function handleTabSwitch() {
      if (cooldownRef.current || window.isTabGuardSuspended) return;
      if (document.visibilityState === 'hidden') {
        cooldownRef.current = true;
        setSwitchCount((prev) => prev + 1);
        setTimeout(() => {
          cooldownRef.current = false;
        }, 1000);
      }
    }

    function handleFocus() {
      // Resume tab guard shortly after returning to the window
      if (window.isTabGuardSuspended) {
        setTimeout(() => {
          window.isTabGuardSuspended = false;
        }, 1500); // 1.5s delay to ensure active tool dialogue is completely closed
      }
    }

    document.addEventListener('visibilitychange', handleTabSwitch);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleTabSwitch);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return switchCount;
}
