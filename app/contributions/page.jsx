'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { getErrorMessage } from '@/lib/errors';

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

const POPULAR_LANGUAGES = [
  // Most popular
  'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'C', 'C#',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala', 'Elixir', 'Haskell',
  // Web / markup
  'HTML', 'CSS', 'SCSS', 'Vue', 'Svelte',
  // Scripting / shell
  'Shell', 'Bash', 'PowerShell', 'Perl', 'Lua', 'Tcl',
  // Systems / low-level
  'Zig', 'Nim', 'Crystal', 'Assembly', 'CUDA', 'VHDL', 'Verilog', 'Fortran',
  // Functional
  'OCaml', 'Clojure', 'F#', 'Erlang', 'Racket', 'Scheme', 'Idris', 'Elm',
  // JVM
  'Groovy', 'Clojure',
  // Data / scientific
  'R', 'MATLAB', 'Julia', 'Jupyter Notebook', 'SQL',
  // Config / infra
  'HCL', 'Nix', 'Makefile', 'Dockerfile',
  // Emerging / niche
  'Solidity', 'Move', 'WebAssembly', 'Gleam', 'V',
  // Mobile (GitHub-indexed)
  'Objective-C',
];

// ─── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonLine({ width = '60%', height = '0.875rem' }) {
  return (
    <div style={{
      height,
      width,
      backgroundColor: 'var(--surface-2)',
      borderRadius: '0.375rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

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
    }}>
      <SkeletonLine width="35%" height="0.75rem" />
      <SkeletonLine width="80%" height="1rem" />
      <SkeletonLine width="60%" height="0.75rem" />
      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
        {[1, 2, 3].map((n) => <SkeletonLine key={n} width="4rem" height="1.25rem" />)}
      </div>
    </div>
  );
}

// ─── IssueCard ───────────────────────────────────────────────────────────────

