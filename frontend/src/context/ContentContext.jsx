import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { getContent } from '../firebase/content.js';
import { GROUP_FIELDS, resolveGroup } from '../content/siteCopy.js';

const ContentContext = createContext(null);

/**
 * Loads the editable site-copy / contact document once and shares it with every
 * page. `copy(group)` returns the resolved strings for a page (defaults overlaid
 * with any admin edits), so pages never render blank while the doc loads.
 */
export function ContentProvider({ children }) {
  const [content, setContent] = useState({});
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const data = await getContent();
    setContent(data || {});
    setLoaded(true);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const copy = useCallback(
    (group) => resolveGroup(GROUP_FIELDS[group] || [], content?.[group]),
    [content],
  );

  const value = useMemo(() => ({ content, copy, loaded, reload }), [content, copy, loaded, reload]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside ContentProvider');
  return ctx;
}
