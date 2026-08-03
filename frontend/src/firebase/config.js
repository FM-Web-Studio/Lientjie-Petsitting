export const COLLECTIONS = {
  services: 'petsitting_services',
  albums: 'petsitting_albums',
  messages: 'petsitting_messages',
  bio: 'petsitting_bio',
  reviews: 'petsitting_reviews',
};

// Comments live in a subcollection of each review. The name is namespaced (not
// just `comments`) because collection-group queries span the whole shared
// Firebase project - a plain `comments` group would collide with the portfolio.
export const REVIEW_COMMENTS = 'petsitting_review_comments';

export const BIO_DOC = 'main';

export const STORAGE_PREFIX = 'petsitting';

export const SERVICE_CATEGORIES = ['Walking', 'Sitting', 'Grooming', 'Transport', 'Other'];

// 'All' is a virtual filter on the public gallery - not a real, editable category.
export const GALLERY_ALL = 'All';

// Defensive fallback: used only if the admin-managed category doc can't be read
// (missing, offline, or a transient error). Real categories are edited in the
// admin UI and stored in Firestore - not here.
export const DEFAULT_GALLERY_CATEGORIES = ['Dogs', 'Cats', 'Other Pets', 'Happy Moments'];

export const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Guinea Pig', 'Other'];

// ── Reviews ─────────────────────────────────────────────────────────────────
// Kept in sync with the length checks in firestore.rules - the form should stop
// people before the server does, but the server is what actually enforces it.
export const REVIEW_LIMITS = {
  authorName: { min: 2, max: 60 },
  title: { max: 100 },
  body: { min: 10, max: 2000 },
  petName: { max: 60 },
  comment: { min: 2, max: 700 },
};

export const REVIEW_SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'highest', label: 'Highest rated' },
  { key: 'lowest', label: 'Lowest rated' },
  { key: 'liked', label: 'Most liked' },
];

export const ADMIN_EMAILS = (import.meta.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);
