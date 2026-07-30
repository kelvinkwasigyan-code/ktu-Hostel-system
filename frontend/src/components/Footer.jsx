// src/components/Footer.jsx
import { Link } from 'react-router-dom';
import { Phone, Mail, ShieldCheck } from 'lucide-react';

const WhatsAppIcon = ({ size = 15, className = "" }) => (
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

export default function Footer() {
  return (
    <footer
      className="footer pt-5 pb-5"
      style={{
        background: 'linear-gradient(135deg, #091326 0%, #0f2b5c 50%, #08152e 100%)',
        color: '#ffffff',
        borderTop: '2px solid #2563eb',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 -10px 30px rgba(15, 43, 92, 0.25)'
      }}
    >
      <div className="container">
        <div className="row g-4 mb-4">
          
          {/* Brand Column */}
          <div className="col-12 col-lg-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <img
                src="/logo.jpg"
                alt="Student Hostel Portal Logo"
                style={{ height: '48px', width: 'auto', borderRadius: '6px', objectFit: 'contain' }}
              />
              <span className="fw-bold font-outfit fs-5 text-white">
                KTU <span style={{ color: '#f59e0b' }}>Housing Portal</span>
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.7 }}>
              Ghana's trusted student accommodation platform for Koforidua Technical University. Find verified, safe, and affordable off-campus hostels near KTU.
            </p>
            <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
              <span className="badge bg-success bg-opacity-25 text-success border border-success-subtle px-2.5 py-1.5 rounded-pill small">
                ● Systems Operational
              </span>
              <span className="badge bg-primary bg-opacity-25 text-info border border-info-subtle px-2.5 py-1.5 rounded-pill small">
                <ShieldCheck size={13} className="me-1" /> 100% Verified
              </span>
            </div>
          </div>

          {/* Students Column (Hidden on mobile) */}
          <div className="d-none d-md-block col-md-2">
            <h5 style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700, marginBottom: '1rem' }}>Students</h5>
            <Link to="/search" className="footer-link">Browse Listings</Link>
            <Link to="/map" className="footer-link">Interactive Map</Link>
            <Link to="/faq" className="footer-link">Help & FAQs</Link>
            <Link to="/contact" className="footer-link">Contact Support</Link>
          </div>

          {/* Landlords Column (Hidden on mobile) */}
          <div className="d-none d-md-block col-md-2">
            <h5 style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700, marginBottom: '1rem' }}>Landlords</h5>
            <Link to="/register" className="footer-link">List Your Property</Link>
            <Link to="/landlord" className="footer-link">Landlord Dashboard</Link>
            <Link to="/landlord/requests" className="footer-link">Booking Requests</Link>
          </div>

          {/* Campus Contact & Location */}
          <div className="col-12 col-md-4">
            <h5 style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700, marginBottom: '1rem' }}>Campus Contact & Location</h5>
            <p style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              📍 <strong style={{ color: '#ffffff' }}>Location:</strong> KTU Campus Area, Adweso / Nsukwao, Koforidua, Ghana.
            </p>
            <div className="d-flex flex-column gap-2" style={{ fontSize: '0.85rem' }}>
              <div className="d-flex align-items-center gap-2">
                <Phone size={15} style={{ color: '#38bdf8' }} />
                <span style={{ color: '#ffffff' }}>Call Support: <strong style={{ color: '#ffffff' }}>+233 599738961</strong></span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <WhatsAppIcon size={15} />
                <a
                  href="https://wa.me/233599738961?text=Hello%20KTU%20Housing%20Support,%20I%20need%20assistance."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 700 }}
                >
                  WhatsApp: +233 599738961 (Chat Live)
                </a>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Mail size={15} style={{ color: '#4ade80' }} />
                <span style={{ color: '#ffffff' }}>Email: support@ktuhostelportal.edu.gh</span>
              </div>
            </div>
          </div>

        </div>

        <hr style={{ borderColor: 'rgba(255, 255, 255, 0.15)', margin: '1.5rem 0' }} />

        {/* Bottom Bar */}
        <div className="d-flex justify-content-center justify-content-md-start align-items-center">
          <p className="mb-0 font-outfit fw-semibold text-center text-md-start" style={{ fontSize: '0.84rem', color: '#ffffff' }}>
            © {new Date().getFullYear()} KTU Hostel Portal. Built for Koforidua Technical University, Ghana.
          </p>
        </div>
      </div>
    </footer>
  );
}
