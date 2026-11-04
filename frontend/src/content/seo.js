// The title, description and link preview for every page.
// vite.config.js writes one HTML file per page from this list, so WhatsApp, Facebook
// and search engines see the right preview without running the app.
// usePageMeta keeps the same title and canonical link after in-app navigation.

// The address search engines should credit. The same pages are also served on
// lientjie-petsitting.firebaseapp.com, and the canonical link keeps them from counting twice.
export const SITE_URL = 'https://lientjie-petsitting.web.app';
export const SITE_NAME = "Lientjie's Petsitting";
const HOME_TITLE = `${SITE_NAME} | Pet care in Pretoria`;

// Hosting caches images for a year, so a changed preview image needs a NEW file name.
export const SHARE_IMAGE = '/og/share.jpg';
export const SHARE_ALT = "The Lientjie's Pawradise paw logo beside the words Lientjie's Petsitting, pet sitting, walking and care in Pretoria";

export const titleFor = (title) => (title ? `${title} | ${SITE_NAME}` : HOME_TITLE);

export const PAGE_META = [
  {
    path: '/',
    file: 'index.html',
    title: HOME_TITLE,
    description: "Lientjie's Petsitting: loving, reliable pet sitting, walking and care in Pretoria.",
  },
  {
    path: '/services',
    file: 'services.html',
    title: titleFor('Services'),
    description: 'Pet sitting, walking and other care services in Pretoria, with what each includes.',
  },
  {
    path: '/gallery',
    file: 'gallery.html',
    title: titleFor('Gallery'),
    description: "Photos of the pets in Lientjie's care.",
  },
  {
    path: '/reviews',
    file: 'reviews.html',
    title: titleFor('Reviews'),
    description: "What pet owners say about Lientjie's Petsitting, and a place to leave your own review.",
  },
  {
    path: '/about',
    file: 'about.html',
    title: titleFor('About'),
    description: 'Meet Lientjie, the person who looks after your pets.',
  },
  {
    path: '/contact',
    file: 'contact.html',
    title: titleFor('Contact'),
    description: 'Ask about pet sitting, walking or care in Pretoria.',
  },
  {
    path: '/privacy',
    file: 'privacy.html',
    title: titleFor('Privacy policy'),
    description: 'What this site collects, why, how long it is kept, and your rights under POPIA and the GDPR.',
  },
  {
    path: '/terms',
    file: 'terms.html',
    title: titleFor('Terms of use'),
    description: 'The terms for using this site and for the reviews and comments on it.',
  },
];

// Pages that must never be indexed. They still get their own file so the noindex is in the HTML.
export const PRIVATE_META = [
  { path: '/admin', file: 'admin.html', title: titleFor('Admin'), noindex: true },
];

export const NOT_FOUND_META = { file: '404.html', title: titleFor('Page not found'), noindex: true };

export const absoluteUrl = (path) => new URL(path, SITE_URL).href;

export const PERSON_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: SITE_NAME,
  url: SITE_URL,
  image: absoluteUrl(SHARE_IMAGE),
  address: { '@type': 'PostalAddress', addressLocality: 'Pretoria', addressCountry: 'ZA' },
};
