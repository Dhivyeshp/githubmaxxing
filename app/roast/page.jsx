'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

const MODE_LABELS = {
  standard: '🔥 Standard Roast',
  nomercy: '💀 No Mercy',
  soft: '😂 Soft Roast',
  academic: '🎓 Academic Roast',
};

function RoastCard() {
  const params = useSearchParams();
  const router = useRouter();

  const roast = params.get('roast') || '';
  const username = params.get('username') || 'unknown';
  const avatar = params.get('avatar') || '';
  const mode = params.get('mode') || 'standard';

  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(roast);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    const tweet = `i put my github in roastmygithub and 💀\n\n"${roast.slice(0, 200)}..."\n\nroastmygithub.com`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
      '_blank'
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 py-16">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-red-700/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-orange-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-6">
        {/* Profile header */}
        <div className="flex flex-col items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={username}
              className="w-20 h-20 rounded-full border-2 border-orange-500/40 shadow-lg shadow-orange-900/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-orange-500/40 flex items-center justify-center text-3xl">
              👤
            </div>
          )}
          <div className="text-center">
            <p className="text-zinc-400 text-sm">
              {MODE_LABELS[mode] || '🔥 Roast'}
            </p>
            <h2 className="text-xl font-bold text-white">
              @{username}
            </h2>
          </div>
        </div>

        {/* Roast card — screenshot bait */}
        <div className="relative w-full bg-zinc-900 border border-zinc-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-600" />

          <div className="px-7 py-8">
            {/* Flame icon */}
            <div className="text-3xl mb-4">🔥</div>

            {/* Roast text */}
            <p className="text-white text-lg leading-relaxed font-medium whitespace-pre-wrap">
              {roast}
            </p>

            {/* Watermark */}
            <div className="mt-8 flex items-center justify-between">
              <span className="text-zinc-600 text-xs font-mono">
                roastmygithub.com
              </span>
              <span className="text-zinc-700 text-xs">@{username}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-zinc-500 text-white font-semibold rounded-xl py-3.5 transition-all"
          >
            {copied ? (
              <>✅ Copied!</>
            ) : (
              <>📋 Copy Roast</>
            )}
          </button>

          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-600 hover:border-zinc-500 text-white font-semibold rounded-xl py-3.5 transition-all"
          >
            𝕏 Share on X
          </button>

          <button
            onClick={() => router.push('/')}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-semibold rounded-xl py-3.5 transition-all shadow-lg shadow-orange-900/20"
          >
            🔥 Roast Someone Else
          </button>
        </div>

        <p className="text-zinc-600 text-xs text-center">
          Don't @ us. You asked for this.
        </p>
      </div>
    </main>
  );
}

export default function RoastPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-orange-400 text-xl font-bold">
        🔥 Loading your roast...
      </div>
    }>
      <RoastCard />
    </Suspense>
  );
}
