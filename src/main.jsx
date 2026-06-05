import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Suppress cross-origin script errors that cannot be debugged
window.addEventListener('error', (event) => {
  if (!event.filename || event.message === 'Script error.') {
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  // Suppress unhandled rejections from auth checks when not logged in
  if (reason && (reason.status === 401 || reason.message === 'Not authenticated')) {
    event.preventDefault();
    return;
  }
  // Suppress network/fetch errors from Supabase or cross-origin issues
  if (reason instanceof TypeError && (
    reason.message?.includes('Failed to fetch') ||
    reason.message?.includes('NetworkError') ||
    reason.message?.includes('Load failed')
  )) {
    event.preventDefault();
    return;
  }
  // Suppress generic cross-origin errors that appear as empty reasons
  if (!reason || (typeof reason === 'object' && !reason.message && !reason.stack)) {
    event.preventDefault();
    return;
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
