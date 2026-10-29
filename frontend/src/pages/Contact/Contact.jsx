import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendMessage } from '../../firebase/contact.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { PET_TYPES, CONTACT_LIMITS, EMAIL_PATTERN } from '../../firebase/config.js';
import Honeypot, { caughtBot } from '../../components/Honeypot/Honeypot.jsx';
import styles from './Contact.module.css';

const INITIAL = { name: '', email: '', phone: '', petName: '', petType: '', serviceInterest: '', message: '' };

export default function Contact() {
  const { addToast } = useToast();
  const { copy } = useContent();
  const { services } = useData();
  const t = copy('contactPage');
  const info = copy('contact');
  const [form, setForm] = useState(INITIAL);
  const [sending, setSending] = useState(false);
  const trap = useRef(null);

  // The "service interested in" options come from the real services list, so the
  // dropdown never drifts from what's actually offered.
  const serviceNames = services.map((s) => s.name).filter(Boolean);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      addToast('Please fill in your name, email and message.', 'warning');
      return;
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      addToast('Please check your email address.', 'warning');
      return;
    }
    setSending(true);
    try {
      if (!caughtBot(trap)) await sendMessage(form);
      addToast("Message sent! I'll be in touch soon 🐾", 'success');
      setForm(INITIAL);
    } catch {
      addToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const serviceOptions = serviceNames.length ? serviceNames : ['Dog Walking', 'Pet Sitting', 'Overnight Stay', 'Grooming', 'Other'];

  return (
    <div>
      <header className={`page-header ${styles.pageHeader}`}>
        <div className="container">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroSubtitle}</p>
        </div>
      </header>

      <section className="section">
        <div className={`container ${styles.layout}`}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <h2>{t.formTitle}</h2>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Your Name *</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" autoComplete="name" maxLength={CONTACT_LIMITS.name} required />
              </div>
              <div className={styles.field}>
                <label>Email Address *</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" autoComplete="email" maxLength={CONTACT_LIMITS.email} required />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Phone Number</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+27 82 000 0000" autoComplete="tel" maxLength={CONTACT_LIMITS.phone} />
              </div>
              <div className={styles.field}>
                <label>Service Interested In</label>
                <select value={form.serviceInterest} onChange={set('serviceInterest')}>
                  <option value="">Select a service…</option>
                  {serviceOptions.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Pet's Name</label>
                <input type="text" value={form.petName} onChange={set('petName')} placeholder="Buddy" maxLength={CONTACT_LIMITS.petName} />
              </div>
              <div className={styles.field}>
                <label>Pet Type</label>
                <select value={form.petType} onChange={set('petType')}>
                  <option value="">Select…</option>
                  {PET_TYPES.map((t2) => <option key={t2}>{t2}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label>Message *</label>
              <textarea value={form.message} onChange={set('message')} rows={5} placeholder="Tell me about your pet and what you need…" maxLength={CONTACT_LIMITS.message} required />
            </div>

            <Honeypot ref={trap} />

            <p className={styles.privacy}>
              I use these details only to reply to you and arrange care for your pet. Messages are deleted after 12 months. See the <Link to="/privacy">privacy policy</Link>.
            </p>

            <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
              {sending ? 'Sending…' : t.sendBtn}
            </button>
          </form>

          <aside className={styles.info}>
            {info.location && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📍</span>
                <div><strong>Location</strong><p>{info.location}</p></div>
              </div>
            )}
            {info.phone && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📞</span>
                <div><strong>Phone</strong><p><a href={`tel:${info.phone.replace(/\s+/g, '')}`}>{info.phone}</a></p></div>
              </div>
            )}
            {info.email && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>✉️</span>
                <div><strong>Email</strong><p><a href={`mailto:${info.email}`}>{info.email}</a></p></div>
              </div>
            )}
            {info.responseTime && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>⏰</span>
                <div><strong>Response Time</strong><p>{info.responseTime}</p></div>
              </div>
            )}
            {info.petsAccepted && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🐾</span>
                <div><strong>Pets Accepted</strong><p>{info.petsAccepted}</p></div>
              </div>
            )}
            {(info.instagram || info.facebook || info.whatsapp) && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🔗</span>
                <div>
                  <strong>Find me</strong>
                  <p style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {info.instagram && <a href={info.instagram} target="_blank" rel="noreferrer" style={{ color: 'var(--coral)', fontWeight: 700 }}>Instagram</a>}
                    {info.facebook && <a href={info.facebook} target="_blank" rel="noreferrer" style={{ color: 'var(--coral)', fontWeight: 700 }}>Facebook</a>}
                    {info.whatsapp && <a href={info.whatsapp} target="_blank" rel="noreferrer" style={{ color: 'var(--coral)', fontWeight: 700 }}>WhatsApp</a>}
                  </p>
                </div>
              </div>
            )}
            <div className={styles.promise}>
              <h3>{t.promiseTitle}</h3>
              <p>{t.promiseText}</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
