'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContributionCTA({ username, languages = [] }) {
  const router = useRouter();
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!languages.length) return;
    const params = new URLSearchParams({
      languages: languages.slice(0, 3).join(','),
      difficulty: 'beginner',
      minStars: '5',
      maxAgeDays: '30',
    });
    fetch(`/api/contributions?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.total) setCount(Math.min(d.total, 999)); })
      .catch(() => {});
  }, [languages]);

  const countLabel = count !== null ? `${count.toLocaleString()} open source issues` : 'open source issues';

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '1rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(168,85,247,0.06) 100%)',
        border: '1px solid rgba(124,58,237,0.25)',
        overflow: 'hidden',
      }}
    >
      {/* Accent top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: '0.975rem',
          color: 'var(--text)',
          margin: 0,
          letterSpacing: '-0.015em',
        }}>
          Ready to level up your contribution graph?
        </p>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          We found <span style={{ color: 'var(--green)', fontWeight: 600 }}>{countLabel}</span> that match your skills.
        </p>

        {languages.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
            {languages.slice(0, 5).map((lang) => (
              <span key={lang} style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.6rem',
                backgroundColor: 'rgba(124,58,237,0.1)',
                color: 'var(--green)',
                padding: '0.18rem 0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid rgba(124,58,237,0.2)',
              }}>
                {lang}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push(`/contributions?u=${encodeURIComponent(username)}&languages=${encodeURIComponent(languages.slice(0, 3).join(','))}`)}
          style={{
            marginTop: '0.75rem',
            alignSelf: 'flex-start',
            backgroundColor: 'var(--green)',
            color: '#fff',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.5rem 1.25rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            letterSpacing: '-0.01em',
          }}
        >
          See matches →
        </button>
      </div>
    </div>
  );
}