function IssueCard({ issue, matchContext, matchLoading, hasProfile, onSkip }) {
  const repoShortName = issue.repoName.split('/')[1] || issue.repoName;
  const orgName = issue.repoName.split('/')[0] || '';
  const tierBadge = issue.companyTier && issue.company
    ? `Tier ${issue.companyTier} - ${issue.company}`
    : null;
  const labelsLower = (issue.labels || []).map((label) => label.toLowerCase());
  const titleLower = issue.title.toLowerCase();
  const fallbackContext = (() => {
    if (issue.companyTier && issue.company) {
      return `${issue.company} is a Tier ${issue.companyTier} signal, and this ${repoShortName} issue fits your detected stack.`;
    }
    if (labelsLower.some((label) => label.includes('good first') || label.includes('beginner') || label.includes('first-timer'))) {
      return `${repoShortName} marked this as beginner-friendly, so it is a lower-risk way to contribute in your stack.`;
    }
    if (labelsLower.some((label) => label.includes('help wanted'))) {
      return `${repoShortName} is explicitly asking for outside help, which makes this a realistic contribution target.`;
    }
    if (titleLower.includes('doc') || labelsLower.some((label) => label.includes('doc'))) {
      return `This looks documentation-focused, a practical way to learn ${repoShortName} before touching deeper code.`;
    }
    if (titleLower.includes('test') || labelsLower.some((label) => label.includes('test'))) {
      return `Testing issues are good scoped contributions and show maintainers you can improve project reliability.`;
    }
    if (titleLower.includes('bug') || labelsLower.some((label) => label.includes('bug'))) {
      return `A bug fix in ${repoShortName} gives you a clear before-and-after contribution to point to.`;
    }
    return `${repoShortName} matches your selected stack and has an open issue with a recent contribution window.`;
  })();

  const showContextSkeleton = !matchContext && matchLoading && hasProfile;
  const showContextPrompt = !matchContext && !hasProfile;

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
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
        background: 'linear-gradient(180deg, #7c3aed, #a855f7)',
        borderRadius: '0.875rem 0 0 0.875rem',
      }} />

      {/* Repo + age row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-faint)' }}>{orgName}/</span>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{repoShortName}</span>
          </span>
          {tierBadge && (
            <span
              title={issue.companySignal || issue.companyTierLabel || tierBadge}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.56rem',
                color: 'var(--green)',
                backgroundColor: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.22)',
                borderRadius: '0.375rem',
                padding: '0.16rem 0.42rem',
                whiteSpace: 'nowrap',
              }}
            >
              {tierBadge}
            </span>
          )}
        </div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'var(--text-faint)' }}>
          {issue.age}
        </span>
      </div>

      {/* Title */}
      <p style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)',
        margin: 0, lineHeight: 1.45, letterSpacing: '-0.01em',
      }}>
        {issue.title}
      </p>

      {/* Match context */}
      <div style={{
        backgroundColor: 'var(--surface-2)',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        borderLeft: '2px solid rgba(124,58,237,0.3)',
        minHeight: '2rem',
        display: 'flex',
        alignItems: 'center',
      }}>
        {showContextSkeleton ? (
          <SkeletonLine width="70%" height="0.75rem" />
        ) : matchContext ? (
          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.68rem',
            color: 'var(--text-muted)', margin: 0, lineHeight: 1.6,
          }}>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>Why this matches: </span>
            {matchContext}
          </p>
        ) : showContextPrompt ? (
          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.68rem',
            color: 'var(--text-faint)', margin: 0, fontStyle: 'italic',
          }}>
            Enter your username above to see why this issue matches you.
          </p>
        ) : (
          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.68rem',
            color: 'var(--text-muted)', margin: 0, lineHeight: 1.6,
          }}>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>Why this matches: </span>
            {fallbackContext}
          </p>
        )}
      </div>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {issue.labels.slice(0, 4).map((label) => (
            <span key={label} style={{
              fontFamily: "'DM Mono', monospace", fontSize: '0.58rem',
              backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)',
              padding: '0.18rem 0.5rem', borderRadius: '0.375rem',
              border: '1px solid var(--border)',
            }}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.72rem',
            color: 'var(--text-muted)', backgroundColor: 'transparent',
            border: '1px solid var(--border)', borderRadius: '9999px',
            padding: '0.4rem 0.875rem', cursor: 'pointer',
            textDecoration: 'none', display: 'inline-block',
          }}
        >
          Open issue ↗
        </a>
        <button
          onClick={() => onSkip(issue.id)}
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.7rem',
            color: 'var(--text-faint)', backgroundColor: 'transparent',
            border: '1px solid var(--border)', borderRadius: '9999px',
            padding: '0.4rem 0.875rem', cursor: 'pointer',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ─── FilterPill ──────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'DM Mono', monospace", fontSize: '0.68rem',
        backgroundColor: active ? 'var(--green)' : 'var(--surface)',
        color: active ? '#fff' : 'var(--text-muted)',
        border: `1px solid ${active ? 'var(--green)' : 'var(--border)'}`,
        borderRadius: '9999px', padding: '0.3rem 0.75rem',
        cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ─── StackEditor ─────────────────────────────────────────────────────────────

