/**
 * Editable site copy for Lientjie's Petsitting.
 *
 * Every visitor-facing heading / paragraph / label that used to be hardcoded in
 * a page now lives here as a field with a `default`. The default is the exact
 * string the page shipped with, so the site renders identically until an admin
 * edits it. Only values that differ from the default are stored in Firestore
 * (settings/petsitting_content) - code stays the single source of truth for
 * anything untouched.
 *
 * `resolveGroup(fields, overrides)` overlays saved overrides onto the defaults.
 */

// ── Brand / footer ──────────────────────────────────────────────────────────
const BRAND_FIELDS = [
  { key: 'brandName',     label: 'Brand name',      type: 'text',     default: "Lientjie's Petsitting" },
  { key: 'footerTagline', label: 'Footer tagline',  type: 'textarea', default: 'Professional, loving care for your furry family members.' },
  { key: 'footerNote',    label: 'Footer note',     type: 'text',     default: 'Made with 💛' },
];

// ── Home page ───────────────────────────────────────────────────────────────
const HOME_FIELDS = [
  { key: 'heroTag',          label: 'Hero - tag',            type: 'text',     default: 'Professional Pet Care in Pretoria 🌟' },
  { key: 'heroTitle',        label: 'Hero - title',          type: 'text',     default: "Your Pet's Home Away From Home!" },
  { key: 'heroSub',          label: 'Hero - subtitle',       type: 'textarea', default: "Loving, professional care for your furry, feathery & scaly family members. Because they deserve the best while you're away." },
  { key: 'heroBtnPrimary',   label: 'Hero - primary button', type: 'text',     default: 'View Services' },
  { key: 'heroBtnSecondary', label: 'Hero - second button',  type: 'text',     default: 'Book a Session' },
  { key: 'badge1',           label: 'Hero - badge 1',        type: 'text',     default: '🐕 Dog Walking' },
  { key: 'badge2',           label: 'Hero - badge 2',        type: 'text',     default: '🏠 Pet Sitting' },
  { key: 'badge3',           label: 'Hero - badge 3',        type: 'text',     default: '🌙 Overnight Stays' },
  { key: 'badge4',           label: 'Hero - badge 4',        type: 'text',     default: '🛁 Grooming' },

  { key: 'servicesTitle',    label: 'Services - title',      type: 'text',     default: 'What I Offer 🐾' },
  { key: 'servicesSubtitle', label: 'Services - subtitle',   type: 'text',     default: 'Tailored care for every kind of pet' },
  { key: 'servicesCta',      label: 'Services - button',     type: 'text',     default: 'See All Services' },

  { key: 'stepsTitle',       label: 'How it works - title',  type: 'text',     default: 'How it works' },
  { key: 'step1Title',       label: 'Step 1 - title',        type: 'text',     default: 'Say hello' },
  { key: 'step1Text',        label: 'Step 1 - text',         type: 'textarea', default: 'Send me a message with your dates and a little about your pet.' },
  { key: 'step2Title',       label: 'Step 2 - title',        type: 'text',     default: 'Meet & greet' },
  { key: 'step2Text',        label: 'Step 2 - text',         type: 'textarea', default: "We meet so your pet gets to know me, and I learn their routine, quirks and favourite treats." },
  { key: 'step3Title',       label: 'Step 3 - title',        type: 'text',     default: 'Relax, they’re in good paws' },
  { key: 'step3Text',        label: 'Step 3 - text',         type: 'textarea', default: 'You get photos and updates while you are away, and a happy pet when you get home.' },

  { key: 'bioTag',           label: 'Bio - tag',             type: 'text',     default: 'Meet your petsitter' },
  { key: 'bioCta',           label: 'Bio - button',          type: 'text',     default: 'Read My Story' },

  { key: 'galleryTitle',     label: 'Gallery - title',       type: 'text',     default: 'Happy Pets 📸' },
  { key: 'gallerySubtitle',  label: 'Gallery - subtitle',    type: 'text',     default: 'Wholesome moments from my care sessions' },
  { key: 'galleryCta',       label: 'Gallery - button',      type: 'text',     default: 'See All Photos' },

  { key: 'reviewsTitle',     label: 'Reviews - title',       type: 'text',     default: 'Kind Words 💛' },
  { key: 'reviewsSubtitle',  label: 'Reviews - subtitle',    type: 'text',     default: 'What pet parents say after trusting me with their family' },
  { key: 'reviewsCta',       label: 'Reviews - button',      type: 'text',     default: 'Read All Reviews' },

  { key: 'ctaTitle',         label: 'CTA banner - title',    type: 'text',     default: "Ready to book? Let's chat! 🐾" },
  { key: 'ctaText',          label: 'CTA banner - text',     type: 'text',     default: 'Your pet will be in the safest, most loving hands.' },
  { key: 'ctaBtn',           label: 'CTA banner - button',   type: 'text',     default: 'Get in Touch' },
];

