'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Access denied.');
      }
    } catch {
      setError('Connection failure. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full border border-neutral-200 rounded-xl bg-white p-8 shadow-xs">
        <div className="text-center">
          <div className="w-12 h-12 bg-neutral-900 text-white rounded-lg flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
            Royal Step Portal
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Restricted access. Authorized staff and management only.
          </p>
        </div>

        {error && (
          <div className="mt-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Staff Email Address
            </label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="staff@royalstep.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-neutral-300 rounded-md focus:border-neutral-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-neutral-300 rounded-md focus:border-neutral-900 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                Sign In to Admin Console <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}