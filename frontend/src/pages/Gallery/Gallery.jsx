import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { GALLERY_ALL } from '../../firebase/config.js';
import GalleryTile, { GalleryTileSkeleton } from '../../components/GalleryTile';
import Lightbox from '../../components/Lightbox';
import styles from './Gallery.module.css';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function Gallery() {
  usePageMeta({ title: 'Gallery' });
  const { albums, galleryCategories, loading, errors } = useData();
  const { copy } = useContent();
  const t = copy('gallery');
  const error = errors.albums;

  const [activeCategory, setActiveCategory] = useState(GALLERY_ALL);

  // Which post is open, and which image within it.
  const [openPost, setOpenPost] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);

  const filtered = useMemo(
    () => (activeCategory === GALLERY_ALL ? albums : albums.filter((a) => a.category === activeCategory)),
    [albums, activeCategory],
  );

  const openLightbox = (post) => { setOpenPost(post); setImgIndex(0); };
  const closeLightbox = () => setOpenPost(null);

  // Wrap around at both ends, so the arrows are always available - a post always
  // opens on image 0, and a "previous" that disappears there reads as broken.
  const total = openPost?.images.length ?? 0;
  const prevImage = total > 1 ? () => setImgIndex((i) => (i - 1 + total) % total) : null;
  const nextImage = total > 1 ? () => setImgIndex((i) => (i + 1) % total) : null;

  const lightboxImage = openPost
    ? { ...openPost.images[imgIndex], caption: openPost.caption }
    : null;

  return (
    <div>
      <header className={`page-header ${styles.pageHeader}`}>
        <div className="container">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroSubtitle}</p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className={styles.filters}>
            {[GALLERY_ALL, ...galleryCategories].map((cat) => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && (
            <div className={styles.grid}>
              {[...Array(6)].map((_, i) => <GalleryTileSkeleton key={i} />)}
            </div>
          )}

          {!loading && error && (
            <div className={styles.empty}>
              <p>⚠️ {error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className={styles.empty}>
              <p>🐾 No photos here yet - check back soon!</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className={styles.grid}>
              {filtered.map((post) => (
                <GalleryTile key={post.id} album={post} onClick={() => openLightbox(post)} />
              ))}
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
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </div>
  );
}
