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

export const GALLERY_CATEGORIES = ['All', 'Dogs', 'Cats', 'Other Pets', 'Happy Moments'];

export const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Guinea Pig', 'Other'];

export const ADMIN_EMAILS = (import.meta.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);
