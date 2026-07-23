import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
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

  return (
    <button
      type="button"
      onClick={() => setDarkMode(!darkMode)}
      className="btn btn-sm d-flex align-items-center justify-content-center rounded-circle border-custom"
      style={{
        width: '36px',
        height: '36px',
        background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(10, 34, 64, 0.05)',
        color: darkMode ? '#fcd34d' : 'var(--logo-navy)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      aria-label="Toggle Theme"
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {darkMode ? <Sun size={18} className="text-warning" /> : <Moon size={18} />}
    </button>
  );
}
