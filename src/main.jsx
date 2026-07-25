import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';

// Styling imports
import './styles/custom.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            {/* Global alerts toaster with custom dark/light color match */}
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'glass-card border-glass text-main shadow-lg',
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  backdropFilter: 'var(--glass-blur)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                },
              }}
            />
            <App />
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
