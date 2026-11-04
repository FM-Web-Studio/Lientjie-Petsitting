import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { sendMessage } from '../../firebase/contact.js';
import { LIMIT_TEXT } from '../../firebase/functions.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { PET_TYPES, CONTACT_LIMITS, EMAIL_PATTERN } from '../../firebase/config.js';
import Honeypot, { caughtBot, trapFields } from '../../components/Honeypot';
import PageHero from '../../components/PageHero';
import Reveal from '../../components/Reveal';
import styles from './Contact.module.css';
import usePageMeta from '../../hooks/usePageMeta.js';

const INITIAL = { name: '', email: '', phone: '', petName: '', petType: '', serviceInterest: '', message: '' };
const PET_ICONS = { Dog: '🐶', Cat: '🐱', Bird: '🐦', Rabbit: '🐰', 'Guinea Pig': '🐹', Other: '🦎' };
const FALLBACK_SERVICES = ['Dog Walking', 'Pet Sitting', 'Overnight Stay', 'Grooming', 'Other'];

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Please tell me your name.';
  if (!form.email.trim()) errors.email = 'I need an email address to reply to.';
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'That email address does not look quite right.';
  if (!form.message.trim()) errors.message = 'Tell me a little about what you need.';
  return errors;
};

export default function Contact() {
  usePageMeta({ title: 'Contact' });
  const { addToast } = useToast();
  const { copy } = useContent();
  const { services } = useData();
  const [params] = useSearchParams();
  const t = copy('contactPage');
  const info = copy('contact');

  // Arriving from a service card's Book button picks that service for you.
  const [form, setForm] = useState(() => ({
    ...INITIAL,
    serviceInterest: (params.get('service') || '').slice(0, CONTACT_LIMITS.serviceInterest),
  }));
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const trap = useRef(null);
  const formRef = useRef(null);

  const serviceNames = services.map((s) => s.name).filter(Boolean);
  const baseOptions = serviceNames.length ? serviceNames : FALLBACK_SERVICES;
  // Keep a pre-picked service visible even if it is not in the list (renamed, or typed into the URL).
  const serviceOptions = form.serviceInterest && !baseOptions.includes(form.serviceInterest)
    ? [...baseOptions, form.serviceInterest]
    : baseOptions;

  const set = (field) => (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };
  const toggle = (field, value) => setForm((f) => ({ ...f, [field]: f[field] === value ? '' : value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    setSending(true);
    try {
      if (!caughtBot(trap)) await sendMessage(form, trapFields(trap));
      setSent(true);
    } catch (err) {
      addToast(LIMIT_TEXT[err.limit] ?? 'Something went wrong sending that. Please try again in a moment.', 'error', 6000);
    } finally {
      setSending(false);
    }
  };

  const startOver = () => { setForm(INITIAL); setErrors({}); setSent(false); };

  const errorFor = (field) => errors[field] && (
    <span id={`${field}-error`} className={styles.error} role="alert">{errors[field]}</span>
  );
  const describedBy = (field) => (errors[field] ? `${field}-error` : undefined);

  const infoCards = [
    info.location && { icon: '📍', title: 'Location', body: info.location },
    info.phone && { icon: '📞', title: 'Phone', body: <a href={`tel:${info.phone.replace(/\s+/g, '')}`}>{info.phone}</a> },
    info.email && { icon: '✉️', title: 'Email', body: <a href={`mailto:${info.email}`}>{info.email}</a> },
    info.responseTime && { icon: '⏰', title: 'Response time', body: info.responseTime },
    info.petsAccepted && { icon: '🐾', title: 'Pets accepted', body: info.petsAccepted },
  ].filter(Boolean);

  return (
    <div>
      <PageHero title={t.heroTitle} subtitle={t.heroSubtitle} emoji="💌" tone="yellow" />

      <section className="section-tight">
        <div className={`container ${styles.layout}`}>
          {sent ? (
            <div className={styles.sent} role="status">
              <span className={styles.sentIcon} aria-hidden="true">🎉</span>
              <h2>Message sent!</h2>
              <p>
                Thank you{form.name ? `, ${form.name.split(' ')[0]}` : ''}! I&apos;ll get back to you
                {info.responseTime ? ` ${info.responseTime.charAt(0).toLowerCase()}${info.responseTime.slice(1)}` : ' as soon as I can'}.
                {form.petName ? ` Give ${form.petName} a scratch from me 🐾` : ''}
              </p>
              <div className={styles.sentBtns}>
                <Link to="/" className="btn btn-primary">Back home</Link>
                <button type="button" className="btn btn-secondary" onClick={startOver}>Send another</button>
              </div>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className={styles.form} noValidate>
              <h2>{t.formTitle}</h2>

              <fieldset className={styles.group}>
                <legend className={styles.step}><span>1</span> About you</legend>
                <div className={styles.row}>
                  <div className="field">
                    <label htmlFor="c-name">Your name *</label>
                    <input id="c-name" name="name" type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" autoComplete="name" maxLength={CONTACT_LIMITS.name} aria-invalid={!!errors.name} aria-describedby={describedBy('name')} />
                    {errorFor('name')}
                  </div>
                  <div className="field">
                    <label htmlFor="c-email">Email address *</label>
                    <input id="c-email" name="email" type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" autoComplete="email" inputMode="email" maxLength={CONTACT_LIMITS.email} aria-invalid={!!errors.email} aria-describedby={describedBy('email')} />
                    {errorFor('email')}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="c-phone">Phone number <span className={styles.optional}>(optional)</span></label>
                  <input id="c-phone" name="phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+27 82 000 0000" autoComplete="tel" maxLength={CONTACT_LIMITS.phone} />
                </div>
              </fieldset>

              <fieldset className={styles.group}>
                <legend className={styles.step}><span>2</span> About your pet</legend>
                <div className="field">
                  <span className="field-label" id="pet-type-label">What kind of pet?</span>
                  <div className={styles.chips} role="group" aria-labelledby="pet-type-label">
                    {PET_TYPES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`${styles.chip} ${form.petType === p ? styles.chipOn : ''}`}
                        onClick={() => toggle('petType', p)}
                        aria-pressed={form.petType === p}
                      >
                        <span className={styles.chipIcon} aria-hidden="true">{PET_ICONS[p] || '🐾'}</span>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="c-pet">Your pet&apos;s name <span className={styles.optional}>(optional)</span></label>
                  <input id="c-pet" name="petName" type="text" value={form.petName} onChange={set('petName')} placeholder="Buddy" maxLength={CONTACT_LIMITS.petName} />
                </div>
                <div className="field">
                  <span className="field-label" id="service-label">Which service are you after?</span>
                  <div className={styles.chips} role="group" aria-labelledby="service-label">
                    {serviceOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.chip} ${styles.chipTeal} ${form.serviceInterest === s ? styles.chipOn : ''}`}
                        onClick={() => toggle('serviceInterest', s)}
                        aria-pressed={form.serviceInterest === s}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </fieldset>

              <fieldset className={styles.group}>
                <legend className={styles.step}><span>3</span> Your message</legend>
                <div className="field">
                  <label htmlFor="c-message">Message *</label>
                  <textarea id="c-message" name="message" value={form.message} onChange={set('message')} rows={5} placeholder="Dates, routines, anything I should know…" maxLength={CONTACT_LIMITS.message} aria-invalid={!!errors.message} aria-describedby={describedBy('message')} />
                  {errorFor('message')}
                </div>
              </fieldset>

              <Honeypot ref={trap} />

              <p className={styles.privacy}>
                🔒 I use these details only to reply to you and arrange care for your pet. Messages are deleted after 12 months. See the <Link to="/privacy" className="link">privacy policy</Link>.
              </p>

              <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
                {sending ? <><span className={styles.spinner} aria-hidden="true" /> Sending…</> : t.sendBtn}
              </button>
            </form>
          )}

          <aside className={styles.info}>
            {infoCards.map((c, i) => (
              <Reveal key={c.title} delay={i * 70} className={styles.infoCard}>
                <span className={styles.infoIcon} aria-hidden="true">{c.icon}</span>
                <div><strong>{c.title}</strong><p>{c.body}</p></div>
              </Reveal>
            ))}
            {(info.instagram || info.facebook || info.whatsapp) && (
              <Reveal className={styles.socials}>
                {info.whatsapp && <a href={info.whatsapp} target="_blank" rel="noopener noreferrer" className={`${styles.social} ${styles.whatsapp}`}>💬 WhatsApp</a>}
                {info.instagram && <a href={info.instagram} target="_blank" rel="noopener noreferrer" className={styles.social}>📷 Instagram</a>}
                {info.facebook && <a href={info.facebook} target="_blank" rel="noopener noreferrer" className={styles.social}>👍 Facebook</a>}
              </Reveal>
            )}
            <Reveal className={styles.promise}>
              <h3>{t.promiseTitle}</h3>
              <p>{t.promiseText}</p>
            </Reveal>
          </aside>
        </div>
      </section>
    </div>
  );
}
