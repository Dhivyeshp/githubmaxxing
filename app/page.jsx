'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Feature108 from '@/components/Feature108';
import ThemeToggle from '@/components/ThemeToggle';

const IntroAnimation = dynamic(() => import('@/components/ui/scroll-morph-hero'), { ssr: false });
const MORPH_SCROLL_HEIGHT = 3200;

function NavLink({ label, id }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (id) {
          const el = document.getElementById(id);
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '0.78rem',
        fontWeight: 500,
        color: hovered ? 'var(--text)' : 'var(--text-muted)',
        textDecoration: 'none',
        padding: '0.3rem 0.65rem',
        borderRadius: '9999px',
        backgroundColor: hovered ? 'var(--surface-2)' : 'transparent',
        transition: 'color 0.2s ease, background-color 0.2s ease',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function FadeInSection({ children, style }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
      willChange: 'opacity, transform',
      ...style,
    }}>
      {children}
    </div>
  );
}

function useStickyScroll(sectionRef) {
  const [scrollY, setScrollY] = useState(0);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const readTarget = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      targetRef.current = Math.min(Math.max(0, -rect.top), MORPH_SCROLL_HEIGHT);
    };

    const tick = () => {
      currentRef.current += (targetRef.current - currentRef.current) * 0.09;
      if (Math.abs(targetRef.current - currentRef.current) < 0.1) {
        currentRef.current = targetRef.current;
      }
      setScrollY(currentRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', readTarget, { passive: true });
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('scroll', readTarget);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sectionRef]);

  return scrollY;
}

