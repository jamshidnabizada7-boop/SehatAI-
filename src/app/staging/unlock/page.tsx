'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function StagingUnlockPage() {
  const router = useRouter();
  const [stagingKey, setStagingKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!stagingKey.trim()) {
      setError('Please enter the staging access key.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/staging/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stagingKey: stagingKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid staging access key.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 800);
    } catch {
      setError('Failed to contact server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mx-auto mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            SehatAI Staging Environment
          </h1>
          <p className="text-sm text-slate-400">
            Private Access Gate &bull; Authorized Testers Only
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            محفوظ نجی ماحول برائے ٹیسٹرز
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
            <Lock className="w-5 h-5 shrink-0" />
            <div>Access granted. Redirecting to workspace...</div>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
              Staging Access Secret
            </label>
            <div className="relative">
              <input
                type="password"
                value={stagingKey}
                onChange={(e) => setStagingKey(e.target.value)}
                placeholder="Enter access key..."
                disabled={loading || success}
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50"
              />
              <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Authentication sets an HTTP-only secure session cookie without passing credentials in URLs.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Verifying...</span>
            ) : success ? (
              <span>Unlocked!</span>
            ) : (
              <>
                <span>Unlock Staging</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
          SehatAI Telemedicine &bull; Oracle ARM64 Staging Pilot
        </div>
      </div>
    </div>
  );
}
