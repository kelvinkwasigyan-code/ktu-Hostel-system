import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ showLabel = false, className = '' }) {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-bs-theme', 'light');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={() => setDarkMode(!darkMode)}
        className={`theme-toggle-row ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          backgroundColor: 'var(--surface-2, #f8fafc)',
          border: '1px solid var(--border, #e2e8f0)',
          color: 'var(--text-primary, #0f172a)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '0.95rem',
          fontWeight: 500
        }}
        aria-label="Toggle Theme"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {darkMode ? (
            <Sun size={19} style={{ color: '#f59e0b' }} />
          ) : (
            <Moon size={19} style={{ color: 'var(--brand-orange, #d97706)' }} />
          )}
          <span style={{ fontWeight: 600 }}>{darkMode ? 'Dark Mode (On)' : 'Dark Mode (Off)'}</span>
        </div>
        <div style={{
          width: '42px',
          height: '24px',
          borderRadius: '12px',
          backgroundColor: darkMode ? 'var(--brand-orange, #d97706)' : '#cbd5e1',
          position: 'relative',
          transition: 'background-color 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          flexShrink: 0
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            transform: darkMode ? 'translateX(18px)' : 'translateX(0px)',
            transition: 'transform 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }} />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setDarkMode(!darkMode)}
      className={`btn btn-sm d-flex align-items-center justify-content-center rounded-circle ${className}`}
      style={{
        width: '38px',
        height: '38px',
        background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(10, 34, 64, 0.05)',
        color: darkMode ? '#fcd34d' : 'var(--logo-navy, #0f172a)',
        border: '1px solid var(--border, #e2e8f0)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0
      }}
      aria-label="Toggle Theme"
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {darkMode ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} />}
    </button>
  );
}
