import { fetchGitHubData } from '@/lib/github';
import { computeScores } from '@/lib/scorer';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://githubmaxxing.vercel.app';

export async function generateMetadata({ params }) {
  const { username } = await params;

  try {
    const githubData = await fetchGitHubData(username);
    const scores = computeScores(githubData);

    const ogParams = new URLSearchParams({
      username,
      score: String(scores.total),
      label: scores.label,
      percentile: scores.percentile || '',
      avatar: githubData?.avatar_url || '',
    });

    return {
      title: `@${username} scored ${scores.total}/100 on githubmaxxing`,
      description: `${scores.label} · ${scores.percentile || ''} · See the full breakdown and action plan.`,
      openGraph: {
        title: `@${username} scored ${scores.total}/100`,
        description: `${scores.label} · ${scores.percentile || ''} · Get your own score at githubmaxxing`,
        images: [
          {
            url: `${BASE_URL}/api/og?${ogParams.toString()}`,
            width: 1200,
            height: 630,
            alt: `${username} githubmaxxing score card`,
          },
        ],
        url: `${BASE_URL}/share/${username}`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `@${username} scored ${scores.total}/100 on githubmaxxing`,
        description: `${scores.label} · ${scores.percentile || ''}`,
        images: [`${BASE_URL}/api/og?${ogParams.toString()}`],
      },
    };
  } catch {
    return {
      title: `githubmaxxing — GitHub profile scorer`,
      description: 'Score your GitHub profile and get a ranked action plan.',
    };
  }
}

export default async function SharePage({ params }) {
  const { username } = await params;

  let scores = null;
  let githubData = null;

  try {
    githubData = await fetchGitHubData(username);
    scores = computeScores(githubData);
  } catch {
    // render fallback
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          textAlign: 'center',
        }}
      >
        {githubData?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={githubData.avatar_url}
            alt={username}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '9999px',
              border: '2px solid #222',
            }}
          />
        )}

        <div>
          <p style={{ color: '#666', fontSize: '0.75rem', margin: '0 0 0.25rem' }}>
            @{username} scored
          </p>
          <p
            style={{
              fontSize: '4rem',
              fontWeight: 800,
              margin: 0,
              lineHeight: 1,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
            }}
          >
            {scores?.total ?? '—'}
            <span style={{ fontSize: '1.5rem', WebkitTextFillColor: '#444', fontWeight: 400 }}>
              /100
            </span>
          </p>
        </div>

        {scores && (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <span
              style={{
                background: '#1e1333',
                color: '#a855f7',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.7rem',
                border: '1px solid #2d1f4d',
              }}
            >
              {scores.label}
            </span>
            {scores.percentile && (
              <span
                style={{
                  background: '#111',
                  color: '#666',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.7rem',
                  border: '1px solid #222',
                }}
              >
                {scores.percentile}
              </span>
            )}
          </div>
        )}

        <Link
          href={`/results?u=${encodeURIComponent(username)}`}
          style={{
            display: 'inline-block',
            padding: '0.65rem 1.5rem',
            background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
            color: '#fff',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
          }}
        >
          See full breakdown →
        </Link>

        <p style={{ fontSize: '0.65rem', color: '#333', margin: 0 }}>
          <Link href="/" style={{ color: '#555', textDecoration: 'none' }}>
            githubmaxxing
          </Link>
          {' · '}free · no login required
        </p>
      </div>
    </main>
  );
}
