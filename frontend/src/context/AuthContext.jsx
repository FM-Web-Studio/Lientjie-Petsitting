import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/app.js';
import { isListedAdmin } from '../firebase/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Same test as isAdmin() in firestore.rules: a verified email listed in settings/admins.
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAdmin(u?.email && u.emailVerified ? await isListedAdmin(u.email) : false);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
