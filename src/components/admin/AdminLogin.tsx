import React, { useState } from 'react';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { sendMagicLink, signIn, signUp } from '../../lib/admin';
import { inputCls, labelCls } from './fields';

type Mode = 'signin' | 'signup' | 'link';

export default function AdminLogin() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        if (password.length < 10) throw new Error('Please choose a password with at least 10 characters.');
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) setNotice('Almost done! We sent a confirmation e-mail. Click the link inside it, then come back here and sign in.');
      } else {
        await sendMagicLink(email);
        setNotice('If that address belongs to the administrator, a sign-in link is on its way. Open it on this device.');
      }
    } catch (err: any) {
      setError(/invalid login/i.test(err.message) ? 'Incorrect e-mail or password.' : err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<Mode, string> = { signin: 'Sign in', signup: 'Create the admin account', link: 'Sign in with an e-mail link' };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6">
      <main className="bg-bg-card p-8 sm:p-10 rounded-3xl border border-white/5 max-w-md w-full">
        <LayoutDashboard className="w-14 h-14 text-accent mx-auto mb-6" aria-hidden="true" />
        <h1 className="text-3xl font-black mb-2 text-center">Admin Access</h1>
        <p className="text-text-muted text-sm text-center mb-8">{titles[mode]}</p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className={labelCls}>E-mail</label>
            <input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          {mode !== 'link' && (
            <div>
              <label htmlFor="admin-password" className={labelCls}>Password</label>
              <input id="admin-password" type="password" required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={mode === 'signup' ? 10 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
            </div>
          )}
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
          <button type="submit" disabled={busy} className="w-full bg-accent text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send me a link'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm text-center">
          {mode !== 'signin' && <button type="button" className="text-accent hover:underline" onClick={() => { setMode('signin'); setError(''); setNotice(''); }}>Back to sign in</button>}
          {mode === 'signin' && <button type="button" className="text-accent hover:underline" onClick={() => { setMode('link'); setError(''); setNotice(''); }}>Forgot your password? Get a sign-in link</button>}
          {mode === 'signin' && <button type="button" className="text-text-muted hover:text-accent" onClick={() => { setMode('signup'); setError(''); setNotice(''); }}>First time? Create the admin account</button>}
        </div>
      </main>
      <a href="/" className="mt-6 text-sm text-text-muted hover:text-accent">← Back to the website</a>
    </div>
  );
}
