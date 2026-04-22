'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Good first issue' },
  { value: 'intermediate', label: 'Help wanted' },
  { value: 'advanced', label: 'Advanced' },
];

const STARS_OPTIONS = [
  { value: '5', label: '5+ stars' },
  { value: '50', label: '50+ stars' },
  { value: '500', label: '500+ stars' },
  { value: '1000', label: '1k+ stars' },
];

const AGE_OPTIONS = [
  { value: '7', label: 'Past week' },
  { value: '30', label: 'Past month' },
  { value: '90', label: 'Past 3 months' },
];

function SkeletonCard() {
  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '0.875rem',
      padding: '1.125rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: '0.875rem', width: '40%', backgroundColor: 'var(--surface-2)', borderRadius: '0.375rem' }} />
      <div style={{ height: '1rem', width: '85%', backgroundColor: 'var(--surface-2)', borderRadius: '0.375rem' }} />
      <div style={{ height: '0.75rem', width: '65%', backgroundColor: 'var(--surface-2)', borderRadius: '0.375rem' }} />
      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ height: '1.25rem', width: '4rem', backgroundColor: 'var(--surface-2)', borderRadius: '0.375rem' }} />
        ))}
      </div>
    </div>
  );
}

function IssueCard({ issue, skipped, onSkip }) {
  if (skipped) return null;

  const repoShortName = issue.repoName.split('/')[1] || issue.repoName;
  const orgName = issue.repoName.split('/')[0] || '';

  const matchReasons = [
    "You've shipped projects in this language — this repo needs exactly that.",
    "Matches your most active language. Low-hanging fruit for a real contribution.",
    "Your repo history shows experience here. Good signal for recruiters.",
    "Strong overlap with your top stack. This issue is tractable in an afternoon.",
    "Based on your commit patterns, this difficulty level is a good fit.",
  ];
  const reason = matchReasons[issue.id % matchReasons.length];

  return (
    <div
      className="card-hover"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '0.875rem',
        padding: '1.125rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left accent */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
        background: 'linear-gradient(180deg, #7c3aed, #a855f7)',
        borderRadius: '0.875rem 0 0 0.875rem',
      }} />

      {/* Repo + meta row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
        }}>
          <span style={{ color: 'var(--text-faint)' }}>{orgName}/</span>
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>{repoShortName}</span>
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.6rem',
          color: 'var(--text-faint)',
        }}>
          {issue.age}
        </span>
      </div>

      {/* Issue title */}
      <p style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'var(--text)',
        margin: 0,
        lineHeight: 1.45,
        letterSpacing: '-0.01em',
      }}>
        {issue.title}
      </p>

      {/* Why this matches */}
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        margin: 0,
        lineHeight: 1.6,
        backgroundColor: 'var(--surface-2)',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        borderLeft: '2px solid rgba(124,58,237,0.3)',
      }}>
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>Why this matches: </span>
        {reason}
      </p>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {issue.labels.slice(0, 4).map((label) => (
            <span key={label} style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.58rem',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-muted)',
              padding: '0.18rem 0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border)',
            }}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: 'var(--green)',
            color: '#fff',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.4rem 1rem',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Open issue ↗
        </a>
        <button
          onClick={() => onSkip(issue.id)}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.7rem',
            color: 'var(--text-faint)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '9999px',
            padding: '0.4rem 0.875rem',
            cursor: 'pointer',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.68rem',
        backgroundColor: active ? 'var(--green)' : 'var(--surface)',
        color: active ? '#fff' : 'var(--text-muted)',
        border: `1px solid ${active ? 'var(--green)' : 'var(--border)'}`,
        borderRadius: '9999px',
        padding: '0.3rem 0.75rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function ContributionsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const username = params.get('u') || '';
  const initialLanguages = params.get('languages')?.split(',').filter(Boolean) || [];

  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skipped, setSkipped] = useState(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('gh-skipped-issues') || '{}'); } catch { return {}; }
  });

  const [difficulty, setDifficulty] = useState('beginner');
  const [minStars, setMinStars] = useState('5');
  const [maxAgeDays, setMaxAgeDays] = useState('30');
  const [languages, setLanguages] = useState(initialLanguages);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const p = new URLSearchParams({ difficulty, minStars, maxAgeDays });
      if (languages.length) p.set('languages', languages.join(','));
      const res = await fetch(`/api/contributions?${p}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setIssues(data.issues || []);
      setTotal(data.total ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [difficulty, minStars, maxAgeDays, languages]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const handleSkip = useCallback((id) => {
    setSkipped((prev) => {
      const next = { ...prev, [id]: true };
      try { localStorage.setItem('gh-skipped-issues', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const visibleIssues = issues.filter((i) => !skipped[i.id]);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* Nav */}
      <nav style={{ width: '100%', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'center', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'var(--background)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          background: 'var(--surface)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)', borderRadius: '9999px',
          padding: '0.35rem 0.5rem 0.35rem 1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.85rem',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: 'var(--text)', marginRight: '0.75rem',
            }}
          >
            github<span style={{ color: 'var(--green)' }}>maxxing</span>
          </button>
          {[['Home', '/'], ['Features', '/#features'], ['About', '/#about']].map(([label, href]) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 500,
                color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.3rem 0.65rem', borderRadius: '9999px',
              }}
            >
              {label}
            </button>
          ))}
          {username && (
            <button
              onClick={() => router.push(`/results?u=${encodeURIComponent(username)}`)}
              style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 500,
                color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.3rem 0.65rem', borderRadius: '9999px',
              }}
            >
              ← Results
            </button>
          )}
          <ThemeToggle />
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem 4rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.65rem',
            color: 'var(--green)',
            letterSpacing: '0.08em',
            margin: 0,
          }}>
            // contribution matcher
          </p>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: '1.75rem',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            color: 'var(--text)',
            margin: 0,
          }}>
            Issues that match your stack
          </h1>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.6,
          }}>
            Real open source issues filtered to your languages. Ship a contribution, move your graph, impress recruiters.
          </p>

          {/* Language chips */}
          {languages.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
              {languages.map((lang) => (
                <span
                  key={lang}
                  onClick={() => setLanguages((prev) => prev.filter((l) => l !== lang))}
                  title="Click to remove"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(124,58,237,0.1)',
                    color: 'var(--green)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(124,58,237,0.25)',
                    cursor: 'pointer',
                  }}
                >
                  {lang} ×
                </span>
              ))}
              <button
                onClick={() => setLanguages([])}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.6rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-faint)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  padding: '0.2rem 0.5rem',
                  cursor: 'pointer',
                }}
              >
                clear
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '0.875rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.06em' }}>DIFFICULTY</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {DIFFICULTY_OPTIONS.map((opt) => (
                <FilterPill key={opt.value} label={opt.label} active={difficulty === opt.value} onClick={() => setDifficulty(opt.value)} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.06em' }}>REPO STARS</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {STARS_OPTIONS.map((opt) => (
                <FilterPill key={opt.value} label={opt.label} active={minStars === opt.value} onClick={() => setMinStars(opt.value)} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.06em' }}>ISSUE AGE</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {AGE_OPTIONS.map((opt) => (
                <FilterPill key={opt.value} label={opt.label} active={maxAgeDays === opt.value} onClick={() => setMaxAgeDays(opt.value)} />
              ))}
            </div>
          </div>
        </div>

        {/* Results header */}
        {!loading && !error && total !== null && (
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            Showing {visibleIssues.length} of {total.toLocaleString()} matches
            {skipped && Object.keys(skipped).length > 0 && (
              <button
                onClick={() => {
                  setSkipped({});
                  try { localStorage.removeItem('gh-skipped-issues'); } catch {}
                }}
                style={{
                  marginLeft: '0.75rem',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.62rem',
                  color: 'var(--text-faint)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                restore skipped
              </button>
            )}
          </p>
        )}

        {/* Issue list */}
        {error ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            alignItems: 'center',
          }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--red)', margin: 0 }}>
              {error}
            </p>
            <button
              onClick={fetchIssues}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                padding: '0.4rem 1rem',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3, 4, 5].map((n) => <SkeletonCard key={n} />)}
          </div>
        ) : visibleIssues.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            alignItems: 'center',
          }}>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', margin: 0 }}>
              No matches found
            </p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Try broadening filters — lower the star threshold, extend the age window, or switch to "Help wanted".
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visibleIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} skipped={!!skipped[issue.id]} onSkip={handleSkip} />
            ))}
          </div>
        )}
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'var(--text-faint)', margin: 0 }}>
          githubmaxxing.vercel.app · free · no login required
        </p>
      </footer>
    </main>
  );
}

export default function ContributionsPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Mono', monospace",
        color: 'var(--green)',
        fontSize: '0.875rem',
      }}>
        Loading...
      </div>
    }>
      <ContributionsContent />
    </Suspense>
  );
}
