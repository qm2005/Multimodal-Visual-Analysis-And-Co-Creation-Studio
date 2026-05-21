import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './context/LanguageContext.tsx';

// Clean up/suppress expected benign Vite/WebSocket HMR errors when HMR is disabled by the platform
if (typeof window !== "undefined") {
  const ignorePatterns = ["websocket", "WebSocket", "vite", "[vite]"];
  
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (!reason) return;
    
    const errMsg = (reason.message || String(reason) || "").toLowerCase();
    const shouldIgnore = ignorePatterns.some(pattern => errMsg.includes(pattern));
    
    if (shouldIgnore) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener("error", (event) => {
    const errMsg = (event.message || "").toLowerCase();
    const shouldIgnore = ignorePatterns.some(pattern => errMsg.includes(pattern));
    
    if (shouldIgnore) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
