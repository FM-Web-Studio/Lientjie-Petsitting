import { useEffect, useRef, useState } from 'react';

/*
 * Fades and lifts its children in the first time they scroll into view.
 *
 * Content is never hidden from anyone who cannot see the animation: without
 * IntersectionObserver it renders visible straight away, and the reduced-motion
 * rule in globals.css shows .reveal immediately.
 *
 *   <Reveal delay={120}>…</Reveal>
 *   <Reveal as="li">…</Reveal>
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ ...style, '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
