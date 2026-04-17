'use client';

import { useState } from 'react';

export default function ShareCard({ username, score, label }) {
  const [badgeCopied, setBadgeCopied] = useState(false);

  const badgeMarkdown = `[![githubmaxxing score](https://githubmaxxing.vercel.app/api/badge?username=${username})](https://githubmaxxing.vercel.app)`;

  function handleShare() {
    const url = `https://githubmaxxing.vercel.app/share/${username}`;
    const summary = `My GitHub profile scored ${score}/100 (${label}) on GitHub Maxxing — a free tool that audits your profile and gives you a ranked action plan.`;
    window.open(
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(`GitHub score: ${score}/100 · ${label}`)}&summary=${encodeURIComponent(summary)}&source=githubmaxxing`,
      "_blank",
      "width=600,height=600"
    );
  }

  function handleCopyBadge() {
    navigator.clipboard.writeText(badgeMarkdown).then(() => {
      setBadgeCopied(true);
      setTimeout(() => setBadgeCopied(false), 2000);
    });
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--text-muted)",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Share your score.{" "}
        <span style={{ color: "var(--text)" }}>
          Challenge friends to beat it.
        </span>
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {/* Share on X */}
        <button
          onClick={handleShare}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 1rem",
            border: "1px solid var(--border)",
            borderRadius: "0.375rem",
            backgroundColor: "transparent",
            color: "var(--text)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: "0.75rem",
            cursor: "pointer",
            transition: "border-color 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.borderColor = "var(--text-muted)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.borderColor = "var(--border)")
          }
        >
          Share on LinkedIn ↗
        </button>

        {/* Copy badge */}
        <button
          onClick={handleCopyBadge}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 1rem",
            border: `1px solid ${badgeCopied ? '#c4b5fd' : 'var(--border)'}`,
            borderRadius: "0.375rem",
            backgroundColor: badgeCopied ? "#ede9fe" : "transparent",
            color: badgeCopied ? "#7c3aed" : "var(--text-muted)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.65rem",
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          {badgeCopied ? "✓ badge copied" : "copy badge"}
        </button>
      </div>

      {/* Badge preview */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.625rem 0.875rem",
          backgroundColor: "var(--surface-2)",
          borderRadius: "0.5rem",
          border: "1px solid var(--border)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/badge?username=${username}`}
          alt={`${username} githubmaxxing score`}
          height="20"
        />
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6rem",
            color: "var(--text-faint)",
          }}
        >
          embed in your profile README
        </span>
      </div>
    </div>
  );
}
