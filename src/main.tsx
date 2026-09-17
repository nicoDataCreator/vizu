// Ensure window.fetch is configurable or proxied before external scripts run
try {
  const originalFetch = window.fetch.bind(window);
  let currentFetch = originalFetch;
  try {
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get() {
        return currentFetch;
      },
      set(fn) {
        currentFetch = fn;
      },
    });
  } catch {
    // If browser strictly locks defineProperty, keep original
  }
} catch {
  // Ignored in non-browser environment
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
