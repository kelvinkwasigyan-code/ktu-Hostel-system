import React, { useState } from 'react';
import api from '../services/api';

export default function OtpVerification({ phoneNumber, landlordId, onVerified }) {
  const [otpInput, setOtpInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const res = await api.post('/send-otp', { phoneNumber });
      if (res.data.success) {
        setGeneratedCode(res.data.debugCode); // Save preview code
        setStatus('Code sent! Check below.');
      }
    } catch (err) {
      setStatus('❌ Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await api.post('/verify-otp', { phoneNumber, otpCode: otpInput, landlordId });
      if (res.data.success) {
        setStatus('✅ Phone number successfully verified!');
        if (onVerified) onVerified();
      } else {
        setStatus(`❌ ${res.data.message}`);
      }
    } catch (err) {
      setStatus(`❌ ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-custom rounded-custom shadow-sm bg-surface-2 mt-4">
      <h5 className="fw-bold mb-2">Verify Phone Number</h5>
      <p className="text-muted-custom mb-4 small">Phone: {phoneNumber}</p>

      <button 
        type="button"
        onClick={handleSendOtp}
        className="btn btn-primary mb-4"
        disabled={loading}
      >
        Send OTP Code
      </button>

      {/* TESTING PREVIEW BANNER */}
      {generatedCode && (
        <div className="alert alert-warning p-3 mb-4 text-dark" style={{ fontSize: '0.85rem' }}>
          <p className="fw-bold mb-1">🧪 Preview Mode Active</p>
          <p className="mb-1">Your generated OTP is: <span className="font-monospace fw-bold fs-6">{generatedCode}</span></p>
          <p className="text-muted mb-0">(You can also use master code <code className="bg-white px-1 fw-bold rounded">123456</code>)</p>
        </div>
      )}

      <div className="d-flex gap-2">
        <input 
          type="text" 
          placeholder="Enter 6-digit code"
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value)}
          className="form-control text-center font-monospace"
          style={{ letterSpacing: '0.2em', maxWidth: '200px' }}
          maxLength={6}
        />
        <button 
          type="button"
          onClick={handleVerifyOtp}
          className="btn btn-success"
          disabled={loading || otpInput.length < 6}
        >
          Verify
        </button>
      </div>

      {status && <p className="mt-3 mb-0 small fw-medium">{status}</p>}
    </div>
  );
}
