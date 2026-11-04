import { useRef, useState } from 'react';
import styles from './Draggable.module.css';

/*
 * Something you can pick up and throw around, which bounces back home when you
 * let go - for the playful stickers on the home page.
 *
 * Works with mouse and touch. A drag swallows the click that ends it, so a
 * sticker that is also a link only opens when it was tapped, not thrown.
 * touch-action: none on the element stops the page scrolling while you drag it.
 */
export default function Draggable({ as: Tag = 'span', className = '', children, ...rest }) {
  const ref = useRef(null);
  const start = useRef(null);
  const moved = useRef(false);
  const [held, setHeld] = useState(false);

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    moved.current = false;
  };

  const onPointerMove = (e) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!moved.current && Math.hypot(dx, dy) > 6) {
      moved.current = true;
      setHeld(true);
      ref.current.setPointerCapture(s.id);
    }
    if (moved.current) {
      const tilt = Math.max(-25, Math.min(25, dx / 6));
      ref.current.style.transform = `translate(${dx}px, ${dy}px) rotate(${tilt}deg) scale(1.12)`;
    }
  };

  const release = () => {
    if (!start.current) return;
    start.current = null;
    setHeld(false);
    if (ref.current) ref.current.style.transform = '';
  };

  const onClickCapture = (e) => {
    if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; }
  };

  return (
    <Tag
      ref={ref}
      className={`${styles.drag} ${held ? styles.held : ''} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
