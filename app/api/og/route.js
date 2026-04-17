import { ImageResponse } from 'next/og';

export const runtime = 'edge';

function badgeColor(total) {
  const score = Number(total);
  if (score >= 80) return { accent: '#639922', tier: 'A' };
  if (score >= 60) return { accent: '#BA7517', tier: 'B' };
  return { accent: '#E24B4A', tier: 'C' };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || 'github user';
  const score = searchParams.get('score') || '0';
  const label = searchParams.get('label') || '—';
  const percentile = searchParams.get('percentile') || '';
  const avatar = searchParams.get('avatar') || '';

  const { accent } = badgeColor(score);
  const scoreNum = Number(score);
  const barWidth = Math.round((scoreNum / 100) * 480);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0a0a0f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
            background: '#111118',
            border: '1px solid #222230',
            borderRadius: '24px',
            padding: '52px 72px',
            position: 'relative',
            width: '720px',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#555', letterSpacing: '0.08em' }}>
              github
            </span>
            <span style={{ fontSize: '14px', color: '#639922', letterSpacing: '0.08em' }}>
              maxxing
            </span>
          </div>

          {/* Avatar + username */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                width="52"
                height="52"
                style={{ borderRadius: '9999px', border: '2px solid #222' }}
                alt=""
              />
            ) : (
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '9999px',
                  background: '#1a1a2e',
                  border: '2px solid #222',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#639922',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                {username.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: '22px', color: '#ccc', fontWeight: 500 }}>
              @{username}
            </span>
          </div>

          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontSize: '96px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: '32px', color: '#444', fontWeight: 400 }}>/100</span>
          </div>

          {/* Label + percentile pills */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <span
              style={{
                background: '#1e1333',
                color: '#a855f7',
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid #2d1f4d',
              }}
            >
              {label}
            </span>
            {percentile && (
              <span
                style={{
                  background: '#111',
                  color: '#666',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  border: '1px solid #222',
                }}
              >
                {percentile}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '480px',
              height: '6px',
              background: '#1a1a1a',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${barWidth}px`,
                height: '6px',
                background: `linear-gradient(90deg, #7c3aed, ${accent})`,
                borderRadius: '9999px',
              }}
            />
          </div>

          {/* CTA */}
          <span style={{ fontSize: '13px', color: '#444', letterSpacing: '0.05em' }}>
            githubmaxxing.vercel.app
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
