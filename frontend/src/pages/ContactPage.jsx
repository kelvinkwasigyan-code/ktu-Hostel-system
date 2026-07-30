// src/pages/ContactPage.jsx
import { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import api from '../services/api';

const WhatsAppIcon = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#25D366"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.763.459 3.486 1.332 5.002l-1.417 5.176 5.301-1.39c1.46.797 3.109 1.217 4.773 1.217h.004c5.505 0 9.988-4.478 9.989-9.985 0-2.668-1.038-5.176-2.924-7.063a9.924 9.924 0 00-7.068-2.941zm5.834 14.364c-.247.696-1.434 1.33-2.005 1.415-.512.076-1.16.108-1.872-.118-.431-.137-.985-.32-1.694-.626-2.981-1.287-4.927-4.289-5.076-4.487-.148-.198-1.213-1.611-1.213-3.074 0-1.463.768-2.181 1.04-2.479.272-.298.594-.372.792-.372.198 0 .396.002.57.01.182.009.427-.069.669.51.247.595.841 2.058.916 2.207.075.149.124.323.025.521-.099.199-.149.323-.3.495-.149.174-.312.388-.446.521-.148.148-.303.309-.13.606.173.298.77 1.271 1.653 2.059 1.135 1.013 2.093 1.326 2.39 1.475.297.149.471.124.644-.074.173-.198.768-.868.941-1.165.173-.298.372-.248.669-.149.297.099 1.758.828 2.031.967.273.139.471.213.545.337.074.124.074.719-.173 1.415z"/>
  </svg>
);

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
                  <small className="text-muted-custom">+233 599738961</small>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-start">
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(37,211,102,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <WhatsAppIcon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>WhatsApp Support</div>
                  <a
                    href="https://wa.me/233599738961?text=Hello%20KTU%20Housing%20Support,%20I%20need%20assistance."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="small text-success text-decoration-none fw-semibold"
                  >
                    +233 599738961 (Click to Chat)
                  </a>
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
