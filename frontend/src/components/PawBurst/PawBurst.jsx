import { useEffect } from 'react';
import styles from './PawBurst.module.css';

const PAWS = ['🐾', '🐾', '🦴', '💛', '🐾'];
// Typing, choosing and dragging should never sprout paws.
const SKIP = 'input, textarea, select, label, [contenteditable], [role="dialog"], [data-no-burst]';

/*
 * A little spray of paw prints wherever a visitor clicks or taps. Purely for
 * fun: it draws into a fixed layer that ignores the pointer, never blocks the
 * click it decorates, and does nothing for anyone who prefers reduced motion.
 */
export default function PawBurst() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const layer = document.createElement('div');
    layer.className = styles.layer;
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    const onDown = (e) => {
      if (e.button !== 0 || e.target.closest?.(SKIP)) return;
      const count = e.target.closest?.('a, button') ? 6 : 4;
      for (let i = 0; i < count; i += 1) {
        const paw = document.createElement('span');
        paw.className = styles.paw;
        paw.textContent = PAWS[Math.floor(Math.random() * PAWS.length)];
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const dist = 34 + Math.random() * 30;
        paw.style.left = `${e.clientX}px`;
        paw.style.top = `${e.clientY}px`;
        paw.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        paw.style.setProperty('--dy', `${Math.sin(angle) * dist - 12}px`);
        paw.style.setProperty('--rot', `${Math.random() * 80 - 40}deg`);
        layer.appendChild(paw);
        paw.addEventListener('animationend', () => paw.remove(), { once: true });
      }
    };

    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onDown);
      layer.remove();
    };
  }, []);

  return null;
}
