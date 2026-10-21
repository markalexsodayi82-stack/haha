import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles.css';
import App from './App.jsx';


// Remove stale AquaFlow service workers/caches left by older builds.
// They can otherwise serve an old shell after navigation and make the page appear blank.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister())).catch(() => {});
  if ('caches' in window) caches.keys().then(keys => Promise.all(keys.filter(k => k.toLowerCase().includes('aquaflow')).map(k => caches.delete(k)))).catch(() => {});
}

createRoot(document.getElementById('root')).render(<App />);
