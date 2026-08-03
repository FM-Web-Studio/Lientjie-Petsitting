import { Link } from 'react-router-dom';
import { albumCover } from '../../firebase/gallery.js';
import Skeleton from '../Skeleton/Skeleton.jsx';
import styles from './GalleryTile.module.css';

/*
 * One gallery post (an album of photos sharing a caption).
 *
 *   preview - the Home page grid: square crop, caption revealed on hover, the
 *             whole tile is a link through to /gallery.
 *   full    - the Gallery page: photo-count and category badges, caption block
 *             beneath the image, opens the lightbox on click.
 *
 * The shared part is the bit that kept getting fixed in one place only: picking
 * the cover image, and the caption fallback for an untitled post.
 */

const CAPTION_FALLBACK = 'A little moment of care 🐾';

export default function GalleryTile({ album, variant = 'full', to, onClick }) {
  const preview = variant === 'preview';
  const cover = albumCover(album);
  const label = album.caption || album.title || 'View post';

  const inner = (
    <>
      <span className={styles.media}>
        <img src={cover?.url} alt={album.caption || 'Pet photo'} loading="lazy" />

        {!preview && album.images.length > 1 && (
          <span className={styles.multiBadge} aria-label={`${album.images.length} photos`}>
            ▦ {album.images.length}
          </span>
        )}
        {!preview && album.category && (
          <span className={styles.categoryChip}>{album.category}</span>
        )}

        {preview && album.caption && (
          <span className={styles.overlay}><span>{album.caption}</span></span>
        )}
      </span>

      {!preview && (
        <span className={styles.caption}>
          {album.title && <span className={styles.captionTitle}>{album.title}</span>}
          {(album.caption || !album.title) && (
            <span className={`${styles.captionText} ${album.title ? '' : styles.solo}`}>
              {album.caption || CAPTION_FALLBACK}
            </span>
          )}
        </span>
      )}
    </>
  );

  const className = `${styles.tile} ${preview ? styles.preview : ''}`;

  // A tile that navigates is a link; one that opens the lightbox in place is a
  // button. Getting this wrong costs keyboard users the whole gallery.
  if (to) {
    return <Link to={to} className={className} aria-label={label}>{inner}</Link>;
  }
  return (
    <button type="button" className={className} onClick={onClick} aria-label={label}>
      {inner}
    </button>
  );
}

/** Placeholder matching the tile's shape. */
export function GalleryTileSkeleton({ variant = 'full' }) {
  const preview = variant === 'preview';
  return (
    <div className={`${styles.tile} ${preview ? styles.preview : ''} ${styles.static}`} aria-hidden="true">
      <span className={styles.media}>
        <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0 }} />
      </span>
      {!preview && (
        <span className={styles.caption}>
          <Skeleton style={{ width: '70%', height: '0.95rem' }} />
          <Skeleton style={{ width: '90%', height: '0.9rem' }} />
        </span>
      )}
    </div>
  );
}