// ── Services page ───────────────────────────────────────────────────────────
const SERVICES_FIELDS = [
  { key: 'heroTitle',    label: 'Hero - title',       type: 'text',     default: 'My Services 🐾' },
  { key: 'heroSubtitle', label: 'Hero - subtitle',    type: 'text',     default: "Professional, loving care tailored to your pet's needs" },
  { key: 'bookBtn',      label: 'Card - book button', type: 'text',     default: 'Book Now' },
  { key: 'customTitle',  label: 'Custom - title',     type: 'text',     default: 'Need something custom?' },
  { key: 'customText',   label: 'Custom - text',      type: 'textarea', default: "Every pet is unique! Get in touch to discuss your specific needs and we'll find the perfect solution." },
  { key: 'faqTitle',     label: 'FAQ - title',        type: 'text',     default: 'Good questions 🤔' },
  { key: 'faq1Q', label: 'FAQ 1 - question', type: 'text',     default: 'Do we meet before the first booking?' },
  { key: 'faq1A', label: 'FAQ 1 - answer',   type: 'textarea', default: 'Yes. A meet & greet lets your pet get to know me, and lets me learn their routine before you go away.' },
  { key: 'faq2Q', label: 'FAQ 2 - question', type: 'text',     default: 'Will I get updates while I am away?' },
  { key: 'faq2A', label: 'FAQ 2 - answer',   type: 'textarea', default: 'Always. I send photos and messages during every visit so you can see how they are doing.' },
  { key: 'faq3Q', label: 'FAQ 3 - question', type: 'text',     default: 'What should I leave for my pet?' },
  { key: 'faq3A', label: 'FAQ 3 - answer',   type: 'textarea', default: "Their food, treats, lead and bedding, any medication with written instructions, and your vet's details. We go through it all together beforehand." },
  { key: 'faq4Q', label: 'FAQ 4 - question', type: 'text',     default: 'Which areas do you cover?' },
  { key: 'faq4A', label: 'FAQ 4 - answer',   type: 'textarea', default: 'I work across Pretoria. If you are a little further out, send me a message and we can work something out.' },
];

// ── Gallery page ────────────────────────────────────────────────────────────
const GALLERY_FIELDS = [
  { key: 'heroTitle',    label: 'Hero - title',    type: 'text', default: 'Our Happy Pets 📸' },
  { key: 'heroSubtitle', label: 'Hero - subtitle', type: 'text', default: 'Wholesome moments from every care session' },
];

// ── Reviews page ────────────────────────────────────────────────────────────
const REVIEWS_FIELDS = [
  { key: 'heroTitle',       label: 'Hero - title',        type: 'text',     default: 'Reviews ⭐' },
  { key: 'heroSubtitle',    label: 'Hero - subtitle',     type: 'text',     default: 'Honest words from the families whose pets I look after' },
  { key: 'writeBlurb',      label: 'Write - blurb',       type: 'text',     default: 'Had me look after your pet?' },
  { key: 'writeBtn',        label: 'Write - button',      type: 'text',     default: 'Write a Review' },
  { key: 'moderationNote',  label: 'Write - small print', type: 'textarea', default: 'Reviews are read before they go live, so yours may take a little while to appear.' },
  { key: 'formTitle',       label: 'Form - title',        type: 'text',     default: 'Share your experience' },
  { key: 'submitBtn',       label: 'Form - submit button', type: 'text',    default: 'Submit Review 🐾' },
  { key: 'privacyNote',     label: 'Form - privacy note', type: 'textarea', default: 'Your name and review are shown publicly. I never ask for your email or phone number here - if you need to reach me, use the contact page.' },
  { key: 'emptySummary',    label: 'Empty - summary',     type: 'text',     default: 'No reviews yet' },
  { key: 'emptyList',       label: 'Empty - list',        type: 'textarea', default: '🐾 No reviews just yet - be the first to share your experience!' },
];

