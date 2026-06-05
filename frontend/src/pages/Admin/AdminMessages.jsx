import { useState, useEffect } from 'react';
import { getMessages, markMessageRead, deleteMessage } from '../../firebase/contact.js';
import { useToast } from '../../context/ToastContext.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import styles from './Admin.module.css';

export default function AdminMessages() {
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const load = () => getMessages().then(setMessages).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const displayed = filter === 'unread' ? messages.filter((m) => !m.read) : messages;

  const toggleRead = async (msg) => {
    await markMessageRead(msg.id, !msg.read);
    load();
  };

  const remove = async (msg) => {
    if (!confirm('Delete this message?')) return;
    await deleteMessage(msg.id);
    addToast('Message deleted.', 'info');
    load();
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  const fmt = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Messages {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount} new</span>}</h2>
        <div className={styles.filters}>
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>All</button>
          <button className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('unread')}>Unread</button>
        </div>
      </div>

      <div className={styles.messageList}>
        {loading && [...Array(3)].map((_, i) => (
          <div key={i} className={styles.messageCard}>
            <div className={styles.msgHeader} style={{ cursor: 'default' }}>
              <div className={styles.msgMeta}>
                <Skeleton style={{ width: '120px', height: '1rem' }} />
                <Skeleton style={{ width: '180px', height: '0.85rem' }} />
                <Skeleton style={{ width: '80px', height: '1.5rem', borderRadius: 'var(--radius-full)' }} />
              </div>
              <Skeleton style={{ width: '100px', height: '0.8rem', flexShrink: 0 }} />
            </div>
          </div>
        ))}

        {!loading && displayed.length === 0 && (
          <p className={styles.empty}>No messages here!</p>
        )}

        {!loading && displayed.map((msg) => (
          <div key={msg.id} className={`${styles.messageCard} ${!msg.read ? styles.unread : ''}`}>
            <div className={styles.msgHeader} onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}>
              <div className={styles.msgMeta}>
                {!msg.read && <span className={styles.dot} />}
                <strong>{msg.name}</strong>
                <span className={styles.msgEmail}>{msg.email}</span>
                {msg.petName && <span className={styles.petChip}>🐾 {msg.petName} ({msg.petType})</span>}
                {msg.serviceInterest && <span className={styles.serviceChip}>{msg.serviceInterest}</span>}
              </div>
              <span className={styles.msgDate}>{fmt(msg.createdAt)}</span>
            </div>

            {expanded === msg.id && (
              <div className={styles.msgBody}>
                <p className={styles.msgText}>{msg.message}</p>
                {msg.phone && <p className={styles.msgPhone}>📞 {msg.phone}</p>}
                <div className={styles.msgActions}>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleRead(msg)}>
                    {msg.read ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  <a href={`mailto:${msg.email}`} className="btn btn-teal btn-sm">Reply by Email</a>
                  <button className={`btn btn-sm ${styles.deleteBtn}`} onClick={() => remove(msg)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
