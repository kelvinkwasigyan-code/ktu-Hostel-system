import React, { useState } from 'react';
import { UploadCloud, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

const ID_OPTIONS = [
  { id: 'ghana_card', label: 'Ghana Card' },
  { id: 'voters_id', label: "Voter's ID" },
  { id: 'drivers_license', label: "Driver's License" },
  { id: 'ssnit_id', label: 'SSNIT ID' }
];

export default function SecureIDUpload({ onFileSelect, initialFileName = null }) {
  const [file, setFile] = useState(null);
  const [idType, setIdType] = useState('ghana_card');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (onFileSelect) {
        onFileSelect(selected, idType);
      }
    }
  };

  const handleTypeChange = (newType) => {
    setIdType(newType);
    if (file && onFileSelect) {
      onFileSelect(file, newType);
    }
  };

  const currentLabel = ID_OPTIONS.find(o => o.id === idType)?.label || 'ID Document';

  return (
    <div className="w-full space-y-2" style={{ width: '100%', margin: '0 auto' }}>
      {/* Label & Security Badge */}
      <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <label className="text-xs font-semibold text-gray-800" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
          Select Document Type
        </label>
        <span className="text-xs text-emerald-600 font-normal flex items-center gap-1" style={{ fontSize: '0.73rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 500 }}>
          <Lock size={11} /> Encrypted Storage
        </span>
      </div>

      {/* Clean Segmented Tab Control (No Emojis) */}
      <div 
        className="d-flex p-1 mb-2.5 rounded-2"
        style={{
          display: 'flex',
          padding: '3px',
          backgroundColor: '#f1f5f9',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          gap: '2px',
          marginBottom: '0.6rem'
        }}
      >
        {ID_OPTIONS.map(opt => {
          const isSelected = idType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleTypeChange(opt.id)}
              className="flex-1 py-1 px-1.5 text-center text-xs transition"
              style={{
                flex: 1,
                padding: '0.35rem 0.2rem',
                fontSize: '0.72rem',
                fontWeight: isSelected ? 600 : 500,
                color: isSelected ? '#d97706' : '#64748b',
                backgroundColor: isSelected ? '#ffffff' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Upload Zone - Drag & Drop Dropzone */}
      <div 
        className="relative border-2 border-dashed border-gray-300 hover:border-amber-500 rounded-xl p-3 bg-gray-50/50 transition"
        style={{
          position: 'relative',
          border: '2px dashed #cbd5e1',
          borderRadius: '10px',
          padding: '0.75rem',
          backgroundColor: '#f8fafc',
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
            <div className="flex items-center gap-2 truncate" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              <FileText size={18} style={{ color: 'var(--brand-orange, #d97706)', flexShrink: 0 }} />
              <div style={{ overflow: 'hidden' }}>
                <span className="text-xs font-semibold text-gray-800 block truncate" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : initialFileName}
                </span>
                <span className="text-[10px] text-gray-500" style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Selected: {currentLabel}
                </span>
              </div>
            </div>
            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-left" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0" style={{ padding: '0.45rem', backgroundColor: '#fef3c7', borderRadius: '6px', color: '#b45309', flexShrink: 0 }}>
              <UploadCloud size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700 mb-0" style={{ fontSize: '0.78rem', fontWeight: 500, color: '#1e293b', margin: 0 }}>
                <span style={{ color: 'var(--brand-orange, #d97706)', fontWeight: 600 }}>Click to upload</span> scan of {currentLabel}
              </p>
              <p className="text-[10px] text-gray-400 mb-0" style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                PNG, JPG, or PDF (Max 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-[11px] text-gray-500 pt-1" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#64748b', paddingTop: '0.2rem' }}>
        <ShieldCheck size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
        <span>Scans are strictly confidential for official KTU landlord verification.</span>
      </div>
    </div>
  );
}
