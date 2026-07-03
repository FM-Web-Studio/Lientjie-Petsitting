import { useState, useEffect, useRef } from 'react';
import {
  getAlbums, createAlbum, updateAlbum, deleteAlbum,
  addImagesToAlbum, removeImageFromAlbum, albumCover,
} from '../../firebase/gallery.js';
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

  // New-post form state
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Dogs');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef();

  const load = () => getAlbums(false).then(setAlbums).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  // Build object-URL previews for the selected files; revoke them on change/unmount.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const removeSelected = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!files.length) { addToast('Pick at least one image for the post.', 'error'); return; }
    setCreating(true);
    try {
      await createAlbum({ title, caption, category, files });
      addToast(`Post created with ${files.length} photo(s)!`, 'success');
      setTitle(''); setCaption(''); setFiles([]);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      console.error(err);
      addToast('Could not create the post. Please try again.', 'error');
    } finally { setCreating(false); }
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
    try {
      await addImagesToAlbum(post.id, picked, post.images);
      addToast(`${picked.length} photo(s) added.`, 'success');
      inputEl.value = '';
      load();
    } catch {
      addToast('Could not add photos.', 'error');
    } finally { setBusyId(null); }
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
            <label>Photos {files.length > 0 && <span className={styles.helpText}>— {files.length} selected</span>}</label>
            <label className={`btn btn-secondary btn-sm ${styles.uploadBtn}`} style={{ alignSelf: 'flex-start' }}>
              {files.length > 0 ? 'Choose different images' : 'Choose images'}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                ref={fileRef}
                onChange={(e) => setFiles(Array.from(e.target.files))}
                disabled={creating}
              />
            </label>
            {previews.length > 0 && (
              <div className={styles.thumbStrip}>
                {previews.map((src, idx) => (
                  <div key={src} className={styles.thumb}>
                    <img src={src} alt={files[idx]?.name || `Selected ${idx + 1}`} />
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
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? '⏳ Creating…' : 'Create Post'}
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

                  <div className={styles.postActions}>
                    <label className={`btn btn-secondary btn-sm ${styles.uploadBtn}`}>
                      + Add photos
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
