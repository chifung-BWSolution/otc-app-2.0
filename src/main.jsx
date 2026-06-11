import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Suppress cross-origin script errors that cannot be debugged
window.addEventListener('error', (event) => {
  if (!event.filename || event.message === 'Script error.' || event.lineno === 0) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }
}, true);

// Also capture in bubble phase
window.addEventListener('error', (event) => {
  if (!event.filename || event.message === 'Script error.' || event.lineno === 0) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  // Suppress unhandled rejections from auth checks when not logged in
  if (reason && (reason.status === 401 || reason.status === 403 || reason.message === 'Not authenticated')) {
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
  // Suppress Supabase not initialized errors
  if (reason && typeof reason === 'object' && reason.message?.includes('Supabase not initialized')) {
    event.preventDefault();
    return;
  }
  // Suppress Supabase edge function errors
  if (reason && typeof reason === 'object' && (
    reason.message?.includes('FunctionsHttpError') ||
    reason.message?.includes('FunctionsRelayError') ||
    reason.message?.includes('FunctionsFetchError') ||
    reason.name === 'FunctionsHttpError' ||
    reason.name === 'FunctionsRelayError' ||
    reason.name === 'FunctionsFetchError'
  )) {
    event.preventDefault();
    return;
  }
  // Suppress generic cross-origin errors that appear as empty reasons
  if (!reason || (typeof reason === 'object' && !reason.message && !reason.stack)) {
    event.preventDefault();
    return;
  }
  // Suppress any remaining string-type rejections
  if (typeof reason === 'string' && (reason.includes('Script error') || reason === '')) {
    event.preventDefault();
    return;
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
