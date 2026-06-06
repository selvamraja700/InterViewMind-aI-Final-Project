/**
 * InterviewMind AI — API Service Layer
 *
 * Calls the real FastAPI backend.
 */

const BACKEND_URL = 'http://localhost:8000';

/* ── API Functions ───────────────────────── */

/**
 * Wake the backend (Render cold-start).
 */
export async function pingBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (err) {
    return { status: 'offline' };
  }
}

/**
 * Create a new interview session.
 * @param {string} problemText - The pasted problem statement
 * @param {string|null} userName - Optional user name
 * @returns {Promise<{sessionId: string, problem: Object}>} sessionInfo
 */
export async function createSession(problemText, userName) {
  const response = await fetch(`${BACKEND_URL}/interview/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      problem_text: problemText,
      user_name: userName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    sessionId: data.session_id,
    problem: data.problem,
  };
}

/**
 * Connect to SSE preparation event stream.
 * @param {string} sessionId
 * @param {{ onEvent: (name: string) => void, onReady: () => void }} handlers
 */
export async function prepareInterview(sessionId, handlers) {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`${BACKEND_URL}/interview/prepare/${sessionId}`);

    eventSource.addEventListener('problem_loaded', () => {
      handlers.onEvent('problem_loaded');
    });
    eventSource.addEventListener('constraints_analyzed', () => {
      handlers.onEvent('constraints_analyzed');
    });
    eventSource.addEventListener('brute_force_mapped', () => {
      handlers.onEvent('brute_force_mapped');
    });
    eventSource.addEventListener('hints_prepared', () => {
      handlers.onEvent('hints_prepared');
    });
    eventSource.addEventListener('evaluation_ready', () => {
      handlers.onEvent('evaluation_ready');
    });

    eventSource.addEventListener('ready', () => {
      eventSource.close();
      handlers.onReady();
      resolve();
    });

    eventSource.onerror = (err) => {
      console.warn("EventSource preparation stream disconnected/finished.");
      eventSource.close();
      // Fallback: trigger ready so user is never stuck in loading loop
      handlers.onReady();
      resolve();
    };
  });
}

/**
 * Send a chat message to the AI interviewer.
 * @param {string} sessionId
 * @param {string} message
 * @param {string} currentCode
 * @returns {Promise<string>} AI response text
 */
export async function sendMessageToAI(sessionId, message, currentCode) {
  const response = await fetch(`${BACKEND_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      user_message: message,
      current_code: currentCode || '',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to chat: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Submit code for execution.
 * @param {string} code
 * @param {string} language
 * @param {string} stdin
 * @returns {Promise<{stdout: string, stderr: string, exit_code: number, time_ms: number}>}
 */
export async function submitCode(code, language, stdin) {
  const response = await fetch(`${BACKEND_URL}/code/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      language,
      stdin: stdin || '',
    }),
  });

  if (!response.ok) {
    throw new Error(`Code execution failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * End the interview and receive a scored review.
 * @param {string} sessionId
 * @returns {Promise<Object>} review object
 */
export async function endInterview(sessionId) {
  const response = await fetch(`${BACKEND_URL}/interview/end/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate review: ${response.statusText}`);
  }

  const data = await response.json();
  const rev = data.review;

  return {
    overall_score: rev.overall_score,
    problem_solving: rev.category_scores.problem_solving,
    communication: rev.category_scores.communication,
    code_quality: rev.category_scores.code_quality,
    optimization: rev.category_scores.optimization,
    edge_cases: rev.category_scores.edge_cases,
    strongest: rev.strongest,
    weakest: rev.weakest,
    detailed_feedback: rev.feedback,
  };
}

/**
 * Analyze a screen capture.
 * @param {string} sessionId
 * @param {string} base64Image
 * @returns {Promise<string>} analysis text
 */
export async function analyzeScreen(sessionId, base64Image) {
  const response = await fetch(`${BACKEND_URL}/ai/analyze-screen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      image_base64: base64Image,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to analyze screen capture: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Report a tab switch to log cheating events.
 * @param {string} sessionId
 * @param {number} count
 * @param {boolean} cheatingDetected
 */
export async function reportTabSwitch(sessionId, count, cheatingDetected) {
  const response = await fetch(`${BACKEND_URL}/interview/tab-switch/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      count,
      cheating_detected: cheatingDetected,
    }),
  });

  if (!response.ok) {
    console.error('Failed to log tab switch on backend');
  }
}

/**
 * Report screen share capture event.
 * @param {string} sessionId
 * @param {number} count
 */
export async function reportScreenShare(sessionId, count) {
  const response = await fetch(`${BACKEND_URL}/interview/screen-share/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      count,
    }),
  });

  if (!response.ok) {
    console.error('Failed to log screen share increment on backend');
  }
}
