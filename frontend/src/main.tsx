import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Dynamic import based on build mode
const appName = (import.meta as any).env.MODE || 'operator';

const loadApp = async () => {
  let App: React.ComponentType;

  switch (appName) {
    case 'operator':
      const operatorModule = await import('./apps/operator/App');
      App = operatorModule.default;
      break;
    case 'audience':
      const audienceModule = await import('./apps/audience/App');
      App = audienceModule.default;
      break;
    case 'jury':
      const juryModule = await import('./apps/jury/App');
      App = juryModule.default;
      break;
    default:
      const defaultModule = await import('./apps/operator/App');
      App = defaultModule.default;
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

loadApp();
