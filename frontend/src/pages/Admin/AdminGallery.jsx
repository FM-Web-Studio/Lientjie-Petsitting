import { useState, useEffect, useRef } from 'react';
import { getGalleryImages, uploadGalleryImage, updateGalleryImage, deleteGalleryImage } from '../../firebase/gallery.js';
import { useToast } from '../../context/ToastContext.jsx';
import { GALLERY_CATEGORIES } from '../../firebase/config.js';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import styles from './Admin.module.css';

export default function AdminGallery() {
  const { addToast } = useToast();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Dogs');
  const fileRef = useRef();

  const load = () => getGalleryImages(false).then(setImages).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadGalleryImage(file, caption, category);
      }
      addToast(`${files.length} image(s) uploaded!`, 'success');
      setCaption('');
      fileRef.current.value = '';
      load();
    } catch { addToast('Upload failed. Please try again.', 'error'); }
    finally { setUploading(false); }
  };

  const toggleActive = async (img) => {
    await updateGalleryImage(img.id, { active: !img.active });
    load();
  };

  const remove = async (img) => {
    if (!confirm('Delete this photo?')) return;
    await deleteGalleryImage(img.id, img.storagePath);
    addToast('Photo deleted.', 'info');
    load();
  };

  const updateCaption = async (img, newCaption) => {
    await updateGalleryImage(img.id, { caption: newCaption });
    load();
  };

  const updateCategory = async (img, newCategory) => {
    await updateGalleryImage(img.id, { category: newCategory });
    load();
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Gallery</h2>
      </div>

      <div className={styles.formCard}>
        <h3>Upload Photos</h3>
        <div className={styles.uploadArea}>
          <div className={styles.field}>
            <label>Caption (applies to all uploaded photos)</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Happy pups at playtime!" />
          </div>
          <div className={styles.field}>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {GALLERY_CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Choose images</label>
            <input type="file" accept="image/*" multiple ref={fileRef} onChange={handleUpload} disabled={uploading} />
          </div>
          {uploading && <p className={styles.uploadStatus}>⏳ Uploading…</p>}
        </div>
      </div>

      <div className={styles.galleryGrid}>
        {loading && [...Array(6)].map((_, i) => (
          <div key={i} className={styles.galleryCard}>
            <Skeleton style={{ width: '100%', height: '160px', borderRadius: 0 }} />
            <div className={styles.galleryCardBody}>
              <Skeleton style={{ width: '100%', height: '30px', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }} />
              <Skeleton style={{ width: '100%', height: '30px', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }} />
              <div className={styles.galleryCardActions}>
                <Skeleton style={{ width: '64px', height: '32px', borderRadius: 'var(--radius-full)' }} />
                <Skeleton style={{ width: '64px', height: '32px', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>
          </div>
        ))}
        {!loading && images.length === 0 && <p className={styles.empty}>No photos yet. Upload your first one above!</p>}
        {images.map((img) => (
          <div key={img.id} className={`${styles.galleryCard} ${!img.active ? styles.dimmed : ''}`}>
            <img src={img.url} alt={img.caption || 'Gallery'} />
            <div className={styles.galleryCardOverlay}>
              <span className={`badge ${img.active ? styles.badgeActive : styles.badgeInactive}`}>{img.category}</span>
            </div>
            <div className={styles.galleryCardBody}>
              <select
                className={styles.captionInput}
                value={img.category || 'Dogs'}
                onChange={(e) => updateCategory(img, e.target.value)}
              >
                {GALLERY_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                className={styles.captionInput}
                defaultValue={img.caption}
                placeholder="Add caption…"
                onBlur={(e) => { if (e.target.value !== img.caption) updateCaption(img, e.target.value); }}
              />
              <div className={styles.galleryCardActions}>
                <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(img)}>
                  {img.active ? 'Hide' : 'Show'}
                </button>
                <button className={`btn btn-sm ${styles.deleteBtn}`} onClick={() => remove(img)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
