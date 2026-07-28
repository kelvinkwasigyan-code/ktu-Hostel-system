import { useState } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import api from '../services/api';

export default function SubmitPayment({ hostelId, landlordId, amount, studentId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a receipt image');

    setLoading(true);
    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('hostelId', hostelId);
    formData.append('landlordId', landlordId);
    formData.append('amount', amount);
    if (studentId) formData.append('studentId', studentId);

    try {
      // Note: We don't explicitly set Content-Type, Axios will handle the multipart/form-data boundary automatically
      const res = await api.post('/payments/upload-receipt', formData);

      if (res.data.success) {
        toast.success('Payment proof uploaded successfully!');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
      <div>
        <label className="form-label text-muted-custom" style={{ fontWeight: 600 }}>Payment Receipt (Image/PDF)</label>
        <input 
          type="file" 
          accept="image/*,.pdf" 
          className="form-control"
          onChange={(e) => setFile(e.target.files[0])} 
        />
        <small className="text-muted mt-1 d-block" style={{ fontSize: '0.8rem' }}>
          Upload a clear image or PDF of your payment transaction.
        </small>
      </div>
      <button type="submit" className="btn btn-primary w-100" disabled={loading}>
        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <Upload size={16} className="me-2" />}
        {loading ? 'Uploading Evidence...' : 'Submit Evidence'}
      </button>
    </form>
  );
}
