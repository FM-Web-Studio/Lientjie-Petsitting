import { useState, useEffect } from 'react';
import { getContent, saveContentGroup } from '../../../../firebase/content.js';
import { CONTACT_INFO_FIELDS, resolveGroup } from '../../../../content/siteCopy.js';
import { saveErrorMessage } from '../../../../firebase/errors.js';
import { useToast } from '../../../../context/ToastContext.jsx';
import { FormSkeleton } from '../../../../components/PageSkeleton';
import styles from '../../Admin.module.css';

const FIELDS = 8;

export default function ContactInfoSection() {
  const { addToast } = useToast();
  const [draft, setDraft] = useState(() => resolveGroup(CONTACT_INFO_FIELDS, {}));
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('loading');
  const load = () => {
    setStatus('loading');
    getContent({ strict: true })
      .then((data) => { setDraft(resolveGroup(CONTACT_INFO_FIELDS, data?.contact)); setStatus('ready'); })
      .catch(() => setStatus('error'));
  };
  useEffect(load, []);

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Store only values that differ from the code default, so untouched fields
    // keep falling back to code.
    const overrides = {};
    for (const f of CONTACT_INFO_FIELDS) {
      const val = (draft[f.key] ?? '').trim();
      if (val !== '' && val !== f.default) overrides[f.key] = val;
    }
    try {
      await saveContentGroup('contact', overrides);
      addToast('Contact details saved!', 'success');
    } catch (err) {
      console.error('Failed to save contact details:', err);
      addToast(saveErrorMessage(err, 'your contact details'), 'error');
    }
    finally { setSaving(false); }
  };

  if (status === 'loading') return <FormSkeleton fields={FIELDS} />;
  if (status === 'error') {
    return (
      <div className={styles.loadError}>
        <p>Could not load this. Nothing has been changed.</p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={load}>Try again</button>
      </div>
    );
  }

  return (
    <div>
      <p className={styles.intro}>
        The single source of truth for your contact details - shown on the Contact page
        info cards, the About page and the footer. Leave a field blank to hide it / use the default.
      </p>

      <form className={styles.formCard} onSubmit={handleSave}>
        <div className={styles.grid2}>
          {CONTACT_INFO_FIELDS.map((f) => (
            <div key={f.key} className={styles.field}>
              <label htmlFor={`ci-${f.key}`}>{f.label}</label>
              <input
                id={`ci-${f.key}`}
                value={draft[f.key] ?? ''}
                onChange={set(f.key)}
                placeholder={f.default || '-'}
              />
            </div>
          ))}
        </div>
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Contact Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
