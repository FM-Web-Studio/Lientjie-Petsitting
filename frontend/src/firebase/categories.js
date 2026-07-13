import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './app.js';
import { DEFAULT_GALLERY_CATEGORIES } from './config.js';

/*
 * Album categories are admin-editable, not hardcoded. They live in a single
 * document in the shared `settings` collection. The `petsitting_` doc-id prefix
 * keeps them namespaced away from the portfolio app that shares this project.
 *
 *   settings/petsitting_gallery_categories → { categories: ['Dogs', 'Cats', …] }
 *
 * No firestore.rules change is needed: `settings/{docId}` already allows public
 * read and admin-only write.
 */
const CATEGORIES_DOC_ID = 'petsitting_gallery_categories';
const categoriesRef = () => doc(db, 'settings', CATEGORIES_DOC_ID);

/** Trim, drop blanks, and de-duplicate (case-insensitive) while keeping order. */
function clean(categories) {
  const out = [];
  const seen = new Set();
  for (const c of categories) {
    const name = String(c).trim();
    const key = name.toLowerCase();
    if (name && !seen.has(key)) { seen.add(key); out.push(name); }
  }
  return out;
}

/** The admin-managed album categories, or sensible defaults if none saved yet. */
export async function getGalleryCategories() {
  try {
    const snap = await getDoc(categoriesRef());
    const list = snap.exists() ? snap.data().categories : null;
    if (Array.isArray(list) && list.length) return clean(list);
  } catch (err) {
    console.error('Failed to load gallery categories, using defaults:', err);
  }
  return [...DEFAULT_GALLERY_CATEGORIES];
}

/** Replace the album category list (admin only). Returns the cleaned list saved. */
export async function saveGalleryCategories(categories) {
  const cleaned = clean(categories);
  await setDoc(categoriesRef(), { categories: cleaned }, { merge: true });
  return cleaned;
}
