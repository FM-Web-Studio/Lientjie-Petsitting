import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getServices } from '../firebase/services.js';
import { getAlbums } from '../firebase/gallery.js';
import { getBio } from '../firebase/bio.js';
import { getGalleryCategories } from '../firebase/categories.js';
import { getApprovedReviews } from '../firebase/reviews.js';

/*
 * One load of the public site's Firestore data, shared by every page.
 *
 * Before this, each page fetched for itself: a visitor going Home → Services →
 * Contact read `petsitting_services` three separate times, and the bio twice.
 * Pages now read from here instead, so the whole public site costs one round of
 * reads per session.
 *
 * Each source settles independently - a broken gallery must not blank the
 * services list - so failures land in `errors` keyed by source, and every page
 * can still show its own error state.
 *
 * The admin panel deliberately does NOT use this: it needs inactive records too
 * (getServices(false), getAlbums(false)) and must re-read after every save. It
 * keeps its own fetches and calls `reload()` when the public data changes.
 */

const SOURCES = {
  services: () => getServices(true),
  // Only posts that actually carry images are renderable; both the Home preview
  // and the Gallery page filtered this out themselves before.
  albums: () => getAlbums(true).then((list) => list.filter((a) => a.images?.length)),
  bio: () => getBio(),
  galleryCategories: () => getGalleryCategories(),
  // Published reviews only. The Home testimonial strip and the Reviews page both
  // read these; comments are loaded by the Reviews page alone, since nothing
  // else needs them.
  reviews: () => getApprovedReviews(),
};

const EMPTY = { services: [], albums: [], bio: null, galleryCategories: [], reviews: [] };

/*
 * Raw Firebase errors are for the console, never for a visitor. A missing index
 * otherwise renders as "The query requires an index... console.firebase.google.com/…"
 * on the live site - internal detail, an unusable instruction, and it reads as a
 * broken website. Everything unrecognised falls through to the same neutral line.
 */
const friendlyError = (err) => {
  switch (err?.code) {
    case 'permission-denied':
      return 'This content is not available right now.';
    case 'failed-precondition':
      // Almost always a composite index still building after a deploy.
      return 'Just getting things ready - please try again in a minute.';
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Could not reach the server. Please check your connection and try again.';
    default:
      return 'Something went wrong loading this. Please try again shortly.';
  }
};

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  /*
   * Deliberately does not flip `loading` back to true. The first load starts in
   * the loading state and shows skeletons; every later refresh keeps the current
   * data on screen and swaps it out when the new data lands, so a background
   * refresh never blanks a page the visitor is already reading.
   */
  const reload = useCallback(async () => {
    const keys = Object.keys(SOURCES);
    const settled = await Promise.all(
      keys.map((k) => SOURCES[k]().then(
        (value) => ({ k, value }),
        (err) => {
          console.error(`Failed to load ${k}:`, err);
          return { k, error: friendlyError(err) };
        },
      )),
    );

    const nextData = { ...EMPTY };
    const nextErrors = {};
    for (const { k, value, error } of settled) {
      if (error) nextErrors[k] = error;
      else nextData[k] = value;
    }
    setData(nextData);
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(
    () => ({ ...data, loading, errors, reload }),
    [data, loading, errors, reload],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
