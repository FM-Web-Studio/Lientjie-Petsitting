import { useEffect, useRef, useState } from 'react';

const reduced = () => typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/*
 * Counts a number up from zero the first time it scrolls into view.
 * Anything that is not a plain number ("100%", "5 years", "∞") is shown as
 * it is, so it is safe to use on editable text. Screen readers always get the
 * final value.
 *
 *   <CountUp value={4.9} decimals={1} />
 */
export default function CountUp({ value, decimals = 0, duration = 1200 }) {
  const ref = useRef(null);
  const match = String(value).match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  const target = match ? Number(match[2]) : null;
  const places = match && match[2].includes('.') ? match[2].split('.')[1].length : decimals;
  const [shown, setShown] = useState(target === null || reduced() ? target : 0);

  useEffect(() => {
    if (target === null || reduced() || !ref.current) { setShown(target); return undefined; }
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - (1 - p) ** 3;
        setShown(target * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, duration]);

  if (target === null) return <span>{value}</span>;
  return (
    <span ref={ref}>
      <span aria-hidden="true">{match[1]}{Number(shown).toFixed(places)}{match[3]}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
