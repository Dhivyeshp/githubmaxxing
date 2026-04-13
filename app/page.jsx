'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MODES = [
  { value: 'standard', label: 'Standard', emoji: '🔥', desc: 'Savage but funny' },
  { value: 'nomercy', label: 'No Mercy', emoji: '💀', desc: 'Absolutely ruthless' },
  { value: 'soft', label: 'Soft Roast', emoji: '😂', desc: 'Playful, not mean' },
  { value: 'academic', label: 'Academic', emoji: '🎓', desc: 'CS student special' },
];

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim()) return;

    // Rate limit check (5 per day via localStorage)
    const today = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem('roast_limit') || '{}');
    const count = stored.date === today ? stored.count : 0;
    if (count >= 5) {
      setError("You've been roasted 5 times today. Come back tomorrow. 💀");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch GitHub data
      const githubRes = await fetch(`/api/github?username=${encodeURIComponent(username.trim())}`);
      if (!githubRes.ok) {
        const err = await githubRes.json();
        throw new Error(err.error || 'GitHub user not found');
      }
      const githubData = await githubRes.json();

      // Get roast
      const roastRes = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubData, mode }),
      });
      if (!roastRes.ok) throw new Error('Failed to generate roast');
      const { roast } = await roastRes.json();

      // Update rate limit
      localStorage.setItem('roast_limit', JSON.stringify({ date: today, count: count + 1 }));

      // Navigate to results
      const params = new URLSearchParams({
        roast,
        username: githubData.username,
        avatar: githubData.avatar_url,
        mode,
      });
      router.push(`/roast?${params.toString()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 py-16">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-red-700/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col items-center gap-8">
        {/* Logo / Headline */}
        <div className="text-center space-y-3">
          <div className="text-5xl mb-2">🔥</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            <span className="text-orange-400">Roast</span>
            <span className="text-white"> My GitHub</span>
          </h1>
          <p className="text-zinc-400 text-lg font-medium">
            Enter your GitHub.{' '}
            <span className="text-orange-300">Leave with your feelings hurt.</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Username input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-lg select-none">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your github username"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 focus:border-orange-500 rounded-xl px-4 py-4 pl-9 text-white text-lg font-mono placeholder:text-zinc-600 outline-none transition-colors"
            />
          </div>

          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-left transition-all ${
                  mode === m.value
                    ? 'bg-orange-500/10 border-orange-500 text-orange-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                <span className="text-base font-semibold">
                  {m.emoji} {m.label}
                </span>
                <span className="text-xs text-zinc-500">{m.desc}</span>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-black text-xl rounded-xl py-4 transition-all shadow-lg shadow-orange-900/30 hover:shadow-orange-900/50 hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Preparing the roast...
              </span>
            ) : (
              'Roast Me 🔥'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-zinc-600 text-xs text-center">
          5 roasts per day per person · Public GitHub profiles only
        </p>
      </div>
    </main>
  );
}