const KICKER_WORDS = ['Fix Your Profile', 'GitHub Made Better', 'Profile Done Right'];

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kickerIdx, setKickerIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKickerIdx((i) => (i + 1) % KICKER_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  const morphSectionRef = useRef(null);
  const morphScrollY = useStickyScroll(morphSectionRef);
  const [heroScrollY, setHeroScrollY] = useState(0);
  const heroTargetRef = useRef(0);
  const heroCurrentRef = useRef(0);
  const heroRafRef = useRef(null);

  useEffect(() => {
    const readTarget = () => { heroTargetRef.current = window.scrollY; };
    const tick = () => {
      heroCurrentRef.current += (heroTargetRef.current - heroCurrentRef.current) * 0.09;
      if (Math.abs(heroTargetRef.current - heroCurrentRef.current) < 0.1) {
        heroCurrentRef.current = heroTargetRef.current;
      }
      setHeroScrollY(heroCurrentRef.current);
      heroRafRef.current = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', readTarget, { passive: true });
    heroRafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('scroll', readTarget);
      if (heroRafRef.current) cancelAnimationFrame(heroRafRef.current);
    };
  }, []);

  const heroFade = Math.max(0, 1 - heroScrollY / 500);

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
    <main style={{ backgroundColor: '#fdfcff' }}>

      {/* ── Hero wrapper (overflow:hidden clips the blobs to this area only) ── */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Subtle left vignette so text pops */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(253,252,255,0.6) 0%, transparent 50%)',
        }} />
      </div>

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 50, padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          background: 'var(--surface)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)', borderRadius: '9999px',
          padding: '0.35rem 0.5rem 0.35rem 1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Logo */}
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginRight: '0.75rem' }}>
            github<span style={{ color: 'var(--green)' }}>maxxing</span>
          </span>

          {/* Nav links */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {[['Home', null], ['Features', 'features'], ['About', 'about']].map(([link, id]) => (
              <NavLink key={link} label={link} id={id} />
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => document.getElementById('username-input')?.focus()}
            style={{
              backgroundColor: 'var(--text)', color: 'var(--background)',
              border: 'none', borderRadius: '9999px',
              padding: '0.38rem 1rem',
              fontFamily: 'var(--font-sans)', fontWeight: 600,
              fontSize: '0.75rem', cursor: 'pointer',
              marginLeft: '0.25rem',
            }}
          >
            Get Started
          </button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <div
        style={{
          position: 'relative', zIndex: 10,
          maxWidth: '1200px', margin: '0 auto', width: '100%',
          padding: '0 2.5rem',
          display: 'flex', alignItems: 'center',
          flex: 1, minHeight: 'calc(100vh - 64px)',
          paddingTop: '0',
          marginTop: '-5.5rem',
          opacity: heroFade,
          transform: `translateY(${(1 - heroFade) * -24}px)`,
          willChange: 'opacity, transform',
        }}
        className="hero-layout"
      >
        {/* Left content */}
        <div style={{ flex: '0 0 auto', maxWidth: '560px', width: '100%', paddingBottom: '2rem', paddingLeft: '2rem', marginTop: '-2rem' }} className="hero-content-left">

          {/* Pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            border: '1px solid #e9d5ff',
            backgroundColor: '#faf5ff',
            borderRadius: '9999px', padding: '0.2rem 0.65rem',
            fontFamily: "'DM Mono', monospace", fontSize: '0.6rem',
            color: '#7c3aed', marginBottom: '1.25rem',
            animation: 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both',
            animationDelay: '100ms',
          }}>
            <span>←</span>
            <span style={{
              display: 'inline-block',
              overflow: 'hidden',
              width: '14ch',
              verticalAlign: 'middle',
            }}>
              <span style={{
                display: 'flex',
                transform: `translateX(calc(-${kickerIdx} * 14ch))`,
                transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                {KICKER_WORDS.map((word) => (
                  <span key={word} style={{ minWidth: '14ch', textAlign: 'center' }}>
                    {word}
                  </span>
                ))}
              </span>
            </span>
            <span>→</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
            fontSize: 'clamp(2.6rem, 5.5vw, 4rem)',
            letterSpacing: '-0.035em', lineHeight: 1.08,
            margin: '0 0 1.25rem', color: '#0f172a',
            animation: 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both',
            animationDelay: '220ms',
          }}>
            Your GitHub is
            <br />losing you jobs.
          </h1>

          <p style={{
            fontSize: '1.05rem', color: '#64748b',
            lineHeight: 1.65, margin: '0 0 2.25rem', maxWidth: '400px',
            animation: 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both',
            animationDelay: '360ms',
          }}>
            We score your profile across 5 categories and give you a ranked action plan.
            No fluff - just what actually moves the needle.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '420px', animation: 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '500ms' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.625rem',
                  padding: '0.8rem 1rem',
                  fontFamily: "'DM Mono', monospace", fontSize: '0.875rem',
                  color: '#0f172a', outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a855f7';
                  e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="submit"
                disabled={loading || !username.trim()}
                style={{
                  background: loading || !username.trim()
                    ? '#f1f5f9'
                    : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  color: loading || !username.trim() ? '#94a3b8' : '#ffffff',
                  border: 'none', borderRadius: '0.625rem',
                  padding: '0.8rem 1.4rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: loading || !username.trim() ? 'none' : '0 4px 20px rgba(124,58,237,0.35)',
                  transition: 'opacity 0.15s, box-shadow 0.15s',
                }}
              >
                {loading ? 'Checking...' : 'Analyze →'}
              </button>
            </div>
            {error && (
              <p style={{
                fontSize: '0.8rem', color: '#fca5a5',
                backgroundColor: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '0.5rem', padding: '0.5rem 0.875rem', margin: 0,
              }}>
                {error}
              </p>
            )}
          </form>

          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.68rem',
            color: '#94a3b8', margin: '1rem 0 0',
            animation: 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both',
            animationDelay: '640ms',
          }}>
            no login · no email · 100% public API
          </p>
        </div>

        {/* Right — hand mockup */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '300ms' }} className="hero-right">
          <img
            src="/handmockup.png"
            alt="GitHub profile score on phone"
            className="hero-img"
            style={{
              width: '100%',
              maxWidth: '480px',
              height: 'auto',
              objectFit: 'contain',
              marginBottom: '-2px',
              marginRight: '-5rem',
              marginTop: '10rem',
              filter: 'none',
            }}
          />
        </div>
      </div>
      {/* White fade overlay — sweeps up as user scrolls */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
        background: 'linear-gradient(to top, #fdfcff 0%, rgba(253,252,255,0.7) 40%, transparent 100%)',
        opacity: 1 - heroFade,
      }} />
      </div>{/* end hero wrapper */}

      {/* Scroll Morph — sticky, page-scroll driven */}
      <div
        ref={morphSectionRef}
        style={{ height: `calc(100vh + ${MORPH_SCROLL_HEIGHT}px)`, position: 'relative' }}
      >
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          <IntroAnimation scrollY={morphScrollY} />
        </div>
      </div>

      {/* Features */}
      <div id="features">
        <FadeInSection>
          <Feature108 />
        </FadeInSection>
      </div>

      {/* About */}
      <div id="about">
      <FadeInSection>
      <section style={{ padding: '7rem 2.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            border: '1px solid #e9d5ff', backgroundColor: '#ffffff',
            borderRadius: '9999px', padding: '0.3rem 0.9rem',
            fontFamily: "'DM Mono', monospace", fontSize: '0.7rem',
            color: '#7c3aed', marginBottom: '1.25rem',
          }}>
            about
          </div>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
            letterSpacing: '-0.03em', color: '#0f172a',
            margin: '0 0 1.5rem', lineHeight: 1.15,
          }}>
            Built for developers who<br />
            <span style={{
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              take their craft seriously.
            </span>
          </h2>
          <p style={{
            fontSize: '1rem', color: '#64748b', lineHeight: 1.75,
            margin: '0 0 1.5rem',
          }}>
            GitHub Maxxing was built because most developers undersell themselves.
            Your GitHub is a portfolio - and most portfolios are empty, stale, or impossible to navigate.
          </p>
          <p style={{
            fontSize: '1rem', color: '#64748b', lineHeight: 1.75,
            margin: '0 0 1.5rem',
          }}>
            We hit the public GitHub API, score your profile across 5 categories,
            and give you a specific, ranked action plan. No login. No email. No BS.
            Just a score and a list of things to fix this week.
          </p>
          <p style={{
            fontSize: '1rem', color: '#64748b', lineHeight: 1.75,
            margin: 0,
          }}>
            Built by developers who got tired of seeing great engineers lose out to worse candidates
            with better profiles. Your code speaks for itself - your GitHub should too.
          </p>
        </div>
      </section>
      </FadeInSection>
      </div>{/* end #about */}

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid #e2e8f0', padding: '1.25rem 2.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.65rem',
            color: '#cbd5e1', textAlign: 'center', margin: 0,
          }}>
            githubmaxxing.vercel.app · free · no login required
          </p>
        </div>
      </footer>
    </main>
  );
}
