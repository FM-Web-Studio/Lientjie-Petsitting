import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_URL, titleFor, PAGE_META } from '../content/seo.js';

const headTag = (selector, create) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
};

// The build writes each page's head (see content/seo.js); this keeps the title,
// description and canonical link right after moving between pages in the app.
export default function usePageMeta({ title, noindex = false } = {}) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titleFor(title);
    const description = PAGE_META.find((p) => p.path === pathname)?.description;
    if (description) {
      headTag('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' })).content = description;
    }

    if (!noindex) {
      const canonical = headTag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }));
      canonical.href = SITE_URL + pathname;
      return undefined;
    }

    document.head.querySelector('link[rel="canonical"]')?.remove();
    const robots = headTag('meta[name="robots"]', () => Object.assign(document.createElement('meta'), { name: 'robots' }));
    robots.content = 'noindex';
    return () => robots.remove();
  }, [title, noindex, pathname]);
}
