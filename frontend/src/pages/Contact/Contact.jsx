import { useState } from 'react';
import { sendMessage } from '../../firebase/contact.js';
import { useToast } from '../../context/ToastContext.jsx';
import { PET_TYPES } from '../../firebase/config.js';
import styles from './Contact.module.css';

const INITIAL = {
  name: '', email: '', phone: '', petName: '', petType: '', serviceInterest: '', message: '',
};

export default function Contact() {
  const { addToast } = useToast();
  const [form, setForm] = useState(INITIAL);
  const [sending, setSending] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      addToast('Please fill in your name, email and message.', 'warning');
      return;
    }
    setSending(true);
    try {
      await sendMessage(form);
      addToast("Message sent! I'll be in touch soon 🐾", 'success');
      setForm(INITIAL);
    } catch {
      addToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <section className={styles.hero}>
        <div className="container">
          <h1>Let's Chat! 💬</h1>
          <p>Fill in the form and I'll get back to you as soon as possible</p>
        </div>
      </section>

      <section className="section">
        <div className={`container ${styles.layout}`}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <h2>Send a Message</h2>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Your Name *</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" required />
              </div>
              <div className={styles.field}>
                <label>Email Address *</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" required />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Phone Number</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+27 82 000 0000" />
              </div>
              <div className={styles.field}>
                <label>Service Interested In</label>
                <select value={form.serviceInterest} onChange={set('serviceInterest')}>
                  <option value="">Select a service…</option>
                  <option>Dog Walking</option>
                  <option>Pet Sitting</option>
                  <option>Overnight Stay</option>
                  <option>Bath &amp; Groom</option>
                  <option>Vet Transport</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Pet's Name</label>
                <input type="text" value={form.petName} onChange={set('petName')} placeholder="Buddy" />
              </div>
              <div className={styles.field}>
                <label>Pet Type</label>
                <select value={form.petType} onChange={set('petType')}>
                  <option value="">Select…</option>
                  {PET_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label>Message *</label>
              <textarea
                value={form.message}
                onChange={set('message')}
                rows={5}
                placeholder="Tell me about your pet and what you need…"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
              {sending ? 'Sending…' : 'Send Message 🐾'}
            </button>
          </form>

          <aside className={styles.info}>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>📍</span>
              <div>
                <strong>Location</strong>
                <p>Pretoria, South Africa</p>
              </div>
            </div>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>⏰</span>
              <div>
                <strong>Response Time</strong>
                <p>Within 24 hours</p>
              </div>
            </div>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>🐾</span>
              <div>
                <strong>Pets Accepted</strong>
                <p>Dogs, cats, birds, rabbits & more</p>
              </div>
            </div>
            <div className={styles.promise}>
              <h3>My Promise 💛</h3>
              <p>Your pet will be treated like family. I'll send regular updates and photos so you can relax knowing they're in great hands.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
