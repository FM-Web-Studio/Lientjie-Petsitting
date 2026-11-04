import { useState, useEffect, useRef } from 'react';
import { getBio, saveBio, uploadProfileImage, deleteProfileImage } from '../../../../firebase/bio.js';
import { prepareImage } from '../../../../utils/image.js';
import { saveErrorMessage } from '../../../../firebase/errors.js';
import { useToast } from '../../../../context/ToastContext.jsx';
import styles from '../../Admin.module.css';

// Formats every browser can actually paint in an <img>.
const RENDERABLE = /^image\/(jpeg|png|webp|gif|avif)$/;

/*
 * The two failure modes worth naming, because they need different fixes and
 * both used to surface as the same shrug of an "upload failed" toast:
 *
 *   storage/unauthorized  - the Storage write was refused. Either storage.rules
 *                           was never deployed for this bucket, or the sign-in
 *                           expired.
 *   permission-denied     - Storage accepted the photo but Firestore refused to
 *                           record it. firestore.rules gates writes on the
 *                           `settings/admins` allow-list.
 */
function uploadErrorMessage(err) {
  switch (err?.code) {
    case 'storage/unauthorized':
      return 'Storage rejected the upload. Check you are still signed in, and that storage rules are deployed.';
    case 'permission-denied':
      return 'The photo uploaded but could not be saved. Your account is not on the Firestore admin allow-list (settings/admins).';
    case 'storage/retry-limit-exceeded':
    case 'unavailable':
      return 'The connection dropped during upload. Please try again.';
    default:
      return 'Image upload failed. Please try again.';
  }
}

const BLANK = {
  name: '', tagline: '', story: '', experience: '',
  profileImageUrl: '', profileImagePath: '', qualifications: [],
};

export default function AboutSection() {
  const { addToast } = useToast();
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [newQual, setNewQual] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    getBio()
      .then((bio) => { if (bio) setForm({ ...BLANK, ...bio }); })
      .catch(() => addToast('Could not load the bio. Please refresh.', 'error'));
  }, [addToast]);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBio(form);
      addToast('Bio saved!', 'success');
    } catch (err) {
      console.error('Failed to save bio:', err);
      addToast(saveErrorMessage(err, 'your bio'), 'error');
    } finally { setSaving(false); }
  };

  /*
   * The photo is persisted the moment it uploads, rather than waiting for
   * "Save Bio". Previously the upload only touched local state, so an admin who
   * picked a photo, saw the success toast and clicked away never had it stored -
   * from their side the upload simply did nothing.
   *
   * The file is also compressed/transcoded to JPEG first (same path the gallery
   * uses). A raw phone photo is 4-12 MB: slow enough on mobile to look frozen,
   * and over the 15 MB ceiling in storage.rules often enough to be rejected
   * outright. Transcoding also rescues HEIC, which uploads happily and then
   * renders as a blank <img> in every browser except Safari.
   */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previous = form.profileImagePath;

    setUploading(true);
    setProgress(0);
    try {
      const { file: prepared, previewUrl } = await prepareImage(file);
      URL.revokeObjectURL(previewUrl); // we show the uploaded URL, not a local preview

      // prepareImage falls back to the ORIGINAL file whenever the browser cannot
      // decode it. For HEIC that means we would upload a file no browser but
      // Safari can paint - a stored photo that renders as an empty circle. Stop
      // here with something the admin can act on instead.
      if (!RENDERABLE.test(prepared.type)) {
        addToast('That format (e.g. HEIC) is not supported. Please use a JPEG or PNG.', 'error');
        return;
      }

      const { url, storagePath } = await uploadProfileImage(prepared, setProgress);
      const next = { profileImageUrl: url, profileImagePath: storagePath };

      await saveBio(next);
      setForm((f) => ({ ...f, ...next }));
      deleteProfileImage(previous); // fire-and-forget cleanup of the old photo
      addToast('Profile photo updated!', 'success');
    } catch (err) {
      console.error('Profile image upload failed:', err);
      addToast(uploadErrorMessage(err), 'error');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addQual = () => {
    if (!newQual.trim()) return;
    setForm((f) => ({ ...f, qualifications: [...(f.qualifications || []), newQual.trim()] }));
    setNewQual('');
  };
  const removeQual = (idx) => setForm((f) => ({ ...f, qualifications: f.qualifications.filter((_, i) => i !== idx) }));

  const pct = Math.round(progress * 100);

  return (
    <div>
      <p className={styles.intro}>
        Your name, story and photo shown on the About page and the home-page snippet.
        Phone, email and social links live under <strong>Contact Info</strong>.
      </p>

      <div className={styles.formCard}>
        <form onSubmit={handleSave} className={styles.bioLayout}>
          <div className={styles.bioImageCol}>
            {form.profileImageUrl
              ? <img src={form.profileImageUrl} alt="Profile" className={styles.profilePreview} />
              : <div className={styles.profilePlaceholder}>🐾</div>}
            <label className={`btn btn-secondary btn-sm ${styles.uploadBtn}`}>
              {uploading ? `Uploading… ${pct}%` : 'Change Photo'}
              <input type="file" accept="image/*" ref={fileRef} onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            {uploading && (
              <div className={styles.progressWrap} style={{ width: '100%' }}>
                <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${pct}%` }} /></div>
                <span className={styles.progressLabel}>{pct}%</span>
              </div>
            )}
            <p className={styles.helpText} style={{ textAlign: 'center' }}>
              The photo saves on its own - the button below is for the text fields.
            </p>
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
