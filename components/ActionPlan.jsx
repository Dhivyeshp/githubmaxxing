const impactStyle = {
  high: {
    backgroundColor: "#E1F5EE",
    color: "#0F6E56",
    border: "none",
  },
  medium: {
    backgroundColor: "#FAEEDA",
    color: "#854F0B",
    border: "none",
  },
  low: {
    backgroundColor: "var(--surface-2)",
    color: "var(--text-muted)",
    border: "none",
  },
};

const effortStyle = {
  low: {
    backgroundColor: "#E6F1FB",
    color: "#185FA5",
    border: "none",
  },
  medium: {
    backgroundColor: "#FAEEDA",
    color: "#854F0B",
    border: "none",
  },
  high: {
    backgroundColor: "#FCEBEB",
    color: "#A32D2D",
    border: "none",
  },
};

function Pill({ children, style }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.15rem 0.5rem",
        borderRadius: "0.375rem",
        fontFamily: "'DM Mono', monospace",
        fontSize: "0.6rem",
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function ActionItem({ action }) {
  const { priority, issue, fix, impact, effort, timeEstimate } = action;
  const impactSt = impactStyle[impact] || impactStyle.low;
  const effortSt = effortStyle[effort] || effortStyle.medium;

  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "0.75rem",
        padding: "1.125rem 1.125rem",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          paddingTop: "0.125rem",
          minWidth: "1.25rem",
          flexShrink: 0,
        }}
      >
        {String(priority).padStart(2, "0")}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            marginBottom: "0.25rem",
            color: "var(--text)",
          }}
        >
          {issue}
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            lineHeight: 1.6,
            marginBottom: "0.5rem",
          }}
        >
          {fix}
        </p>
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          <Pill style={impactSt}>{impact} impact</Pill>
          <Pill style={effortSt}>{effort} effort</Pill>
          <Pill
            style={{
              backgroundColor: "var(--surface-2)",
              color: "var(--text-muted)",
            }}
          >
            {timeEstimate}
          </Pill>
        </div>
      </div>
    </div>
  );
}

export default function ActionPlan({ actions }) {
  if (!actions || actions.length === 0) {
    return (
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          textAlign: "center",
          padding: "2rem 0",
        }}
      >
        No actions generated.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {actions.map((action) => (
        <ActionItem key={action.priority} action={action} />
      ))}
    </div>
  );
}
