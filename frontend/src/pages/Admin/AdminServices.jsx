import { useState, useEffect } from 'react';
import { getServices, addService, updateService, deleteService } from '../../firebase/services.js';
import { useToast } from '../../context/ToastContext.jsx';
import { SERVICE_CATEGORIES } from '../../firebase/config.js';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import { KebabMenu } from '../../components/index.js';
import styles from './Admin.module.css';

const BLANK = { name: '', icon: '🐾', description: '', price: '', priceUnit: 'session', duration: '', category: 'Other', order: 0, active: true };

export default function AdminServices() {
  const { addToast } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => getServices(false).then(setServices).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const openNew = () => { setEditing('new'); setForm({ ...BLANK, order: services.length }); };
  const openEdit = (svc) => { setEditing(svc.id); setForm(svc); };
  const cancel = () => { setEditing(null); setForm(BLANK); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return addToast('Name and price are required.', 'warning');
    setSaving(true);
    try {
      const { id, ...fields } = form;
      const data = { ...fields, price: Number(form.price), order: Number(form.order) };
      if (editing === 'new') await addService(data);
      else await updateService(editing, data);
      addToast(editing === 'new' ? 'Service added!' : 'Service updated!', 'success');
      cancel();
      load();
    } catch (err) {
      console.error('Failed to save service:', err);
      const reason = err?.code === 'permission-denied'
        ? 'Permission denied — make sure you are signed in as an admin.'
        : err?.message || 'Unknown error';
      addToast(`Failed to save service: ${reason}`, 'error');
    }
    finally { setSaving(false); }
  };

  const toggleActive = async (svc) => {
    await updateService(svc.id, { active: !svc.active });
    load();
  };

  const remove = async (svc) => {
    if (!confirm(`Delete "${svc.name}"?`)) return;
    await deleteService(svc.id);
    addToast('Service deleted.', 'info');
    load();
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Services</h2>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Service</button>
      </div>

      {editing && (
        <div className={styles.formCard}>
          <h3>{editing === 'new' ? 'New Service' : 'Edit Service'}</h3>
          <form onSubmit={save} className={styles.grid2}>
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
              <select value={form.priceUnit} onChange={set('priceUnit')}>
                <option value="session">/ session</option>
                <option value="hour">/ hour</option>
                <option value="day">/ day</option>
                <option value="night">/ night</option>
                <option value="visit">/ visit</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Duration</label>
              <input value={form.duration} onChange={set('duration')} placeholder="1 hour" />
            </div>
            <div className={styles.field}>
              <label>Category</label>
              <select value={form.category} onChange={set('category')}>
                {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Order</label>
              <input type="number" value={form.order} onChange={set('order')} min="0" />
            </div>
            <div className={`${styles.field} ${styles.checkField}`}>
              <label><input type="checkbox" checked={form.active} onChange={set('active')} /> Active (visible on site)</label>
            </div>
            <div className={`${styles.formActions} ${styles.span2}`}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save Service'}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={cancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableWrap}>
        {loading ? (
          <table className={styles.table}>
            <thead><tr><th>Icon</th><th>Name</th><th>Price</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {[...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td><Skeleton style={{ width: '2rem', height: '2rem' }} /></td>
                  <td><Skeleton style={{ width: '120px', height: '1rem', marginBottom: '0.3rem' }} /><Skeleton style={{ width: '70px', height: '0.8rem' }} /></td>
                  <td><Skeleton style={{ width: '80px', height: '1rem' }} /></td>
                  <td><Skeleton style={{ width: '60px', height: '1rem' }} /></td>
                  <td><Skeleton style={{ width: '64px', height: '1.5rem', borderRadius: 'var(--radius-full)' }} /></td>
                  <td><div className={styles.actions}><Skeleton style={{ width: '52px', height: '32px', borderRadius: 'var(--radius-full)' }} /><Skeleton style={{ width: '60px', height: '32px', borderRadius: 'var(--radius-full)' }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : services.length === 0
          ? <p className={styles.empty}>No services yet. Add your first one above!</p>
          : (
            <table className={styles.table}>
              <thead>
                <tr><th>Icon</th><th>Name</th><th>Price</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id}>
                    <td>{svc.icon}</td>
                    <td><strong>{svc.name}</strong><br /><small>{svc.category}</small></td>
                    <td>R{svc.price} / {svc.priceUnit}</td>
                    <td>{svc.duration || '—'}</td>
                    <td>
                      <button
                        className={`badge ${svc.active ? styles.badgeActive : styles.badgeInactive}`}
                        onClick={() => toggleActive(svc)}
                        title="Toggle active"
                      >
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
          )
        }
      </div>

      {/* Mobile card layout (the table is hidden ≤900px). Actions live behind a ⋯ menu. */}
      <div className={styles.cardList}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className={styles.serviceCard}>
              <Skeleton style={{ width: '2rem', height: '2rem', flexShrink: 0 }} />
              <div className={styles.serviceCardInfo}>
                <Skeleton style={{ width: '140px', height: '1rem', marginBottom: '0.3rem' }} />
                <Skeleton style={{ width: '90px', height: '0.8rem' }} />
              </div>
            </div>
          ))
        ) : services.length === 0 ? (
          <p className={styles.empty}>No services yet. Add your first one above!</p>
        ) : (
          services.map((svc) => (
            <div key={svc.id} className={styles.serviceCard}>
              <span className={styles.serviceCardIcon}>{svc.icon}</span>
              <div className={styles.serviceCardInfo}>
                <strong>{svc.name}</strong>
                <small>{svc.category}</small>
                <span className={styles.servicePrice}>
                  R{svc.price} / {svc.priceUnit}{svc.duration ? ` · ${svc.duration}` : ''}
                </span>
                <button
                  className={`badge ${svc.active ? styles.badgeActive : styles.badgeInactive}`}
                  onClick={() => toggleActive(svc)}
                  title="Toggle active"
                >
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
          ))
        )}
      </div>
    </div>
  );
}
