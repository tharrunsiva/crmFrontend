import React from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-link nav-link text-decoration-none border-0 p-2 shadow-none"
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}
    >
      {theme === 'light' ? (
        <i className="bi bi-moon-fill" style={{ color: '#4F46E5' }}></i>
      ) : (
        <i className="bi bi-sun-fill" style={{ color: '#F59E0B' }}></i>
      )}
    </button>
  );
};

export default ThemeToggle;
