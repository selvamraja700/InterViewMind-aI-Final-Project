import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { InterviewProvider } from './context/InterviewContext';
import NameScreen from './pages/NameScreen';
import ProblemLoadScreen from './pages/ProblemLoadScreen';
import InterviewPage from './pages/InterviewPage';

export default function App() {
  return (
    <BrowserRouter>
      <InterviewProvider>
        <Routes>
          <Route path="/" element={<NameScreen />} />
          <Route path="/problem" element={<ProblemLoadScreen />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InterviewProvider>
    </BrowserRouter>
  );
}
