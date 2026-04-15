'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SectionLabel from '@/components/SectionLabel';

// Static example data shown below the fold so visitors immediately see what
// they're getting before they type anything.
const EXAMPLE = {
  username: 'dhivyeshp',
  score: 64,
  label: 'B Tier',
  categories: [
    { key: 'profile', score: 55 },
    { key: 'repos', score: 70 },
    { key: 'readmes', score: 50 },
    { key: 'commits', score: 75 },
    { key: 'social', score: 25 },
  ],
};

const CATEGORY_LABELS = {
  profile: 'Profile',
  repos: 'Repos',
  readmes: 'READMEs',
  commits: 'Commits',
  social: 'Social',
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
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        backgroundColor: 'var(--surface)',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              backgroundColor: 'var(--green-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green-dark)',
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            D
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
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
              good bones · 3 quick wins available
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.65rem',
              backgroundColor: '#E1F5EE',
              color: '#0F6E56',
              padding: '0.2rem 0.5rem',
              borderRadius: '0.375rem',
              display: 'block',
              marginBottom: '0.25rem',
            }}
          >
            {EXAMPLE.label}
          </span>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {EXAMPLE.score}
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
              }}
            >
              /100
            </span>
          </span>
        </div>
      </div>

      {/* Mini score grid */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
        }}
      >
        {EXAMPLE.categories.map(({ key, score }) => (
          <div key={key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.25rem',
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {CATEGORY_LABELS[key]}
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.6rem',
                  color: scoreColor(score),
                }}
              >
                {score}
              </span>
            </div>
            <div
              style={{
                height: '2px',
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
                }}
              />
            </div>
          </div>
        ))}
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
      const res = await fetch(
        `/api/analyze?username=${encodeURIComponent(trimmed)}`
      );
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
        padding: '0 1rem',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          width: '100%',
          maxWidth: '640px',
          borderBottom: '1px solid var(--border)',
          padding: '1rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '0.95rem',
          }}
        >
          <span style={{ color: 'var(--text)' }}>github</span>
          <span style={{ color: 'var(--green)' }}>maxxing</span>
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '0.15rem 0.4rem',
            borderRadius: '0.375rem',
          }}
        >
          beta
        </span>
      </nav>

      {/* Hero */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          paddingTop: '4rem',
          paddingBottom: '3rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div>
          <SectionLabel>// profile analyzer</SectionLabel>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(2rem, 6vw, 2.75rem)',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              margin: '0 0 0.75rem',
            }}
          >
            Maximize your GitHub.
            <br />
            <span style={{ color: 'var(--green)' }}>Get hired faster.</span>
          </h1>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '420px',
              margin: 0,
            }}
          >
            We score your GitHub profile across 5 categories and give you a
            brutally honest action plan. Think Grammarly, but for your GitHub.
          </p>
        </div>

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
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
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 0.875rem 0.75rem 1.75rem',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.9rem',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = 'var(--green)')
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = 'var(--border)')
                }
              />
            </div>
            <button
              type="submit"
              disabled={loading || !username.trim()}
              style={{
                backgroundColor:
                  loading || !username.trim()
                    ? 'var(--surface-2)'
                    : 'var(--green)',
                color:
                  loading || !username.trim()
                    ? 'var(--text-muted)'
                    : '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.25rem',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor:
                  loading || !username.trim() ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
                whiteSpace: 'nowrap',
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
                backgroundColor: '#FCEBEB',
                border: '1px solid #FCEBEB',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.875rem',
              }}
            >
              {error}
            </p>
          )}
        </form>

        {/* Example preview */}
        <div>
          <SectionLabel>// example results</SectionLabel>
          <ExamplePreview />
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          width: '100%',
          maxWidth: '640px',
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
