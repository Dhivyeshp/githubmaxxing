const CATEGORY_LABELS = {
  profile: "Profile Completeness",
  repos: "Repository Quality",
  readmes: "README Quality",
  commits: "Commit Consistency",
  social: "Social Proof",
};

const CATEGORY_NOTES = {
  profile: "Avatar, bio, location, website, profile README",
  repos: "Original repos, descriptions, active maintenance",
  readmes: "Documentation quality across top repos",
  commits: "How recently and consistently you push code",
  social: "Followers and star count signal",
};

function scoreColor(score) {
  if (score >= 75) return "#1D9E75";
  if (score >= 50) return "#EF9F27";
  return "#E24B4A";
}

function progressColor(score) {
  if (score >= 75) return "var(--green)";
  if (score >= 50) return "var(--amber)";
  return "var(--red)";
}

export default function ScoreCard({ category, score }) {
  const label = CATEGORY_LABELS[category] || category;
  const note = CATEGORY_NOTES[category] || "";
  const color = scoreColor(score);
  const barColor = progressColor(score);

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.8rem",
            fontWeight: 500,
            color,
          }}
        >
          {score}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "3px",
          backgroundColor: "var(--border)",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            backgroundColor: barColor,
            borderRadius: "9999px",
            transition: "width 0.6s ease",
          }}
        />
      </div>

      <p
        style={{
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          marginTop: "0.5rem",
          lineHeight: 1.5,
        }}
      >
        {note}
      </p>
    </div>
  );
}
