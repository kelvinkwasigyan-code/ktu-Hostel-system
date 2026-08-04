// src/components/InstallPWA.jsx
import React, { useState, useEffect } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile automatically
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show your custom install UI
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the native browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the prompt variable since it can only be used once
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="pwa-install-banner shadow-lg glass-card"
      style={{
        position: 'fixed',
        bottom: '80px', // high enough to clear BottomNav on mobile
        left: '1rem',
        right: '1rem',
        zIndex: 9999,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '400px',
        margin: '0 auto',
        // on desktop, bottom-right instead of center
        ...(window.innerWidth > 768 && {
          left: 'auto',
          bottom: '1.5rem',
          right: '1.5rem'
        })
      }}
    >
      <div className="d-flex align-items-center gap-3">
        <div 
          style={{
            background: 'var(--brand-orange)',
            color: '#fff',
            fontWeight: 'bold',
            padding: '8px 10px',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}
        >
          KTU
        </div>
        <div>
          <h6 className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Install KTU Housing</h6>
          <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Add to home screen for faster access</p>
        </div>
      </div>
      
      <div className="d-flex align-items-center gap-2">
        <button
          onClick={() => setShowBanner(false)}
          className="btn btn-sm"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', color: 'var(--text-muted)' }}
        >
          Later
        </button>
        <button
          onClick={handleInstallClick}
          className="btn btn-primary btn-sm"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', fontWeight: 600, border: 'none', background: 'var(--brand-orange)' }}
        >
          Install
        </button>
      </div>
    </div>
  );
}
