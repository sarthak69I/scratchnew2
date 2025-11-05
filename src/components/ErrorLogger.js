'use client';

import { useEffect } from 'react';

export default function ErrorLogger() {
  useEffect(() => {
    // Catch global errors
    window.onerror = function (message, source, lineno, colno, error) {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'onerror',
          message,
          source,
          lineno,
          colno,
          stack: error?.stack,
        }),
      });
    };

    // Catch unhandled promise rejections
    window.onunhandledrejection = function (event) {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'unhandledrejection',
          reason: event.reason?.message || event.reason,
          stack: event.reason?.stack,
        }),
      });
    };
  }, []);

  return null; // Renders nothing
}
