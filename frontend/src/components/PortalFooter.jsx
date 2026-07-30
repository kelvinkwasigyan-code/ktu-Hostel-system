// src/components/PortalFooter.jsx
import React from 'react';

export function PortalFooter() {
  return (
    <footer className="py-3 mt-auto border-top text-center text-muted-custom" style={{ fontSize: '0.8rem', borderColor: 'var(--border)' }}>
      <p className="mb-0 font-outfit">© {new Date().getFullYear()} KTU Hostel System. All rights reserved.</p>
    </footer>
  );
}

export default PortalFooter;
