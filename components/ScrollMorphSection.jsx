'use client';

import { useEffect, useRef, useState } from 'react';

const PROFILES = [
  {
    username: 'sindresorhus',
    grade: 'S',
    score: 98,
    verdict: 'The gold standard.',
    detail: '1,000+ packages · every repo has a README · consistent for 12 years',
    color: '#639922',
    tag: 'Prolific',
  },
  {
    username: 'karpathy',
    grade: 'A',
    score: 94,
    verdict: 'Educational clarity, high signal.',
    detail: 'Deep READMEs · clean commit history · repos tell a story',
    color: '#639922',
    tag: 'Educational',
  },
  {
    username: 'kamranahmedse',
    grade: 'A',
    score: 91,
    verdict: 'Resource king.',
    detail: 'developer-roadmap has 300k+ stars · consistent pinned repos · full bio',
    color: '#639922',
    tag: 'Community',
  },
  {
    username: 'jwasham',
    grade: 'A',
    score: 88,
    verdict: 'Discipline on display.',
    detail: 'coding-interview-university · regular commits · well-documented goals',
    color: '#639922',
    tag: 'Consistent',
  },
  {
    username: 'gaearon',
    grade: 'A',
    score: 92,
    verdict: 'Clean, purposeful, impactful.',
    detail: 'React core team · minimal pinned repos · every project ships',
    color: '#639922',
    tag: 'Impactful',
  },
];

function ProfileCard({ profile, active, index }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: active ? 1 : 0,
      transform: active ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
      transition: 'opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)',
      pointerEvents: active ? 'auto' : 'none',
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e9d5ff',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 8px 40px rgba(124,58,237,0.1), 0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <img
            src={`https://github.com/${profile.username}.png?size=256`}
            alt={profile.username}
            width={56}
            height={56}
            style={{ borderRadius: '50%', border: '2px solid #e9d5ff' }}
          />
          <div>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700, fontSize: '1.1rem', color: '#0f172a',
            }}>
              @{profile.username}
            </div>
            <div style={{
              display: 'inline-block',
              background: '#faf5ff', border: '1px solid #e9d5ff',
              borderRadius: '9999px', padding: '0.15rem 0.6rem',
              fontFamily: "'DM Mono', monospace", fontSize: '0.65rem',
              color: '#7c3aed', marginTop: '0.25rem',
            }}>
              {profile.tag}
            </div>
          </div>

          {/* Grade badge */}
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: `${profile.color}18`,
              border: `2px solid ${profile.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800, fontSize: '1.3rem', color: profile.color,
            }}>
              {profile.grade}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem',
            }}>
              {profile.score}/100
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{
          background: '#f1f5f9', borderRadius: '9999px',
          height: '6px', marginBottom: '1.5rem', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: '9999px',
            width: `${profile.score}%`,
            background: `linear-gradient(90deg, ${profile.color}, #a855f7)`,
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>

        {/* Verdict */}
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 600, fontSize: '1rem', color: '#0f172a',
          margin: '0 0 0.5rem',
        }}>
          {profile.verdict}
        </p>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.75rem', color: '#64748b',
          lineHeight: 1.6, margin: 0,
        }}>
          {profile.detail}
        </p>
      </div>
    </div>
  );
}

export default function ScrollMorphSection() {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const totalHeight = sectionRef.current.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalHeight));
      const index = Math.min(PROFILES.length - 1, Math.floor(progress * PROFILES.length));
      setActiveIndex(index);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ height: `${PROFILES.length * 100}vh`, position: 'relative' }}
    >
      {/* Sticky viewport */}
      <div style={{
        position: 'sticky', top: 0, height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #fdfcff 0%, #faf5ff 100%)',
      }}>
        {/* Background decoration */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(216,180,254,0.15) 0%, transparent 70%)',
        }} />

        {/* Layout */}
        <div style={{
          maxWidth: '1100px', width: '100%', padding: '0 2.5rem',
          display: 'flex', alignItems: 'center', gap: '5rem',
        }}
          className="morph-layout"
        >
          {/* Left text */}
          <div style={{ flex: '0 0 auto', maxWidth: '340px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              border: '1px solid #e9d5ff', backgroundColor: '#faf5ff',
              borderRadius: '9999px', padding: '0.3rem 0.9rem',
              fontFamily: "'DM Mono', monospace", fontSize: '0.7rem',
              color: '#7c3aed', marginBottom: '1.25rem',
            }}>
              profiles that score
            </div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              letterSpacing: '-0.03em', lineHeight: 1.1,
              color: '#0f172a', margin: '0 0 1rem',
            }}>
              What a great<br />
              <span style={{
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                GitHub looks like.
              </span>
            </h2>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.95rem', color: '#64748b', lineHeight: 1.65,
              margin: '0 0 2rem',
            }}>
              These developers have mastered their GitHub presence. Scroll to see what separates
              them — and what you can copy.
            </p>

            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {PROFILES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!sectionRef.current) return;
                    const totalHeight = sectionRef.current.offsetHeight - window.innerHeight;
                    const targetScroll = sectionRef.current.offsetTop + (i / PROFILES.length) * totalHeight;
                    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                  }}
                  style={{
                    width: i === activeIndex ? '24px' : '8px',
                    height: '8px', border: 'none', borderRadius: '9999px',
                    background: i === activeIndex ? '#a855f7' : '#e2e8f0',
                    cursor: 'pointer', padding: 0,
                    transition: 'width 0.3s ease, background 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right — profile cards */}
          <div style={{ flex: 1, position: 'relative', height: '320px' }}>
            {PROFILES.map((profile, i) => (
              <ProfileCard key={profile.username} profile={profile} active={i === activeIndex} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
