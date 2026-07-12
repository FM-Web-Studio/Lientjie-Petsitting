import { useState, useEffect, useRef } from 'react';
import {
  getAlbums, createAlbum, updateAlbum, deleteAlbum,
  addImagesToAlbum, removeImageFromAlbum, albumCover,
} from '../../firebase/gallery.js';
import { prepareImages } from '../../utils/image.js';
import { useToast } from '../../context/ToastContext.jsx';
import { GALLERY_CATEGORIES } from '../../firebase/config.js';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import styles from './Admin.module.css';

const CATEGORY_OPTIONS = GALLERY_CATEGORIES.filter((c) => c !== 'All');

export default function AdminGallery() {
  const { addToast } = useToast();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [createProgress, setCreateProgress] = useState(0);
  const [addProgress, setAddProgress] = useState(0);
  const [addingId, setAddingId] = useState(null); // post currently receiving new uploads

  // New-post form state. `items` holds { name, file, previewUrl } — the file is
  // already compressed and previewUrl is a tiny thumbnail (not the full-res photo).
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Dogs');
  const [items, setItems] = useState([]);
  const [preparing, setPreparing] = useState(false);
  const [prepareProgress, setPrepareProgress] = useState(0);
  const fileRef = useRef();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const load = () => getAlbums(false).then(setAlbums).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  // Revoke any outstanding preview object-URLs when the component unmounts.
  useEffect(() => () => itemsRef.current.forEach((it) => URL.revokeObjectURL(it.previewUrl)), []);

  // Compress + build small previews off the main thread as soon as photos are picked.
  const onSelectFiles = async (picked) => {
    if (!picked.length) return;
    itemsRef.current.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    setItems([]);
    setPreparing(true);
    setPrepareProgress(0);
    try {
      const prepared = await prepareImages(picked, setPrepareProgress);
      setItems(prepared.map((p, i) => ({ ...p, name: picked[i].name })));
    } catch (err) {
      console.error(err);
      addToast('Could not process those images. Please try again.', 'error');
    } finally {
      setPreparing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeSelected = (index) => {
    setItems((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetSelection = () => {
    itemsRef.current.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    setItems([]);
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!items.length) { addToast('Pick at least one image for the post.', 'error'); return; }
    setCreating(true);
    setCreateProgress(0);
    try {
      const { uploaded, failed } = await createAlbum({
        title, caption, category, files: items.map((it) => it.file), onProgress: setCreateProgress,
      });
      if (failed > 0) {
        addToast(`Post created with ${uploaded} photo(s). ${failed} couldn't upload — add them again.`, 'info');
      } else {
        addToast(`Post created with ${uploaded} photo(s)!`, 'success');
      }
      setTitle(''); setCaption(''); resetSelection();
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      console.error(err);
      addToast('Could not create the post. Please try again.', 'error');
    } finally { setCreating(false); setCreateProgress(0); }
  };

  const toggleActive = async (post) => {
    await updateAlbum(post.id, { active: !post.active });
    load();
  };

  const removePost = async (post) => {
    if (!confirm(`Delete this post and all ${post.images.length} photo(s)? This cannot be undone.`)) return;
    setBusyId(post.id);
    try {
      await deleteAlbum(post.id, post.images);
      addToast('Post deleted.', 'info');
      load();
    } finally { setBusyId(null); }
  };

  const saveCaption = async (post, value) => {
    if (value === post.caption) return;
    await updateAlbum(post.id, { caption: value });
    load();
  };

  const saveCategory = async (post, value) => {
    await updateAlbum(post.id, { category: value });
    load();
  };

  const setCover = async (post, index) => {
    if (index === (post.coverIndex ?? 0)) return;
    await updateAlbum(post.id, { coverIndex: index });
    addToast('Cover photo updated.', 'success');
    load();
  };

  const addMore = async (post, inputEl) => {
    const picked = Array.from(inputEl.files);
    if (!picked.length) return;
    setBusyId(post.id);
    setAddingId(post.id);
    setAddProgress(0);
    try {
      const prepared = await prepareImages(picked);
      const files = prepared.map((p) => p.file);
      prepared.forEach((p) => URL.revokeObjectURL(p.previewUrl)); // no preview shown for this path
      const { uploaded, failed } = await addImagesToAlbum(post.id, files, post.images, setAddProgress);
      if (failed > 0) {
        addToast(`${uploaded} photo(s) added. ${failed} couldn't upload — try again.`, 'info');
      } else {
        addToast(`${uploaded} photo(s) added.`, 'success');
      }
      inputEl.value = '';
      load();
    } catch {
      addToast('Could not add photos.', 'error');
    } finally { setBusyId(null); setAddingId(null); setAddProgress(0); }
  };

  const removeImage = async (post, index) => {
    if (post.images.length === 1) {
      addToast('A post needs at least one photo — delete the whole post instead.', 'info');
      return;
    }
    if (!confirm('Remove this photo from the post?')) return;
    setBusyId(post.id);
    try {
      await removeImageFromAlbum(post.id, post.images, index);
      load();
    } finally { setBusyId(null); }
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>📸 Gallery Posts</h2>
      </div>

      {/* ── Create a post ─────────────────────────────────────────────── */}
      <form className={styles.formCard} onSubmit={createPost}>
        <h3>Create a Post</h3>
        <p className={styles.helpText}>
          A post is a folder of photos that share one caption — like an Instagram post.
          Pick as many images as you like.
        </p>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Title (optional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Beach day with Max" />
          </div>
          <div className={styles.field}>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className={`${styles.field} ${styles.span2}`}>
            <label>Caption</label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Such a fun morning at the park with these happy pups! 🐾"
            />
          </div>
          <div className={`${styles.field} ${styles.span2}`}>
            <label>Photos {items.length > 0 && <span className={styles.helpText}>— {items.length} selected</span>}</label>
            <label className={`btn btn-secondary btn-sm ${styles.uploadBtn}`} style={{ alignSelf: 'flex-start' }}>
              {items.length > 0 ? 'Choose different images' : 'Choose images'}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                ref={fileRef}
                onChange={(e) => onSelectFiles(Array.from(e.target.files))}
                disabled={creating || preparing}
              />
            </label>
            {preparing && (
              <div className={styles.progressWrap}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${Math.round(prepareProgress * 100)}%` }} />
                </div>
                <span className={styles.progressLabel}>Processing photos… {Math.round(prepareProgress * 100)}%</span>
              </div>
            )}
            {items.length > 0 && (
              <div className={styles.thumbStrip}>
                {items.map((it, idx) => (
                  <div key={it.previewUrl} className={styles.thumb}>
                    <img src={it.previewUrl} alt={it.name || `Selected ${idx + 1}`} loading="lazy" decoding="async" />
                    <button
                      type="button"
                      className={styles.thumbRemove}
                      onClick={() => removeSelected(idx)}
                      aria-label="Remove selected photo"
                      disabled={creating}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {creating && (
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${Math.round(createProgress * 100)}%` }} />
            </div>
            <span className={styles.progressLabel}>{Math.round(createProgress * 100)}%</span>
          </div>
        )}
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary" disabled={creating || preparing}>
            {creating ? `⏳ Uploading… ${Math.round(createProgress * 100)}%` : 'Create Post'}
          </button>
        </div>
      </form>

      {/* ── Existing posts ────────────────────────────────────────────── */}
      {loading && (
        <div className={styles.galleryGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.galleryCard}>
              <Skeleton style={{ width: '100%', height: '160px', borderRadius: 0 }} />
              <div className={styles.galleryCardBody}>
                <Skeleton style={{ width: '100%', height: '30px', borderRadius: 'var(--radius-sm)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && albums.length === 0 && (
        <p className={styles.empty}>No posts yet. Create your first one above!</p>
      )}

      {!loading && albums.length > 0 && (
        <div className={styles.postList}>
          {albums.map((post) => {
            const cover = albumCover(post);
            const coverIdx = Math.min(post.coverIndex ?? 0, post.images.length - 1);
            const busy = busyId === post.id;
            const uploading = addingId === post.id;
            return (
              <div key={post.id} className={`${styles.postCard} ${!post.active ? styles.dimmed : ''} ${busy ? styles.busy : ''}`}>
                <div className={styles.postCover}>
                  <img src={cover?.url} alt={post.caption || 'Post cover'} />
                  <span className={`badge ${post.active ? styles.badgeActive : styles.badgeInactive}`}>
                    {post.active ? 'Live' : 'Hidden'}
                  </span>
                </div>

                <div className={styles.postBody}>
                  <div className={styles.field}>
                    <label>Category</label>
                    <select
                      className={styles.captionInput}
                      value={post.category || 'Dogs'}
                      onChange={(e) => saveCategory(post, e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label>Caption</label>
                    <textarea
                      className={styles.captionInput}
                      rows={2}
                      defaultValue={post.caption}
                      placeholder="Add a caption…"
                      onBlur={(e) => saveCaption(post, e.target.value)}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Photos ({post.images.length}) — click one to make it the cover</label>
                    <div className={styles.thumbStrip}>
                      {post.images.map((img, idx) => (
                        <div
                          key={img.storagePath || idx}
                          className={`${styles.thumb} ${idx === coverIdx ? styles.thumbCover : ''}`}
                        >
                          <img
                            src={img.url}
                            alt={`Photo ${idx + 1}`}
                            onClick={() => setCover(post, idx)}
                            title={idx === coverIdx ? 'Cover photo' : 'Set as cover'}
                          />
                          {idx === coverIdx && <span className={styles.coverStar}>★</span>}
                          <button
                            type="button"
                            className={styles.thumbRemove}
                            onClick={() => removeImage(post, idx)}
                            aria-label="Remove photo"
                            disabled={busy}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {uploading && (
                    <div className={styles.progressWrap}>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${Math.round(addProgress * 100)}%` }} />
                      </div>
                      <span className={styles.progressLabel}>{Math.round(addProgress * 100)}%</span>
                    </div>
                  )}
                  <div className={styles.postActions}>
                    <label className={`btn btn-secondary btn-sm ${styles.uploadBtn}`}>
                      {uploading ? `Uploading… ${Math.round(addProgress * 100)}%` : '+ Add photos'}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        disabled={busy}
                        onChange={(e) => addMore(post, e.target)}
                      />
                    </label>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(post)} disabled={busy}>
                      {post.active ? 'Hide' : 'Show'}
                    </button>
                    <button className={`btn btn-sm ${styles.deleteBtn}`} onClick={() => removePost(post)} disabled={busy}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
