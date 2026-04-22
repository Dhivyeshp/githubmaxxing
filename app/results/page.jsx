'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ScoreCard from '@/components/ScoreCard';
import ActionPlan from '@/components/ActionPlan';
import ShareCard from '@/components/ShareCard';
import SectionLabel from '@/components/SectionLabel';
import ReadmeTemplate from '@/components/ReadmeTemplate';
import ThemeToggle from '@/components/ThemeToggle';
import { getErrorMessage } from '@/lib/errors';
import ContributionCTA from '@/components/ContributionCTA';

const SCORE_CATEGORIES = ['profile', 'repos', 'readmes', 'commits', 'social'];

function SkeletonBox({ height = '3rem', width = '100%' }) {
  return (
    <div
      style={{
        height,
        width,
        backgroundColor: 'var(--surface)',
        borderRadius: '0.5rem',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

function ResultsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const username = params.get('u') || '';

  const [state, setState] = useState('loading'); // 'loading' | 'scoring' | 'done' | 'error'
  const [githubData, setGithubData] = useState(null);
  const [scores, setScores] = useState(null);
  const [actions, setActions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) {
      router.replace('/');
      return;
    }

    async function run() {
      try {
        // Step 1: fetch GitHub data + compute scores
        const analyzeRes = await fetch(
          `/api/analyze?username=${encodeURIComponent(username)}`
        );
        if (!analyzeRes.ok) {
          const json = await analyzeRes.json();
          throw new Error(json.error || 'Failed to analyze profile');
        }
        const { githubData: gd, scores: sc } = await analyzeRes.json();
        setGithubData(gd);
        setScores(sc);
        setState('scoring');

        // Step 2: get AI action plan
        const insightsRes = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ githubData: gd, scores: sc }),
        });
        if (insightsRes.ok) {
          const { actions: acts } = await insightsRes.json();
          setActions(Array.isArray(acts) ? acts : []);
        }
        setState('done');
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load results'));
        setState('error');
      }
    }

    run();
  }, [username, router]);

  if (state === 'error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1rem',
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            color: 'var(--red)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </p>
        <button
          onClick={() => router.push('/')}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: '0.875rem',
            color: 'var(--text)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          ← Try another username
        </button>
      </div>
    );
  }

  const isLoading = state === 'loading';
  const isScoring = state === 'scoring';
  const showSkeleton = isLoading || isScoring;
  const contributionsHref = `/contributions?u=${encodeURIComponent(username)}`;

  const initials = githubData?.profile?.name
    ? githubData.profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : username.slice(0, 2).toUpperCase();

  // Scoring note shown while action plan loads
  const quickWinCount = actions.filter((a) => a.effort === 'low').length;
  const verdict = scores
    ? isScoring
      ? 'generating action plan...'
      : `${quickWinCount} quick win${quickWinCount !== 1 ? 's' : ''} available`
    : `analyzing @${username}...`;

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 0,
      }}
    >
      {/* Inject keyframes for skeleton pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ width: '100%', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 50 }}>
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
          {[['Home', '/'], ['Features', '/#features'], ['About', '/#about'], ['Contributions', `/contributions?u=${encodeURIComponent(username)}`]].map(([label, href]) => (
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
          <button
            onClick={() => router.push(contributionsHref)}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 500,
              color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.3rem 0.65rem', borderRadius: '9999px',
            }}
          >
            Contribute
          </button>
          <ThemeToggle />
        </div>
      </nav>

      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          paddingTop: '2rem',
          paddingBottom: '3rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Score header */}
        {showSkeleton ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <SkeletonBox height="2.5rem" width="60%" />
            <SkeletonBox height="1.5rem" width="40%" />
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.75rem',
                color: 'var(--green)',
                marginTop: '0.5rem',
              }}
            >
              Analyzing @{username}...
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {githubData?.avatar_url ? (
                <img
                  src={githubData.avatar_url}
                  alt={username}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                  }}
                />
              ) : (
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
                  {initials}
                </div>
              )}
              <div>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '1rem',
                    margin: 0,
                  }}
                >
                  @{username}
                </p>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    margin: 0,
                  }}
                >
                  {verdict}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.65rem',
                    backgroundColor: '#ede9fe',
                    color: '#5b21b6',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.375rem',
                  }}
                >
                  {scores?.label}
                </span>
                {scores?.percentile && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.65rem',
                      backgroundColor: 'var(--surface-2)',
                      color: 'var(--text-muted)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.375rem',
                    }}
                  >
                    {scores.percentile}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: '2.5rem',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  margin: 0,
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                }}
              >
                {scores?.total}
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    WebkitTextFillColor: 'var(--text-muted)',
                  }}
                >
                  /100
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Score breakdown */}
        <div>
          <SectionLabel>// score breakdown</SectionLabel>
          {showSkeleton ? (
            <div className="score-grid">
              {SCORE_CATEGORIES.map((k) => (
                <SkeletonBox key={k} height="5.5rem" />
              ))}
            </div>
          ) : (
            <div className="score-grid">
              {SCORE_CATEGORIES.map((key, i) => (
                <div
                  key={key}
                  style={
                    i === SCORE_CATEGORIES.length - 1 &&
                    SCORE_CATEGORIES.length % 2 !== 0
                      ? { gridColumn: '1 / -1' }
                      : {}
                  }
                >
                  <ScoreCard category={key} score={scores?.[key] ?? 0} />
                </div>
              ))}
            </div>
          )}
        </div>

        {state === 'done' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.13), rgba(168,85,247,0.08) 55%, rgba(255,255,255,0.9))',
              border: '1px solid rgba(124,58,237,0.22)',
              borderRadius: '0.875rem',
              padding: '1rem 1.125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              boxShadow: '0 10px 30px rgba(124,58,237,0.10)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: '1 1 320px' }}>
              <div
                aria-hidden="true"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 7px)',
                  gridAutoRows: '7px',
                  gap: '3px',
                  padding: '0.55rem',
                  backgroundColor: 'rgba(255,255,255,0.58)',
                  border: '1px solid rgba(124,58,237,0.16)',
                  borderRadius: '0.625rem',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
                  flexShrink: 0,
                }}
              >
                {[0, 1, 2, 1, 3, 0, 2, 1, 3, 4, 2, 1, 0, 3, 2, 4, 3, 1, 2, 4, 1].map((level, i) => (
                  <span
                    key={i}
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '2px',
                      backgroundColor: [
                        'rgba(124,58,237,0.10)',
                        'rgba(124,58,237,0.24)',
                        'rgba(124,58,237,0.42)',
                        'rgba(124,58,237,0.62)',
                        'rgba(124,58,237,0.82)',
                      ][level],
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: 'var(--text)',
                    margin: 0,
                    lineHeight: 1.25,
                  }}
                >
                  Turn Your Stack Into Contributions
                </p>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.66rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Discover open-source issues tailored to your skills.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(contributionsHref)}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: '0.76rem',
                color: '#fff',
                backgroundColor: 'var(--green)',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.48rem 0.95rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              See contributions
            </button>
          </div>
        )}

        {/* Action plan */}
        <div>
          <SectionLabel>// priority action plan</SectionLabel>
          {state === 'loading' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1, 2, 3].map((n) => (
                <SkeletonBox key={n} height="6rem" />
              ))}
            </div>
          ) : state === 'scoring' ? (
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                padding: '1.5rem 0',
              }}
            >
              generating action plan...
            </p>
          ) : (
            <ActionPlan actions={actions} />
          )}
        </div>

        {/* Contribution matcher CTA */}
        {state === 'done' && (
          <ContributionCTA
            username={username}
            languages={githubData?.repos?.topLanguages || []}
          />
        )}

        {/* README template */}
        {state === 'done' && (
          <div>
            <SectionLabel>// profile readme template</SectionLabel>
            <ReadmeTemplate username={username} profile={githubData?.profile} topLanguages={githubData?.repos?.topLanguages} />
          </div>
        )}

        {/* Share strip */}
        {state === 'done' && scores && (
          <ShareCard
            username={username}
            score={scores.total}
            label={scores.label}
          />
        )}
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
          githubmaxxing.vercel.app · free · no login required
        </p>
      </footer>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'DM Mono', monospace",
            color: 'var(--green)',
            fontSize: '0.875rem',
          }}
        >
          Loading...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