// ── About / Bio page ────────────────────────────────────────────────────────
const ABOUT_FIELDS = [
  { key: 'heroTitle',    label: 'Hero - title',       type: 'text',     default: 'Meet Lientjie 🐾' },
  { key: 'heroSubtitle', label: 'Hero - subtitle',    type: 'text',     default: 'The person who will love your pet like her own' },
  { key: 'tag',          label: 'Tag',                type: 'text',     default: 'Your trusted petsitter' },
  { key: 'expLabel',     label: 'Stat - experience label', type: 'text', default: 'Experience' },
  { key: 'stat2Value',   label: 'Stat 2 - value',     type: 'text',     default: '100%' },
  { key: 'stat2Label',   label: 'Stat 2 - label',     type: 'text',     default: 'Love Given' },
  { key: 'stat3Value',   label: 'Stat 3 - value',     type: 'text',     default: '∞' },
  { key: 'stat3Label',   label: 'Stat 3 - label',     type: 'text',     default: 'Happy Pets' },
  { key: 'qualsTitle',   label: 'Qualifications title', type: 'text',    default: 'Qualifications & Certifications' },
  { key: 'ctaPrimary',   label: 'Button - primary',   type: 'text',     default: 'Book a Session' },
  { key: 'ctaSecondary', label: 'Button - secondary', type: 'text',     default: 'View Services' },

  { key: 'whyTitle',  label: 'Why - section title', type: 'text',     default: 'Why Choose Me? 💛' },
  { key: 'why1Icon',  label: 'Why 1 - icon',        type: 'text',     default: '❤️' },
  { key: 'why1Title', label: 'Why 1 - title',       type: 'text',     default: 'Genuine Love for Animals' },
  { key: 'why1Desc',  label: 'Why 1 - text',        type: 'textarea', default: 'Every pet in my care gets love, attention and cuddles – just like at home.' },
  { key: 'why2Icon',  label: 'Why 2 - icon',        type: 'text',     default: '📱' },
  { key: 'why2Title', label: 'Why 2 - title',       type: 'text',     default: 'Regular Updates' },
  { key: 'why2Desc',  label: 'Why 2 - text',        type: 'textarea', default: 'Photos and videos sent regularly so you can relax wherever you are.' },
  { key: 'why3Icon',  label: 'Why 3 - icon',        type: 'text',     default: '🏡' },
  { key: 'why3Title', label: 'Why 3 - title',       type: 'text',     default: 'Home Away From Home' },
  { key: 'why3Desc',  label: 'Why 3 - text',        type: 'textarea', default: 'A safe, comfortable and stimulating environment for your furry friend.' },
  { key: 'why4Icon',  label: 'Why 4 - icon',        type: 'text',     default: '🤝' },
  { key: 'why4Title', label: 'Why 4 - title',       type: 'text',     default: 'Trustworthy & Reliable' },
  { key: 'why4Desc',  label: 'Why 4 - text',        type: 'textarea', default: "Punctual, professional and always putting your pet's needs first." },
];

// ── Contact page copy ───────────────────────────────────────────────────────
const CONTACT_PAGE_FIELDS = [
  { key: 'heroTitle',    label: 'Hero - title',     type: 'text',     default: "Let's Chat! 💬" },
  { key: 'heroSubtitle', label: 'Hero - subtitle',  type: 'text',     default: "Fill in the form and I'll get back to you as soon as possible" },
  { key: 'formTitle',    label: 'Form - title',     type: 'text',     default: 'Send a Message' },
  { key: 'sendBtn',      label: 'Form - send button', type: 'text',   default: 'Send Message 🐾' },
  { key: 'promiseTitle', label: 'Promise - title',  type: 'text',     default: 'My Promise 💛' },
  { key: 'promiseText',  label: 'Promise - text',   type: 'textarea', default: "Your pet will be treated like family. I'll send regular updates and photos so you can relax knowing they're in great hands." },
];

// ── Contact details (shared source of truth) ────────────────────────────────
// Surfaced on the Contact page info cards, the About page, and the footer.
export const CONTACT_INFO_FIELDS = [
  { key: 'location',     label: 'Location',       type: 'text', default: 'Pretoria, South Africa' },
  { key: 'responseTime', label: 'Response time',  type: 'text', default: 'Within 24 hours' },
  { key: 'petsAccepted', label: 'Pets accepted',  type: 'text', default: 'Dogs, cats, birds, rabbits & more' },
  { key: 'phone',        label: 'Phone number',   type: 'text', default: '' },
  { key: 'email',        label: 'Email address',  type: 'text', default: '' },
  { key: 'whatsapp',     label: 'WhatsApp link',  type: 'text', default: '' },
  { key: 'instagram',    label: 'Instagram link', type: 'text', default: '' },
  { key: 'facebook',     label: 'Facebook link',  type: 'text', default: '' },
];

// The tabs shown in the admin "Site Copy" editor. `key` matches the group name
// pages read from the settings/petsitting_content document.
export const COPY_SCHEMA = [
  { key: 'brand',       label: 'Brand & Footer', fields: BRAND_FIELDS },
  { key: 'home',        label: 'Home',           fields: HOME_FIELDS },
  { key: 'services',    label: 'Services',       fields: SERVICES_FIELDS },
  { key: 'gallery',     label: 'Gallery',        fields: GALLERY_FIELDS },
  { key: 'reviews',     label: 'Reviews',        fields: REVIEWS_FIELDS },
  { key: 'about',       label: 'About',          fields: ABOUT_FIELDS },
  { key: 'contactPage', label: 'Contact page',   fields: CONTACT_PAGE_FIELDS },
];

// Every group's field list, keyed by group - used by pages to resolve copy.
export const GROUP_FIELDS = {
  brand:       BRAND_FIELDS,
  home:        HOME_FIELDS,
  services:    SERVICES_FIELDS,
  gallery:     GALLERY_FIELDS,
  reviews:     REVIEWS_FIELDS,
  about:       ABOUT_FIELDS,
  contactPage: CONTACT_PAGE_FIELDS,
  contact:     CONTACT_INFO_FIELDS,
};

/**
 * Overlay saved overrides onto the in-code defaults. An empty / whitespace-only
 * override falls back to the default so the page never renders blank.
 */
export const resolveGroup = (fields = [], overrides = {}) => {
  const out = {};
  for (const f of fields) {
    const ov = overrides?.[f.key];
    out[f.key] = (typeof ov === 'string' && ov.trim() !== '') ? ov : f.default;
  }
  return out;
};
