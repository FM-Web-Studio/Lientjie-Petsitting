import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <span className={styles.paw}>🐾</span>
        <h1>404</h1>
        <h2>Oops! This page ran away!</h2>
        <p>Looks like this page took itself for a walk and got lost. Let's get you back on track!</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}
