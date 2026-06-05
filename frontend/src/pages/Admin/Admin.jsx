import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminServices from './AdminServices.jsx';
import AdminGallery from './AdminGallery.jsx';
import AdminBio from './AdminBio.jsx';
import AdminMessages from './AdminMessages.jsx';
import styles from './Admin.module.css';

const TABS = [
  { id: 'services', label: '🐾 Services' },
  { id: 'gallery',  label: '📸 Gallery' },
  { id: 'bio',      label: '👤 Bio' },
  { id: 'messages', label: '💬 Messages' },
];

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('services');

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.adminHeader}>
          <div className={styles.adminAvatar}>{user?.photoURL ? <img src={user.photoURL} alt="Admin" /> : '🐾'}</div>
          <div>
            <strong>Admin Panel</strong>
            <p>{user?.displayName || user?.email}</p>
          </div>
        </div>
        <nav className={styles.nav}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              className={`${styles.tabBtn} ${tab === id ? styles.active : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <main className={styles.content}>
        {tab === 'services'  && <AdminServices />}
        {tab === 'gallery'   && <AdminGallery />}
        {tab === 'bio'       && <AdminBio />}
        {tab === 'messages'  && <AdminMessages />}
      </main>
    </div>
  );
}
