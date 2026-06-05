import { useState, useEffect, useRef } from 'react';
import { getBio, saveBio, uploadProfileImage } from '../../firebase/bio.js';
import { useToast } from '../../context/ToastContext.jsx';
import styles from './Admin.module.css';

const BLANK = { name: '', tagline: '', story: '', experience: '', location: '', phone: '', email: '', profileImageUrl: '', qualifications: [] };

export default function AdminBio() {
  const { addToast } = useToast();
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newQual, setNewQual] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    getBio().then((bio) => { if (bio) setForm({ ...BLANK, ...bio }); });
  }, []);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBio(form);
      addToast('Bio saved!', 'success');
    } catch { addToast('Failed to save bio.', 'error'); }
    finally { setSaving(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProfileImage(file);
      setForm((f) => ({ ...f, profileImageUrl: url }));
      addToast('Profile image uploaded!', 'success');
    } catch { addToast('Image upload failed.', 'error'); }
    finally { setUploading(false); fileRef.current.value = ''; }
  };

  const addQual = () => {
    if (!newQual.trim()) return;
    setForm((f) => ({ ...f, qualifications: [...(f.qualifications || []), newQual.trim()] }));
    setNewQual('');
  };

  const removeQual = (idx) => {
    setForm((f) => ({ ...f, qualifications: f.qualifications.filter((_, i) => i !== idx) }));
  };

  return (
    <div>
      <div className={styles.sectionHeader}><h2>Bio & Profile</h2></div>

      <div className={styles.formCard}>
        <form onSubmit={handleSave} className={styles.bioLayout}>
          <div className={styles.bioImageCol}>
            {form.profileImageUrl
              ? <img src={form.profileImageUrl} alt="Profile" className={styles.profilePreview} />
              : <div className={styles.profilePlaceholder}>🐾</div>
            }
            <label className={`btn btn-secondary btn-sm ${styles.uploadBtn}`}>
              {uploading ? 'Uploading…' : 'Change Photo'}
              <input type="file" accept="image/*" ref={fileRef} onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>

          <div className={styles.bioFields}>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Name</label>
                <input value={form.name} onChange={set('name')} placeholder="Lientjie" />
              </div>
              <div className={styles.field}>
                <label>Experience</label>
                <input value={form.experience} onChange={set('experience')} placeholder="5+ years" />
              </div>
              <div className={`${styles.field} ${styles.span2}`}>
                <label>Tagline</label>
                <input value={form.tagline} onChange={set('tagline')} placeholder="Passionate pet lover & caregiver" />
              </div>
              <div className={`${styles.field} ${styles.span2}`}>
                <label>Story (separate paragraphs with a new line)</label>
                <textarea value={form.story} onChange={set('story')} rows={8} placeholder="Tell visitors about yourself…" />
              </div>
              <div className={styles.field}>
                <label>Location</label>
                <input value={form.location} onChange={set('location')} placeholder="Pretoria, South Africa" />
              </div>
              <div className={styles.field}>
                <label>Phone</label>
                <input value={form.phone} onChange={set('phone')} placeholder="+27 82 000 0000" />
              </div>
              <div className={`${styles.field} ${styles.span2}`}>
                <label>Email</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="lientjie@example.com" />
              </div>
            </div>

            <div className={styles.qualSection}>
              <label className={styles.qualLabel}>Qualifications & Certifications</label>
              <div className={styles.qualInput}>
                <input value={newQual} onChange={(e) => setNewQual(e.target.value)} placeholder="e.g. First Aid for Pets" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQual())} />
                <button type="button" className="btn btn-teal btn-sm" onClick={addQual}>Add</button>
              </div>
              <ul className={styles.qualList}>
                {(form.qualifications || []).map((q, i) => (
                  <li key={i}>
                    <span>🏆 {q}</span>
                    <button type="button" onClick={() => removeQual(i)} className={styles.removeQual}>✕</button>
                  </li>
                ))}
              </ul>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Bio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
