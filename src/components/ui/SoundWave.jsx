import React from 'react';

export default function SoundWave({ isActive }) {
  return (
    <div className="sound-wave" aria-hidden="true">
      <div className={`sound-wave-bar ${isActive ? '' : 'paused'}`} />
      <div className={`sound-wave-bar ${isActive ? '' : 'paused'}`} />
      <div className={`sound-wave-bar ${isActive ? '' : 'paused'}`} />
      <div className={`sound-wave-bar ${isActive ? '' : 'paused'}`} />
    </div>
  );
}
