import React, { useState } from 'react';
import { UploadCloud, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function SecureIDUpload({ onFileSelect, initialFileName = null }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (onFileSelect) {
        onFileSelect(selected);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-2" style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
      <label className="block text-sm font-semibold text-gray-800 flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
        <span>ID Document (Ghana Card / Voter ID)</span>
        <span className="text-xs text-emerald-600 font-normal flex items-center gap-1" style={{ fontSize: '0.75rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 400 }}>
          <Lock size={12} /> Encrypted Storage
        </span>
      </label>

      {/* Upload Zone - Mobile Touch & Desktop Drag/Drop */}
      <div 
        className="relative border-2 border-dashed border-gray-300 hover:border-amber-500 rounded-xl p-4 bg-gray-50/50 hover:bg-amber-50/30 transition group"
        style={{
          position: 'relative',
          border: '2px dashed var(--border, #cbd5e1)',
          borderRadius: '12px',
          padding: '1rem',
          backgroundColor: 'var(--surface-2, #f8fafc)',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer'
        }}
      >
        <input
          type="file"
          accept="image/png, image/jpeg, application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', zIndex: 10
          }}
        />

        {file || initialFileName ? (
          <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="flex items-center gap-2.5 truncate" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
              <FileText size={20} style={{ color: 'var(--brand-orange, #d97706)', flexShrink: 0 }} />
              <span className="text-xs font-medium text-gray-700 truncate" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file ? file.name : initialFileName}
              </span>
            </div>
            <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="p-2.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 group-hover:scale-105 transition" style={{ padding: '0.6rem', backgroundColor: '#fef3c7', borderRadius: '8px', color: '#b45309', flexShrink: 0 }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700" style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                <span className="text-amber-600 font-semibold" style={{ color: 'var(--brand-orange, #d97706)', fontWeight: 600 }}>Click to upload</span> or drag and drop
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', margin: '2px 0 0 0' }}>
                PNG, JPG, or PDF (Max 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.73rem', color: 'var(--text-muted, #64748b)', paddingTop: '0.25rem' }}>
        <ShieldCheck size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
        <span>Verification scans are strictly confidential and used for identity validation only.</span>
      </div>
    </div>
  );
}
