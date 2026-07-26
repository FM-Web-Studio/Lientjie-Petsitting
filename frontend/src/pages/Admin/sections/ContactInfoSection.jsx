import { useState, useEffect } from 'react';
import { getContent, saveContentGroup } from '../../../firebase/content.js';
import { CONTACT_INFO_FIELDS, resolveGroup } from '../../../content/siteCopy.js';
import { useToast } from '../../../context/ToastContext.jsx';
import styles from '../Admin.module.css';

export default function ContactInfoSection() {
  const { addToast } = useToast();
  const [draft, setDraft] = useState(() => resolveGroup(CONTACT_INFO_FIELDS, {}));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getContent().then((data) => setDraft(resolveGroup(CONTACT_INFO_FIELDS, data?.contact)));
  }, []);

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
    } catch { addToast('Failed to save contact details.', 'error'); }
    finally { setSaving(false); }
  };

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
