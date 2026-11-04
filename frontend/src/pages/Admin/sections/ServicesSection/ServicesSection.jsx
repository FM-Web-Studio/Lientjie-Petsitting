import { useState, useEffect } from 'react';
import { getServices, addService, updateService, deleteService } from '../../../../firebase/services.js';
import { SERVICE_CATEGORIES } from '../../../../firebase/config.js';
import { useToast } from '../../../../context/ToastContext.jsx';
import Skeleton from '../../../../components/Skeleton';
import KebabMenu from '../../../../components/KebabMenu';
import Modal from '../../../../components/Modal';
import SearchableDropdown from '../../../../components/SearchableDropdown';
import styles from '../../Admin.module.css';

const BLANK = { name: '', icon: '🐾', description: '', price: '', priceUnit: 'session', duration: '', category: 'Other', order: 0, active: true, includes: [] };

const PRICE_UNITS = ['session', 'hour', 'day', 'night', 'visit'];
const opt = (v) => ({ value: v, label: v });

export default function ServicesSection() {
  const { addToast } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode:'add'|'edit', id? }
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [newInclude, setNewInclude] = useState('');

  const load = () => getServices(false).then(setServices).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const openNew = () => { setForm({ ...BLANK, order: services.length }); setNewInclude(''); setModal({ mode: 'add' }); };
  const openEdit = (svc) => { setForm({ ...BLANK, ...svc, includes: svc.includes || [] }); setNewInclude(''); setModal({ mode: 'edit', id: svc.id }); };
  const closeModal = () => { setModal(null); setForm(BLANK); };

  const addInclude = () => {
    const v = newInclude.trim();
    if (!v) return;
    setForm((f) => ({ ...f, includes: [...(f.includes || []), v] }));
    setNewInclude('');
  };
  const removeInclude = (idx) => setForm((f) => ({ ...f, includes: f.includes.filter((_, i) => i !== idx) }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || form.price === '') { addToast('Name and price are required.', 'warning'); return; }
    setSaving(true);
    try {
      const { id, ...fields } = form;
      const data = { ...fields, price: Number(form.price), order: Number(form.order) || 0, includes: form.includes || [] };
      if (modal.mode === 'add') await addService(data);
      else await updateService(modal.id, data);
      addToast(modal.mode === 'add' ? 'Service added!' : 'Service updated!', 'success');
      closeModal();
      load();
    } catch (err) {
      const reason = err?.code === 'permission-denied'
        ? 'Permission denied - make sure you are signed in as an admin.'
        : err?.message || 'Unknown error';
      addToast(`Failed to save service: ${reason}`, 'error');
    } finally { setSaving(false); }
  };

  const toggleActive = async (svc) => { await updateService(svc.id, { active: !svc.active }); load(); };
  const remove = async (svc) => {
    if (!confirm(`Delete "${svc.name}"?`)) return;
    await deleteService(svc.id);
    addToast('Service deleted.', 'info');
    load();
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <p className={styles.helpText} style={{ margin: 0 }}>Services shown on the Services & Home pages.</p>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Service</button>
      </div>

      {/* Desktop table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <table className={styles.table}>
            <thead><tr><th>Icon</th><th>Name</th><th>Price</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {[...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td><Skeleton style={{ width: '2rem', height: '2rem' }} /></td>
                  <td><Skeleton style={{ width: '120px', height: '1rem' }} /></td>
                  <td><Skeleton style={{ width: '80px', height: '1rem' }} /></td>
                  <td><Skeleton style={{ width: '60px', height: '1rem' }} /></td>
                  <td><Skeleton style={{ width: '64px', height: '1.5rem', borderRadius: 'var(--radius-full)' }} /></td>
                  <td><Skeleton style={{ width: '110px', height: '32px', borderRadius: 'var(--radius-full)' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : services.length === 0 ? (
          <p className={styles.empty}>No services yet. Add your first one above!</p>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Icon</th><th>Name</th><th>Price</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id}>
                  <td>{svc.icon}</td>
                  <td><strong>{svc.name}</strong><br /><small>{svc.category}</small></td>
                  <td>R{svc.price} / {svc.priceUnit}</td>
                  <td>{svc.duration || '-'}</td>
                  <td>
                    <button className={`badge ${svc.active ? styles.badgeActive : styles.badgeInactive}`} onClick={() => toggleActive(svc)} title="Toggle active">
                      {svc.active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className={styles.actions}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(svc)}>Edit</button>
                    <button className={`btn btn-sm ${styles.deleteBtn}`} onClick={() => remove(svc)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className={styles.cardList}>
        {!loading && services.map((svc) => (
          <div key={svc.id} className={styles.serviceCard}>
            <span className={styles.serviceCardIcon}>{svc.icon}</span>
            <div className={styles.serviceCardInfo}>
              <strong>{svc.name}</strong>
              <small>{svc.category}</small>
              <span className={styles.servicePrice}>R{svc.price} / {svc.priceUnit}{svc.duration ? ` · ${svc.duration}` : ''}</span>
              <button className={`badge ${svc.active ? styles.badgeActive : styles.badgeInactive}`} onClick={() => toggleActive(svc)}>
                {svc.active ? 'Active' : 'Hidden'}
              </button>
            </div>
            <KebabMenu
              ariaLabel={`Actions for ${svc.name}`}
              items={[
                { label: 'Edit', onClick: () => openEdit(svc) },
                { label: svc.active ? 'Hide' : 'Show', onClick: () => toggleActive(svc) },
                { label: 'Delete', danger: true, onClick: () => remove(svc) },
              ]}
            />
          </div>
        ))}
      </div>

      <Modal open={!!modal} onClose={closeModal} title={modal?.mode === 'add' ? 'Add Service' : 'Edit Service'} size="lg">
        <form onSubmit={save}>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Name *</label>
              <input value={form.name} onChange={set('name')} placeholder="Dog Walking" required />
            </div>
            <div className={styles.field}>
              <label>Icon (emoji)</label>
              <input value={form.icon} onChange={set('icon')} placeholder="🐕" maxLength={4} />
            </div>
            <div className={`${styles.field} ${styles.span2}`}>
              <label>Description</label>
              <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Describe the service…" />
            </div>
            <div className={styles.field}>
              <label>Price (R) *</label>
              <input type="number" value={form.price} onChange={set('price')} placeholder="150" min="0" required />
            </div>
            <div className={styles.field}>
              <label>Price Unit</label>
              <SearchableDropdown
                options={PRICE_UNITS.map(opt)}
                value={opt(form.priceUnit)}
                onChange={(o) => setForm((f) => ({ ...f, priceUnit: o?.value || 'session' }))}
                isSearchable={false}
              />
            </div>
            <div className={styles.field}>
              <label>Category</label>
              <SearchableDropdown
                options={SERVICE_CATEGORIES.map(opt)}
                value={opt(form.category)}
                onChange={(o) => setForm((f) => ({ ...f, category: o?.value || 'Other' }))}
              />
            </div>
            <div className={styles.field}>
              <label>Duration</label>
              <input value={form.duration} onChange={set('duration')} placeholder="1 hour" />
            </div>
            <div className={styles.field}>
              <label>Order</label>
              <input type="number" value={form.order} onChange={set('order')} min="0" />
            </div>
            <div className={`${styles.field} ${styles.span2}`}>
              <label>What's included (bullet points on the Services page)</label>
              <div className={styles.qualInput}>
                <input value={newInclude} onChange={(e) => setNewInclude(e.target.value)} placeholder="e.g. 30-minute walk" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInclude())} />
                <button type="button" className="btn btn-teal btn-sm" onClick={addInclude}>Add</button>
              </div>
              {(form.includes || []).length > 0 && (
                <div className={styles.chipList}>
                  {form.includes.map((item, i) => (
                    <div key={i} className={styles.chipRow}>
                      <span>✅ {item}</span>
                      <button type="button" onClick={() => removeInclude(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`${styles.field} ${styles.checkField} ${styles.span2}`}>
              <label><input type="checkbox" checked={form.active} onChange={set('active')} /> Active (visible on site)</label>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Service'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
