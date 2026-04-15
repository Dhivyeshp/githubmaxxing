'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ScoreCard from '@/components/ScoreCard';
import ActionPlan from '@/components/ActionPlan';
import ShareCard from '@/components/ShareCard';
import SectionLabel from '@/components/SectionLabel';

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
        setError(err.message);
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
            fontFamily: "'Syne', sans-serif",
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
        padding: '0 1rem',
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
        <button
          onClick={() => router.push('/')}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--text)',
          }}
        >
          <span style={{ color: 'var(--text)' }}>github</span>
          <span style={{ color: 'var(--green)' }}>maxxing</span>
        </button>
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

      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          paddingTop: '2rem',
          paddingBottom: '3rem',
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
                    fontFamily: "'Syne', sans-serif",
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
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.65rem',
                  backgroundColor: '#E1F5EE',
                  color: '#0F6E56',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '0.375rem',
                  marginBottom: '0.25rem',
                }}
              >
                {scores?.label}
              </span>
              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: '2.5rem',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {scores?.total}
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
              }}
            >
              {SCORE_CATEGORIES.map((k) => (
                <SkeletonBox key={k} height="5.5rem" />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
              }}
            >
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
          githubmaxxing · free forever · no login required
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
