'use client';

export default function ShareCard({ username, score, label }) {
  function handleShare() {
    const text = `My GitHub profile scored ${score}/100 on GitHub Maxxing (${label}) — githubmaxxing.vercel.app`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}
      >
        Share your score.{" "}
        <span style={{ color: "var(--text)" }}>
          Challenge friends to beat it.
        </span>
      </p>
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
        Share {label} ↗
      </button>
    </div>
  );
}
