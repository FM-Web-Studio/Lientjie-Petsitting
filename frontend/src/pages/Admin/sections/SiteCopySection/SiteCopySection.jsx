import { useState, useEffect, useRef } from 'react';
import { getContent, saveContentGroup } from '../../../../firebase/content.js';
import { COPY_SCHEMA } from '../../../../content/siteCopy.js';
import { saveErrorMessage } from '../../../../firebase/errors.js';
import { useToast } from '../../../../context/ToastContext.jsx';
import { FormSkeleton } from '../../../../components/PageSkeleton';
import styles from '../../Admin.module.css';

const FIELDS = 7;

// Working draft: show the saved override if present, else the in-code default,
// so the editor always mirrors what's live on the site.
const buildDraft = (saved = {}) => {
  const d = {};
  for (const group of COPY_SCHEMA) {
    d[group.key] = {};
    for (const f of group.fields) {
      const ov = saved?.[group.key]?.[f.key];
      d[group.key][f.key] = (typeof ov === 'string' && ov !== '') ? ov : f.default;
    }
  }
  return d;
};

// Only values that differ from the default are persisted, so code stays the
// single source of truth for anything untouched.
const overridesFor = (group, draft) => {
  const g = {};
  for (const f of group.fields) {
    const val = (draft[group.key]?.[f.key] ?? '').trim();
    if (val !== '' && val !== f.default) g[f.key] = val;
  }
  return g;
};

export default function SiteCopySection() {
  const { addToast } = useToast();
  const [activeGroup, setActiveGroup] = useState(COPY_SCHEMA[0].key);
  const [draft, setDraft] = useState(() => buildDraft({}));
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);

  const [status, setStatus] = useState('loading');
  const load = () => {
    setStatus('loading');
    getContent({ strict: true })
      .then((data) => { if (!dirtyRef.current) setDraft(buildDraft(data)); setStatus('ready'); })
      .catch(() => setStatus('error'));
  };
  useEffect(load, []);

  const set = (groupKey, fieldKey, value) => {
    dirtyRef.current = true;
    setDraft((prev) => ({ ...prev, [groupKey]: { ...prev[groupKey], [fieldKey]: value } }));
  };
  const resetField = (groupKey, field) => set(groupKey, field.key, field.default);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each copy group independently (each replaces its own map), leaving
      // the contact-info group untouched.
      for (const group of COPY_SCHEMA) {
        // eslint-disable-next-line no-await-in-loop
        await saveContentGroup(group.key, overridesFor(group, draft));
      }
      dirtyRef.current = false;
      addToast('Site copy updated!', 'success');
    } catch (err) {
      console.error('Failed to save site copy:', err);
      addToast(saveErrorMessage(err, 'your site copy'), 'error');
    } finally { setSaving(false); }
  };

  const group = COPY_SCHEMA.find((g) => g.key === activeGroup) ?? COPY_SCHEMA[0];

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
        Edit the headings and wording shown across the site. Clear a field to restore
        its original text. Changes apply to every page in the group.
      </p>

      <nav className={styles.subTabs}>
        {COPY_SCHEMA.map((g) => (
          <button
            key={g.key}
            type="button"
            className={`${styles.subTab} ${g.key === activeGroup ? styles.subTabActive : ''}`}
            onClick={() => setActiveGroup(g.key)}
          >
            {g.label}
          </button>
        ))}
      </nav>

      <div className={styles.formCard}>
        <div className={styles.grid2}>
          {group.fields.map((f) => {
            const value = draft[group.key]?.[f.key] ?? '';
            const modified = value !== f.default;
            const full = f.type === 'textarea';
            return (
              <div key={f.key} className={`${styles.field} ${full ? styles.span2 : ''}`}>
                <label htmlFor={`copy-${group.key}-${f.key}`}>
                  {f.label}
                  {modified && (
                    <button type="button" className={styles.resetBtn} onClick={() => resetField(group.key, f)} title="Reset to original">
                      ↺ reset
                    </button>
                  )}
                </label>
                {full ? (
                  <textarea id={`copy-${group.key}-${f.key}`} value={value} rows={3} onChange={(e) => set(group.key, f.key, e.target.value)} />
                ) : (
                  <input id={`copy-${group.key}-${f.key}`} type="text" value={value} onChange={(e) => set(group.key, f.key, e.target.value)} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Site Copy'}
        </button>
      </div>
    </div>
  );
}
