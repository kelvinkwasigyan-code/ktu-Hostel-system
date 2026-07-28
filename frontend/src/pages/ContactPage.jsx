// src/pages/ContactPage.jsx
import { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/support', {
        topic: form.subject,
        message: form.message,
        name: form.name,
        email: form.email
      });
      toast.success('Your message has been sent successfully! Our team will contact you shortly.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5" style={{ minHeight: 'calc(100vh - 280px)' }}>
        
        {/* Header */}
        <div className="text-center mb-5">
          <span style={{
            background: 'rgba(255,107,53,0.12)',
            color: 'var(--brand-orange)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid rgba(255,107,53,0.2)'
          }}>
            📬 Get in Touch
          </span>
          <h2 className="mt-3 section-title text-center">Contact Student Support</h2>
          <div className="section-divider mx-auto"></div>
          <p className="text-muted-custom mx-auto mb-0" style={{ maxWidth: '500px' }}>
            Need assistance with your booking? Found a fake listing? Contact us and we will resolve it.
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {/* Support Information */}
          <div className="col-md-5 col-lg-4">
            <div className="card p-4 h-100 border-custom bg-surface rounded-custom d-flex flex-column gap-4">
              <h5 className="mb-0" style={{ fontFamily: 'Outfit,sans-serif' }}>Support Center</h5>
              
              <div className="d-flex gap-3 align-items-start">
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(255,107,53,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--brand-orange)', flexShrink: 0
                }}>
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Email Support</div>
                  <small className="text-muted-custom">support@hostelportal.edu.gh</small>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-start">
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(46,204,113,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--success)', flexShrink: 0
                }}>
                  <Phone size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Phone Helpdesk</div>
                  <small className="text-muted-custom">+233 (0) 24 100 0000</small>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-start">
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(245,166,35,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--brand-gold)', flexShrink: 0
                }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Office Location</div>
                  <small className="text-muted-custom">KTU Student Affairs Block, Room 12, Koforidua, Ghana</small>
                </div>
              </div>

              <hr className="border-custom my-2" />

              <div className="p-3 bg-surface-2 rounded-custom border-custom" style={{ fontSize: '0.8rem' }}>
                <div className="d-flex gap-2 align-items-start">
                  <HelpCircle size={16} className="text-orange flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Quick Tip:</strong>
                    <div className="text-muted-custom mt-1">
                      Check our FAQ page first! Most general queries regarding booking holds and verification status are explained in detail there.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="col-md-7 col-lg-6">
            <div className="card p-4 border-custom bg-surface rounded-custom">
              <h5 className="mb-3" style={{ fontFamily: 'Outfit,sans-serif' }}>Send a Message</h5>
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label">Your Name</label>
                    <input type="text" className="form-control" required placeholder="e.g. John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control" required placeholder="name@domain.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Subject</label>
                  <select className="form-select" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                    <option value="">Choose a subject...</option>
                    <option value="Booking Help">Booking & Reservation Help</option>
                    <option value="Landlord Verification">Landlord Verification Inquiry</option>
                    <option value="Listing Issue">Report Listing / Structural issue</option>
                    <option value="Fraud Report">Report Fake / Scam Listing</option>
                    <option value="Other">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Message Details</label>
                  <textarea className="form-control" rows="5" required placeholder="Describe your issue or query in detail..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}></textarea>
                </div>

                <button type="submit" className="btn btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                  <Send size={16} /> {loading ? 'Sending Message...' : 'Send Message'}
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
