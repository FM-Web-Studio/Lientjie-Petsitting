import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { GALLERY_ALL } from '../../firebase/config.js';
import GalleryTile, { GalleryTileSkeleton } from '../../components/GalleryTile';
import Lightbox from '../../components/Lightbox';
import PageHero from '../../components/PageHero';
import Reveal from '../../components/Reveal';
import Tilt from '../../components/Tilt';
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

  const counts = useMemo(() => {
    const c = { [GALLERY_ALL]: albums.length };
    for (const a of albums) c[a.category] = (c[a.category] || 0) + 1;
    return c;
  }, [albums]);

  // Empty categories are left out, so no filter leads to a blank page.
  const categories = [GALLERY_ALL, ...galleryCategories.filter((c) => counts[c])];

  const filtered = useMemo(
    () => (activeCategory === GALLERY_ALL ? albums : albums.filter((a) => a.category === activeCategory)),
    [albums, activeCategory],
  );

  const openLightbox = (post) => { setOpenPost(post); setImgIndex(0); };
  const closeLightbox = () => setOpenPost(null);

  // Wrap around at both ends, so the arrows are always available.
  const total = openPost?.images.length ?? 0;
  const prevImage = total > 1 ? () => setImgIndex((i) => (i - 1 + total) % total) : null;
  const nextImage = total > 1 ? () => setImgIndex((i) => (i + 1) % total) : null;

  const lightboxImage = openPost
    ? { ...openPost.images[imgIndex], caption: openPost.caption }
    : null;

  const photoCount = albums.reduce((n, a) => n + a.images.length, 0);

  return (
    <div>
      <PageHero title={t.heroTitle} subtitle={t.heroSubtitle} emoji="📸" tone="purple">
        {!loading && photoCount > 0 && (
          <span className={styles.heroChip}>{photoCount} photo{photoCount === 1 ? '' : 's'} of very good pets</span>
        )}
      </PageHero>

      <section className="section-tight">
        <div className="container">
          {categories.length > 2 && (
            <div className={styles.filters} role="group" aria-label="Filter photos">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={activeCategory === cat}
                >
                  {cat}
                  <span className={styles.count}>{counts[cat] || 0}</span>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className={styles.grid}>
              {[...Array(6)].map((_, i) => <GalleryTileSkeleton key={i} />)}
            </div>
          )}

          {!loading && error && <p className={styles.empty}>⚠️ {error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <p className={styles.empty}>🐾 No photos here yet - check back soon!</p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className={styles.grid} key={activeCategory}>
              {filtered.map((post, i) => (
                <Reveal key={post.id} delay={(i % 3) * 80} className={styles.cell}>
                  <Tilt max={9}><GalleryTile album={post} onClick={() => openLightbox(post)} /></Tilt>
                </Reveal>
              ))}
            </div>
          )}

          {!loading && albums.length > 0 && (
            <Reveal className={styles.nudge}>
              <p>Want your pet to be the next star? 🌟</p>
              <Link to="/contact" className="btn btn-primary">Book a sit 🐾</Link>
            </Reveal>
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
