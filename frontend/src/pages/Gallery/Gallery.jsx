import { useState, useEffect } from 'react';
import { getGalleryImages } from '../../firebase/gallery.js';
import { GALLERY_CATEGORIES } from '../../firebase/config.js';
import Lightbox from '../../components/Lightbox/Lightbox.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import styles from './Gallery.module.css';

function GallerySkeleton() {
  return (
    <div className={styles.grid}>
      {[...Array(9)].map((_, i) => (
        <div key={i} className={styles.item} style={{ pointerEvents: 'none' }}>
          <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        </div>
      ))}
    </div>
  );
}

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGalleryImages(true)
      .then((imgs) => { setImages(imgs); setFiltered(imgs); })
      .catch((err) => { console.error('Gallery load failed:', err); setError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFiltered(activeCategory === 'All' ? images : images.filter((i) => i.category === activeCategory));
  }, [activeCategory, images]);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const lightboxImage = lightboxIndex !== null ? filtered[lightboxIndex] : null;

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
            {GALLERY_CATEGORIES.map((cat) => (
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
              {filtered.map((img, idx) => (
                <button
                  key={img.id}
                  className={styles.item}
                  onClick={() => openLightbox(idx)}
                  aria-label={img.caption || 'View photo'}
                >
                  <img src={img.url} alt={img.caption || 'Pet photo'} loading="lazy" />
                  {img.category && (
                    <span className={styles.categoryChip}>{img.category}</span>
                  )}
                  {img.caption && (
                    <div className={styles.overlay}>
                      <span>{img.caption}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {lightboxImage && (
        <Lightbox
          image={lightboxImage}
          onClose={closeLightbox}
          onPrev={lightboxIndex > 0 ? () => setLightboxIndex((i) => i - 1) : null}
          onNext={lightboxIndex < filtered.length - 1 ? () => setLightboxIndex((i) => i + 1) : null}
        />
      )}
    </div>
  );
}
