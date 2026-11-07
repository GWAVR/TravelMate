import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';

class TestBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('❌ APP RENDER ERROR:', error);
    console.error('Component stack:', info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 30, fontFamily: 'Arial' }}>
          <h1 style={{ color: 'red' }}>App Render Failed</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error.message}
          </pre>
          <p>Check the browser Console for the full error.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML =
    '<h1 style="color:red;padding:30px">❌ #root element not found</h1>';
} else {
  createRoot(rootElement).render(
    <React.StrictMode>
      <TestBoundary>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </TestBoundary>
    </React.StrictMode>
  );
}
