export const COLLECTIONS = {
  services: 'petsitting_services',
  gallery: 'petsitting_gallery',
  albums: 'petsitting_albums',
  messages: 'petsitting_messages',
  bio: 'petsitting_bio',
};

export const BIO_DOC = 'main';

export const STORAGE_PREFIX = 'petsitting';

export const SERVICE_CATEGORIES = ['Walking', 'Sitting', 'Grooming', 'Transport', 'Other'];

// 'All' is a virtual filter on the public gallery — not a real, editable category.
export const GALLERY_ALL = 'All';

// Defensive fallback: used only if the admin-managed category doc can't be read
// (missing, offline, or a transient error). Real categories are edited in the
// admin UI and stored in Firestore — not here.
export const DEFAULT_GALLERY_CATEGORIES = ['Dogs', 'Cats', 'Other Pets', 'Happy Moments'];

export const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Guinea Pig', 'Other'];

export const ADMIN_EMAILS = (import.meta.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);
