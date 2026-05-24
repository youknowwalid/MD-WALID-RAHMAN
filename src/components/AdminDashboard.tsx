import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { signInWithGoogle, logout } from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AdminShell } from './AdminShell';
import { AdminContentRouter } from './AdminContentRouter';
import { useSearchParams } from 'react-router-dom';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'projects';

  const checkAdminStatus = async (currentUser: User) => {
    try {
      const isSystemAdmin = currentUser.email?.toLowerCase() === 'walidxdxdxd@gmail.com';
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

      if (userDoc.exists()) {
        setIsAdmin(userDoc.data()?.isAdmin || isSystemAdmin);
      } else {
        setIsAdmin(isSystemAdmin);
      }
    } catch (error) {
      console.error('Admin check error:', error);
      setIsAdmin(currentUser.email?.toLowerCase() === 'walidxdxdxd@gmail.com');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkAdminStatus(currentUser);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        setTimeout(async () => {
          await checkAdminStatus(loggedInUser);
        }, 500);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Failed to sign in');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card p-10 rounded-3xl border border-white/5 text-center max-w-md w-full"
        >
          <LayoutDashboard className="w-16 h-16 text-accent mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-4">Admin Access</h1>
          <p className="text-gray-400 mb-8">
            Please sign in with your authorized admin account.
          </p>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-accent text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign in with Google'
            )}
          </button>
          {authError && (
            <p className="mt-4 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
              {authError}
            </p>
          )}
          {!isAdmin && user && (
            <p className="mt-4 text-red-400 text-sm">
              Access denied. Your account does not have admin privileges.
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <AdminShell>
      <AdminContentRouter activeTab={activeTab} user={user} isAdmin={isAdmin} />
    </AdminShell>
  );
}
