import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './app.js';

/*
 * Editable site copy + contact details live in ONE document in the shared
 * `settings` collection. The `petsitting_` doc-id prefix keeps it namespaced
 * from the portfolio app that shares this Firebase project.
 *
 *   settings/petsitting_content → { brand:{…}, home:{…}, …, contact:{…} }
 *
 * No firestore.rules change is needed: `settings/{docId}` already allows public
 * read and admin-only write (same pattern as gallery categories).
 */
const CONTENT_DOC_ID = 'petsitting_content';
const contentRef = () => doc(db, 'settings', CONTENT_DOC_ID);

/** The saved overrides object (only values that differ from code defaults). */
export async function getContent() {
  try {
    const snap = await getDoc(contentRef());
    return snap.exists() ? snap.data() : {};
  } catch (err) {
    console.error('Failed to load site content, using defaults:', err);
    return {};
  }
}

/**
 * Replace the overrides for a single group, e.g. saveContentGroup('home', {…}).
 * updateDoc sets the whole `group` field to the given object (replacing it), so a
 * cleared field is actually removed and falls back to its code default - while
 * sibling groups in the document are left untouched. Falls back to creating the
 * document if it doesn't exist yet.
 */
export async function saveContentGroup(group, overrides) {
  const ref = contentRef();
  try {
    await updateDoc(ref, { [group]: overrides });
  } catch {
    await setDoc(ref, { [group]: overrides }, { merge: true });
  }
}
