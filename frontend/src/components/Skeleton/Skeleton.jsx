import styles from './Skeleton.module.css';

export default function Skeleton({ className = '', style = {}, circle = false }) {
  return (
    <span
      className={`${styles.base} ${circle ? styles.circle : ''} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