function StackEditor({ languages, setLanguages, detectedFrom, profileSummary }) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!showPicker) return;
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  const filtered = POPULAR_LANGUAGES.filter(
    (l) => !languages.includes(l) && l.toLowerCase().includes(search.toLowerCase())
  );

  const addLanguage = (lang) => {
    if (!languages.includes(lang)) setLanguages((prev) => [...prev, lang]);
    setSearch('');
  };

  const removeLanguage = (lang) => setLanguages((prev) => prev.filter((l) => l !== lang));

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0.875rem', padding: '1rem 1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
            YOUR STACK
            {detectedFrom && (
              <span style={{ color: 'var(--green)', marginLeft: '0.5rem' }}>
                · detected from @{detectedFrom}
              </span>
            )}
          </span>
          {profileSummary?.strengths_summary && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {profileSummary.strengths_summary}
            </span>
          )}
        </div>
        {languages.length > 0 && (
          <button
            onClick={() => setLanguages([])}
            style={{
              fontFamily: "'DM Mono', monospace", fontSize: '0.58rem',
              color: 'var(--text-faint)', background: 'none',
              border: '1px solid var(--border)', borderRadius: '0.375rem',
              padding: '0.15rem 0.45rem', cursor: 'pointer', flexShrink: 0,
            }}
          >
            clear all
          </button>
        )}
      </div>

      {/* Language chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', minHeight: '1.75rem' }}>
        {languages.length === 0 ? (
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.68rem',
            color: 'var(--text-faint)', fontStyle: 'italic',
          }}>
            No languages selected — add some below or enter a username above.
          </span>
        ) : (
          languages.map((lang) => (
            <span
              key={lang}
              onClick={() => removeLanguage(lang)}
              title="Click to remove"
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: '0.68rem',
                backgroundColor: 'rgba(124,58,237,0.1)', color: 'var(--green)',
                padding: '0.25rem 0.65rem', borderRadius: '0.375rem',
                border: '1px solid rgba(124,58,237,0.25)',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              }}
            >
              {lang}
              <span style={{ opacity: 0.6, fontSize: '0.6rem' }}>×</span>
            </span>
          ))
        )}
      </div>

      {/* Add language picker */}
      <div style={{ position: 'relative' }} ref={pickerRef}>
        <button
          onClick={() => setShowPicker((v) => !v)}
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.68rem',
            color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)', borderRadius: '9999px',
            padding: '0.3rem 0.85rem', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>+</span> Add language
        </button>

        {showPicker && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, zIndex: 50,
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', boxShadow: 'var(--shadow)',
            width: '280px', overflow: 'hidden',
          }}>
            <div style={{ padding: '0.5rem' }}>
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search languages..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filtered.length > 0) addLanguage(filtered[0]);
                  if (e.key === 'Escape') { setShowPicker(false); setSearch(''); }
                }}
                style={{
                  width: '100%', fontFamily: "'DM Mono', monospace", fontSize: '0.72rem',
                  color: 'var(--text)', backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: '0.5rem',
                  padding: '0.4rem 0.6rem', outline: 'none',
                }}
              />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '0 0.5rem 0.5rem' }}>
              {filtered.length === 0 ? (
                <p style={{
                  fontFamily: "'DM Mono', monospace", fontSize: '0.65rem',
                  color: 'var(--text-faint)', padding: '0.5rem', margin: 0, textAlign: 'center',
                }}>
                  No results
                </p>
              ) : (
                filtered.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => addLanguage(lang)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      fontFamily: "'DM Mono', monospace", fontSize: '0.72rem',
                      color: 'var(--text)', backgroundColor: 'transparent',
                      border: 'none', borderRadius: '0.375rem',
                      padding: '0.4rem 0.6rem', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {lang}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── UsernameInput ────────────────────────────────────────────────────────────

function UsernameInput({ onDetected, initialUsername = '' }) {
  const [input, setInput] = useState(initialUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setInput(initialUsername);
  }, [initialUsername]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = input.trim().replace(/^@/, '');
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/analyze?username=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'User not found');
      const langs = data.githubData?.repos?.topLanguages || [];
      onDetected(trimmed, langs, data.githubData);
    } catch (err) {
      setError(getErrorMessage(err, 'User not found'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0.875rem', padding: '1rem 1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.625rem',
    }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
        DETECT STACK FROM GITHUB
      </span>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="username"
          style={{
            flex: 1, fontFamily: "'DM Mono', monospace", fontSize: '0.82rem',
            color: 'var(--text)', backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)', borderRadius: '0.5rem',
            padding: '0.45rem 0.75rem', outline: 'none', minWidth: 0,
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: loading || !input.trim() ? 'var(--surface-2)' : 'var(--green)',
            color: loading || !input.trim() ? 'var(--text-faint)' : '#fff',
            border: 'none', borderRadius: '0.5rem', padding: '0.45rem 1rem',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap', transition: 'background-color 0.15s ease',
          }}
        >
          {loading ? 'Detecting...' : 'Detect stack →'}
        </button>
      </form>
      {error && (
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'var(--red)', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function ContributionsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const urlUsername = params.get('u') || '';
  const initialLanguages = params.get('languages')?.split(',').filter(Boolean) || [];

  // Issues state
  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [skipped, setSkipped] = useState(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('gh-skipped-issues') || '{}'); } catch { return {}; }
  });

  // Filter state
  const [difficulty, setDifficulty] = useState('beginner');
  const [minStars, setMinStars] = useState('5');
  const [maxAgeDays, setMaxAgeDays] = useState('30');
  const [languages, setLanguages] = useState(initialLanguages);
  const [detectedFrom, setDetectedFrom] = useState(urlUsername && initialLanguages.length ? urlUsername : '');

  // AI state
  const [profileSummary, setProfileSummary] = useState(null);
  const [matchContexts, setMatchContexts] = useState({});
  const [matchLoading, setMatchLoading] = useState(false);
  const lastMatchBatchRef = useRef('');
  const autoDetectedRef = useRef('');
  const fetchRequestRef = useRef(0);

  const hasStack = languages.length > 0;

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    if (!hasStack) return;
    const requestId = fetchRequestRef.current + 1;
    fetchRequestRef.current = requestId;
    setLoading(true);
    setError('');
    setWarning('');
    try {
      const p = new URLSearchParams({ difficulty, minStars, maxAgeDays, languages: languages.join(',') });
      const res = await fetch(`/api/contributions?${p}`);
      const data = await res.json();
      if (requestId !== fetchRequestRef.current) return;
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setIssues(data.issues || []);
      setTotal(data.total ?? null);
      if (data.warning) setWarning(data.warning);
    } catch (err) {
      if (requestId !== fetchRequestRef.current) return;
      const message = getErrorMessage(err, 'Failed to fetch contributions');
      if (issues.length > 0) {
        setWarning(message);
      } else {
        setError(message);
      }
    } finally {
      if (requestId === fetchRequestRef.current) setLoading(false);
    }
  }, [difficulty, minStars, maxAgeDays, languages, hasStack, issues.length]);

  useEffect(() => {
    const timer = setTimeout(fetchIssues, 250);
    return () => clearTimeout(timer);
  }, [fetchIssues]);

  // Run profile summary when user is detected (optionally enriched with Reddit data)
  async function fetchProfileSummary(githubData, redditData) {
    try {
      const res = await fetch('/api/contributions/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile_summary',
          payload: { githubData, redditData: redditData || null },
        }),
      });
      const data = await res.json();
      if (data.result) {
        setProfileSummary(data.result);
        // Merge primary languages + detected frameworks into one unified chip set
        const detected = [
          ...(data.result.primary_languages || []),
          ...(data.result.frameworks || []),
        ];
        if (detected.length > 0) {
          setLanguages((prev) => {
            const merged = [...prev];
            for (const tech of detected) {
              if (!merged.includes(tech)) merged.push(tech);
            }
            return merged;
          });
        }
      }
    } catch {}
  }

  // Run match batch whenever issues change and profile is ready
  useEffect(() => {
    if (!profileSummary || issues.length === 0) return;
    const aiIssues = issues.slice(0, 12);
    const batchKey = aiIssues.map((i) => i.id).join(',');
    if (lastMatchBatchRef.current === batchKey) return;
    lastMatchBatchRef.current = batchKey;

    setMatchLoading(true);
    fetch('/api/contributions/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'match_batch',
        payload: {
          profileSummary,
          issues: aiIssues.map((i) => ({
            id: String(i.id),
            title: i.title,
            repoName: i.repoName,
            labels: i.labels,
            company: i.company,
            companyTier: i.companyTier,
            companySignal: i.companySignal,
          })),
        },
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.contexts) setMatchContexts((prev) => ({ ...prev, ...d.contexts })); })
      .catch(() => {})
      .finally(() => setMatchLoading(false));
  }, [issues, profileSummary]);

  const handleDetected = useCallback(async (username, langs, githubData) => {
    setDetectedFrom(username);
    setLanguages(langs.length > 0 ? langs : []);
    if (!githubData) return;

    // Race Reddit scrape (3s cap) alongside GitHub profile summary
    let redditData = null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const r = await fetch(
        `/api/contributions/reddit?username=${encodeURIComponent(username)}`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      const d = await r.json();
      if (d.found && d.technologies?.length > 0) redditData = d;
    } catch {}

    fetchProfileSummary(githubData, redditData);
  }, []);

  useEffect(() => {
    if (!urlUsername || initialLanguages.length > 0 || autoDetectedRef.current === urlUsername) return;
    autoDetectedRef.current = urlUsername;

    async function autoDetectFromUrl() {
      try {
        setDetectedFrom(urlUsername);
        const res = await fetch(`/api/analyze?username=${encodeURIComponent(urlUsername)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to detect stack');
        const langs = data.githubData?.repos?.topLanguages || [];
        handleDetected(urlUsername, langs, data.githubData);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to detect stack'));
      }
    }

    autoDetectFromUrl();
  }, [urlUsername, initialLanguages.length, handleDetected]);

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
      <nav style={{
        width: '100%', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'center',
        position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'var(--background)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          background: 'var(--surface)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)', borderRadius: '9999px',
          padding: '0.35rem 0.5rem 0.35rem 1rem', boxShadow: 'var(--shadow-sm)',
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
                color: 'var(--text-muted)', background: 'none', border: 'none',
                cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: '9999px',
              }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => router.push(`/contributions${urlUsername ? `?u=${encodeURIComponent(urlUsername)}` : ''}`)}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 600,
              color: 'var(--green)', backgroundColor: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.18)',
              cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: '9999px',
            }}
          >
            Contribute
          </button>
          {urlUsername && (
            <button
              onClick={() => router.push(`/results?u=${encodeURIComponent(urlUsername)}`)}
              style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 500,
                color: 'var(--text-muted)', background: 'none', border: 'none',
                cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: '9999px',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.65rem',
            color: 'var(--green)', letterSpacing: '0.08em', margin: 0,
          }}>
            // open source maxxer
          </p>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
            fontSize: '1.75rem', letterSpacing: '-0.03em', lineHeight: 1.2,
            color: 'var(--text)', margin: 0,
          }}>
            Issues that match your stack
          </h1>
          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: '0.75rem',
            color: 'var(--text-muted)', margin: 0, lineHeight: 1.6,
          }}>
            Real open source issues filtered to your languages. Ship a contribution, move your graph, impress recruiters.
          </p>
        </div>

        {/* Username input */}
        <UsernameInput onDetected={handleDetected} initialUsername={urlUsername} />

        {/* Stack editor */}
        <StackEditor
          languages={languages}
          setLanguages={setLanguages}
          detectedFrom={detectedFrom}
          profileSummary={profileSummary}
        />

        {/* Filters */}
        {hasStack && (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.875rem', padding: '1rem 1.25rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            {[
              { label: 'DIFFICULTY', options: DIFFICULTY_OPTIONS, value: difficulty, setter: setDifficulty },
              { label: 'REPO STARS', options: STARS_OPTIONS, value: minStars, setter: setMinStars },
              { label: 'ISSUE AGE', options: AGE_OPTIONS, value: maxAgeDays, setter: setMaxAgeDays },
            ].map(({ label, options, value, setter }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
                  {label}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {options.map((opt) => (
                    <FilterPill key={opt.value} label={opt.label} active={value === opt.value} onClick={() => setter(opt.value)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No stack prompt */}
        {!hasStack && (
          <div style={{
            textAlign: 'center', padding: '2.5rem 1rem',
            border: '1px dashed var(--border)', borderRadius: '0.875rem',
            display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center',
          }}>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', margin: 0 }}>
              Add your stack to see matches
            </p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              Enter your GitHub username above to auto-detect, or pick languages manually.
            </p>
          </div>
        )}

        {/* Results header */}
        {hasStack && !loading && !error && total !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              Showing {visibleIssues.length} of {total.toLocaleString()} matches
              {Object.keys(skipped).length > 0 && (
                <button
                  onClick={() => {
                    setSkipped({});
                    try { localStorage.removeItem('gh-skipped-issues'); } catch {}
                  }}
                  style={{
                    marginLeft: '0.75rem', fontFamily: "'DM Mono', monospace",
                    fontSize: '0.62rem', color: 'var(--text-faint)',
                    background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
                  }}
                >
                  restore skipped
                </button>
              )}
            </p>
            {warning && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'var(--amber)', margin: 0 }}>
                Showing cached results. {warning}
              </p>
            )}
          </div>
        )}

        {/* Issue list */}
        {hasStack && (
          error ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--red)', margin: 0 }}>{error}</p>
              <button
                onClick={fetchIssues}
                style={{
                  fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--text-muted)',
                  background: 'none', border: '1px solid var(--border)', borderRadius: '9999px',
                  padding: '0.4rem 1rem', cursor: 'pointer',
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
            <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
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
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  matchContext={matchContexts[String(issue.id)] || null}
                  matchLoading={matchLoading}
                  hasProfile={!!profileSummary}
                  onSkip={handleSkip}
                />
              ))}
            </div>
          )
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
        minHeight: '100vh', backgroundColor: 'var(--background)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Mono', monospace", color: 'var(--green)', fontSize: '0.875rem',
      }}>
        Loading...
      </div>
    }>
      <ContributionsContent />
    </Suspense>
  );
}
