'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SectionLabel from '@/components/SectionLabel';

const EXAMPLE = {
  username: 'dhivyeshp',
  score: 64,
  label: 'B Tier',
  categories: [
    { key: 'profile', label: 'Profile', score: 55 },
    { key: 'repos', label: 'Repos', score: 70 },
    { key: 'readmes', label: 'READMEs', score: 50 },
    { key: 'commits', label: 'Commits', score: 75 },
    { key: 'social', label: 'Social', score: 25 },
  ],
};

function scoreColor(score) {
  if (score >= 75) return 'var(--green)';
  if (score >= 50) return 'var(--amber)';
  return 'var(--red)';
}

function ExamplePreview() {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9999px',
              backgroundColor: 'var(--green-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green-dark)',
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            D
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--text)' }}>
              @{EXAMPLE.username}
            </p>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              good bones · 3 quick wins
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              display: 'block',
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.6rem',
              backgroundColor: 'var(--green-light)',
              color: 'var(--green-dark)',
              padding: '0.2rem 0.6rem',
              borderRadius: '0.375rem',
              marginBottom: '0.25rem',
            }}
          >
            {EXAMPLE.label}
          </span>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: 'var(--text)',
            }}
          >
            {EXAMPLE.score}
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              /100
            </span>
          </span>
        </div>
      </div>

      {/* Score bars */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {EXAMPLE.categories.map(({ key, label, score }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: scoreColor(score),
                }}
              >
                {score}
              </span>
            </div>
            <div
              style={{
                height: '3px',
                backgroundColor: 'var(--border)',
                borderRadius: '9999px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${score}%`,
                  backgroundColor: scoreColor(score),
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action hint */}
      <div
        style={{
          margin: '0 1.5rem 1.25rem',
          padding: '0.875rem 1rem',
          backgroundColor: 'var(--background)',
          borderRadius: '0.625rem',
          border: '1px solid var(--border)',
        }}
      >
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>
          01 · Profile Completeness
        </p>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>
          No profile README
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Create a repo named <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--green)' }}>dhivyeshp/dhivyeshp</span> — shows at the top of your profile.
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/analyze?username=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'User not found');
      }
      router.push(`/results?u=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 1.5rem',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          width: '100%',
          maxWidth: '1040px',
          padding: '1.25rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
          github<span style={{ color: 'var(--green)' }}>maxxing</span>
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '0.2rem 0.5rem',
            borderRadius: '0.375rem',
            backgroundColor: 'var(--surface)',
          }}
        >
          beta
        </span>
      </nav>

      {/* Hero — two column */}
      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          paddingTop: '5rem',
          paddingBottom: '5rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: '4rem',
          alignItems: 'center',
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div>
            <SectionLabel>// profile analyzer</SectionLabel>
            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
                letterSpacing: '-0.04em',
                lineHeight: 1.08,
                margin: '0 0 1rem',
                color: 'var(--text)',
              }}
            >
              Stop guessing.
              <br />
              <span style={{ color: 'var(--green)' }}>Max out your GitHub.</span>
            </h1>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-muted)',
                lineHeight: 1.65,
                maxWidth: '400px',
                margin: 0,
              }}
            >
              We score your GitHub across 5 categories and give you a brutally honest,
              step-by-step action plan. Think Grammarly — but for your GitHub profile.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: "'DM Mono', monospace",
                    color: 'var(--text-muted)',
                    fontSize: '1rem',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your-github-username"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '0.625rem',
                    padding: '0.8rem 0.875rem 0.8rem 1.75rem',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.9rem',
                    color: 'var(--text)',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--green)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(22,166,121,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'var(--shadow-sm)';
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !username.trim()}
                style={{
                  backgroundColor: loading || !username.trim() ? 'var(--surface-2)' : 'var(--green)',
                  color: loading || !username.trim() ? 'var(--text-muted)' : '#fff',
                  border: 'none',
                  borderRadius: '0.625rem',
                  padding: '0.8rem 1.25rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s',
                  whiteSpace: 'nowrap',
                  boxShadow: loading || !username.trim() ? 'none' : '0 1px 3px rgba(22,166,121,0.3)',
                }}
              >
                {loading ? 'Checking...' : 'Analyze →'}
              </button>
            </div>

            {error && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--red)',
                  backgroundColor: 'var(--red-light)',
                  border: '1px solid #f9c5c5',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
          </form>

          {/* Trust line */}
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.65rem',
              color: 'var(--text-faint)',
              margin: 0,
            }}
          >
            free forever · no login required · powered by GitHub public API
          </p>
        </div>

        {/* Right — example preview */}
        <div>
          <ExamplePreview />
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          width: '100%',
          maxWidth: '1040px',
          borderTop: '1px solid var(--border)',
          padding: '1.25rem 0',
          marginTop: 'auto',
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.65rem',
            color: 'var(--text-faint)',
            textAlign: 'center',
          }}
        >
          githubmaxxing · free forever · no login required
        </p>
      </footer>
    </main>
  );
}
