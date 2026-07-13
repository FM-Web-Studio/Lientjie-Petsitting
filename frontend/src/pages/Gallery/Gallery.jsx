import { useState, useEffect } from 'react';
import { getAlbums, albumCover } from '../../firebase/gallery.js';
import { getGalleryCategories } from '../../firebase/categories.js';
import { GALLERY_ALL } from '../../firebase/config.js';
import Lightbox from '../../components/Lightbox/Lightbox.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import styles from './Gallery.module.css';

function GallerySkeleton() {
  return (
    <div className={styles.grid}>
      {[...Array(9)].map((_, i) => (
        <div key={i} className={styles.item} style={{ pointerEvents: 'none' }}>
          <div className={styles.media}>
            <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0 }} />
          </div>
          <div className={styles.caption}>
            <Skeleton style={{ width: '80%', height: '0.9rem' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(GALLERY_ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Which post is open, and which image within it.
  const [openPost, setOpenPost] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    getAlbums(true)
      .then((data) => {
        // Only show posts that actually contain images.
        const withImages = data.filter((a) => a.images?.length);
        setAlbums(withImages);
        setFiltered(withImages);
      })
      .catch((err) => { console.error('Gallery load failed:', err); setError(err.message); })
      .finally(() => setLoading(false));

    getGalleryCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setFiltered(activeCategory === 'All' ? albums : albums.filter((a) => a.category === activeCategory));
  }, [activeCategory, albums]);

  const openLightbox = (post) => { setOpenPost(post); setImgIndex(0); };
  const closeLightbox = () => setOpenPost(null);

  const lightboxImage = openPost
    ? { ...openPost.images[imgIndex], caption: openPost.caption }
    : null;

  return (
    <div>
      <section className={styles.hero}>
        <div className="container">
          <h1>Our Happy Pets 📸</h1>
          <p>Wholesome moments from every care session</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.filters}>
            {[GALLERY_ALL, ...categories].map((cat) => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && <GallerySkeleton />}

          {!loading && error && (
            <div className={styles.empty}>
              <p>⚠️ Could not load gallery: {error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className={styles.empty}>
              <p>🐾 No photos here yet — check back soon!</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className={styles.grid}>
              {filtered.map((post) => {
                const cover = albumCover(post);
                return (
                  <button
                    key={post.id}
                    className={styles.item}
                    onClick={() => openLightbox(post)}
                    aria-label={post.caption || post.title || 'View post'}
                  >
                    <div className={styles.media}>
                      <img src={cover?.url} alt={post.caption || 'Pet photo'} loading="lazy" />
                      {post.images.length > 1 && (
                        <span className={styles.multiBadge} aria-label={`${post.images.length} photos`}>
                          ▦ {post.images.length}
                        </span>
                      )}
                      {post.category && (
                        <span className={styles.categoryChip}>{post.category}</span>
                      )}
                    </div>
                    <div className={styles.caption}>
                      <span className={styles.captionText}>
                        {post.caption || post.title || 'A little moment of care 🐾'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {openPost && (
        <Lightbox
          image={lightboxImage}
          images={openPost.images}
          count={openPost.images.length}
          position={imgIndex + 1}
          onClose={closeLightbox}
          onPrev={imgIndex > 0 ? () => setImgIndex((i) => i - 1) : null}
          onNext={imgIndex < openPost.images.length - 1 ? () => setImgIndex((i) => i + 1) : null}
        />
      )}
    </div>
  );
}
