import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HelpCircle, Send, CheckCircle2 } from 'lucide-react';

export default function SupportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    topic: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const topics = [
    'Account Verification',
    'Booking Issue',
    'Listing Approval',
    'Technical Problem',
    'Report a User',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.topic) return toast.error('Please select a topic.');
    
    setLoading(true);
    try {
      await api.post('/support', form);
      setSubmitted(true);
      toast.success('Support request sent to admin.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="container py-5 d-flex justify-content-center">
          <div className="card p-5 text-center shadow-sm" style={{ maxWidth: '500px', width: '100%' }}>
            <CheckCircle2 size={64} className="text-success mx-auto mb-3" />
            <h3 className="mb-3">Message Sent!</h3>
            <p className="text-muted-custom mb-4">
              Your support request has been successfully delivered to the Admin. Our support team is available 24/7 and will review your request shortly. You will be notified of any updates.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Return Home
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card p-4 shadow-sm">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div style={{ background: 'rgba(0,139,206,0.1)', padding: '12px', borderRadius: '12px' }}>
                  <HelpCircle size={32} className="text-primary" />
                </div>
                <div>
                  <h2 className="h4 mb-1">24/7 Support Portal</h2>
                  <p className="text-muted-custom mb-0">Contact the admin directly for help</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: 600 }}>What do you need help with?</label>
                  <select 
                    className="form-select bg-surface text-primary" 
                    value={form.topic}
                    onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Select a topic...</option>
                    {topics.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: 600 }}>Please describe your issue</label>
                  <textarea 
                    className="form-control bg-surface text-primary"
                    rows="5"
                    placeholder="Provide as much detail as possible so we can help you quickly..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" />
                  ) : (
                    <Send size={18} className="me-2" />
                  )}
                  {loading ? 'Sending Request...' : 'Send to Admin'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
