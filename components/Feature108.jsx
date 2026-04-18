"use client";

import { useState, useEffect, useRef } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { User, Package, FileText, GitCommitHorizontal, Link2 } from "lucide-react";

const TABS = [
  {
    value: "profile",
    icon: <User className="h-4 w-4 shrink-0" />,
    label: "Profile",
    pts: 55,
    badge: "First impression",
    title: "Every recruiter checks these 6 fields.",
    description:
      "Bio, avatar, location, website, pronouns, and README — your profile is a landing page. Most developers leave half of it empty and wonder why nobody clicks through.",
    preview: <ProfilePreview />,
  },
  {
    value: "repos",
    icon: <Package className="h-4 w-4 shrink-0" />,
    label: "Repos",
    pts: 70,
    badge: "Portfolio depth",
    title: "Pinned repos tell your story. Most tell nothing.",
    description:
      "We check how many repos are pinned, the diversity of languages, stars, forks, and whether your top projects have descriptions. Quality beats quantity.",
    preview: <ReposPreview />,
  },
  {
    value: "readmes",
    icon: <FileText className="h-4 w-4 shrink-0" />,
    label: "READMEs",
    pts: 50,
    badge: "Documentation",
    title: "A repo without a README is a black box.",
    description:
      "We check every pinned repo for a README and score the length and structure. If a recruiter can't understand your project in 30 seconds, they move on.",
    preview: <ReadmePreview />,
  },
  {
    value: "commits",
    icon: <GitCommitHorizontal className="h-4 w-4 shrink-0" />,
    label: "Commits",
    pts: 75,
    badge: "Activity signal",
    title: "Your contribution graph is a heartbeat.",
    description:
      "Consistency, recency, and depth. We look at whether you ship regularly, how recently you committed, and whether you contribute across multiple projects.",
    preview: <CommitsPreview />,
  },
  {
    value: "social",
    icon: <Link2 className="h-4 w-4 shrink-0" />,
    label: "Social",
    pts: 25,
    badge: "Network effect",
    title: "External links compound your credibility.",
    description:
      "Twitter/X, LinkedIn, a personal site — each one is a signal that you exist beyond GitHub. Followers and external links increase trust and discoverability.",
    preview: <SocialPreview />,
  },
];

function ProfilePreview() {
  return (
    <div style={{ padding: "1.5rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#a855f7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.2rem" }}>D</div>
        <div>
          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>dhivyeshp</div>
          <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Dhivyesh Rathi</div>
        </div>
        <div style={{ marginLeft: "auto", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "9999px", padding: "0.2rem 0.7rem", fontSize: "0.7rem", color: "#16a34a", fontFamily: "var(--font-mono)" }}>✓ avatar</div>
      </div>
      {[
        { label: "Bio", value: "Building stuff that matters", ok: true },
        { label: "Location", value: "San Francisco, CA", ok: true },
        { label: "Website", value: "dhivyesh.dev", ok: true },
        { label: "Twitter", value: "—", ok: false },
        { label: "Pronouns", value: "—", ok: false },
      ].map(({ label, value, ok }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.45rem 0", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontFamily: "var(--font-mono)", width: 72 }}>{label}</span>
          <span style={{ fontSize: "0.82rem", color: ok ? "#0f172a" : "#cbd5e1", flex: 1, paddingLeft: "0.75rem" }}>{value}</span>
          <span style={{ fontSize: "0.7rem" }}>{ok ? "✅" : "❌"}</span>
        </div>
      ))}
    </div>
  );
}

function ReposPreview() {
  const repos = [
    { name: "portfolio-v2", lang: "TypeScript", stars: 12, pinned: true },
    { name: "algo-notes", lang: "Python", stars: 34, pinned: true },
    { name: "random-script", lang: "Shell", stars: 0, pinned: false },
  ];
  return (
    <div style={{ padding: "1.5rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "#94a3b8", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pinned repositories</div>
      {repos.map((r) => (
        <div key={r.name} style={{ background: r.pinned ? "#ffffff" : "#f8fafc", border: `1px solid ${r.pinned ? "#e9d5ff" : "#e2e8f0"}`, borderRadius: "0.75rem", padding: "0.85rem 1rem", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Package style={{ width: 14, height: 14, color: "#a855f7", flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a", flex: 1 }}>{r.name}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "#64748b" }}>{r.lang}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "#94a3b8" }}>★ {r.stars}</span>
          {!r.pinned && <span style={{ fontSize: "0.65rem", color: "#f59e0b", background: "#fef3c7", borderRadius: "9999px", padding: "0.1rem 0.5rem" }}>not pinned</span>}
        </div>
      ))}
    </div>
  );
}

function ReadmePreview() {
  return (
    <div style={{ padding: "1.5rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ background: "#ffffff", border: "1px solid #e9d5ff", borderRadius: "0.75rem", padding: "1rem 1.25rem", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
          <FileText style={{ width: 13, height: 13, color: "#a855f7" }} />
          <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "#0f172a" }}>portfolio-v2</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#16a34a", background: "#f0fdf4", borderRadius: "9999px", padding: "0.1rem 0.5rem" }}>README ✓</span>
        </div>
        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, marginBottom: 4 }}><div style={{ height: "100%", width: "75%", background: "#a855f7", borderRadius: 4 }} /></div>
        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, marginBottom: 4 }}><div style={{ height: "100%", width: "55%", background: "#e9d5ff", borderRadius: 4 }} /></div>
        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4 }}><div style={{ height: "100%", width: "40%", background: "#e9d5ff", borderRadius: 4 }} /></div>
      </div>
      <div style={{ background: "#ffffff", border: "1px solid #fee2e2", borderRadius: "0.75rem", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText style={{ width: 13, height: 13, color: "#94a3b8" }} />
          <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "#94a3b8" }}>random-script</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#ef4444", background: "#fef2f2", borderRadius: "9999px", padding: "0.1rem 0.5rem" }}>no README ✗</span>
        </div>
        <p style={{ fontSize: "0.72rem", color: "#fca5a5", margin: "0.5rem 0 0", fontFamily: "var(--font-mono)" }}>-8 pts · add README.md to recover</p>
      </div>
    </div>
  );
}

function CommitsPreview() {
  const weeks = Array.from({ length: 20 }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => {
      const v = Math.random();
      return wi > 14 && v > 0.6 ? 0 : v > 0.7 ? 3 : v > 0.45 ? 2 : v > 0.25 ? 1 : 0;
    })
  );
  const colors = ["#f1f5f9", "#e9d5ff", "#c084fc", "#a855f7", "#7c3aed"];
  return (
    <div style={{ padding: "1.5rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "#94a3b8", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Contribution graph</div>
      <div style={{ display: "flex", gap: 3, marginBottom: "0.75rem" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((level, di) => (
              <div key={di} style={{ width: 10, height: 10, borderRadius: 2, background: colors[level] }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.5rem", padding: "0.4rem 0.75rem", fontSize: "0.75rem", color: "#16a34a" }}>✓ 142 commits this year</div>
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "0.5rem", padding: "0.4rem 0.75rem", fontSize: "0.75rem", color: "#92400e" }}>⚠ gap in last 3 weeks</div>
      </div>
    </div>
  );
}

function SocialPreview() {
  const links = [
    { label: "Twitter / X", handle: "@dhivyeshp", ok: true },
    { label: "LinkedIn", handle: "in/dhivyesh", ok: true },
    { label: "Website", handle: "—", ok: false },
    { label: "Blog", handle: "—", ok: false },
  ];
  return (
    <div style={{ padding: "1.5rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "#94a3b8", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>External presence</div>
      {links.map(({ label, handle, ok }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.9rem", borderRadius: "0.6rem", marginBottom: "0.5rem", background: ok ? "#faf5ff" : "#f8fafc", border: `1px solid ${ok ? "#e9d5ff" : "#e2e8f0"}` }}>
          <Link2 style={{ width: 13, height: 13, color: ok ? "#a855f7" : "#cbd5e1", flexShrink: 0 }} />
          <span style={{ fontSize: "0.8rem", fontWeight: 500, color: ok ? "#0f172a" : "#94a3b8", flex: 1 }}>{label}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: ok ? "#7c3aed" : "#cbd5e1" }}>{handle}</span>
          <span>{ok ? "✅" : "❌"}</span>
        </div>
      ))}
    </div>
  );
}

export default function Feature108() {
  const [active, setActive] = useState(TABS[0].value);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { setInView(entry.isIntersecting); },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const fadeUp = (delay) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(32px)",
    transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });

  return (
    <section ref={sectionRef} style={{ background: "#fdfcff", padding: "7rem 2.5rem" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem", ...fadeUp(0) }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            border: "1px solid #e9d5ff", backgroundColor: "#faf5ff",
            borderRadius: "9999px", padding: "0.3rem 0.9rem",
            fontFamily: "var(--font-mono)", fontSize: "0.7rem",
            color: "#7c3aed", marginBottom: "1rem",
          }}>
            how it works
          </div>
          <h2 style={{
            fontFamily: "var(--font-sans)", fontWeight: 800,
            fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
            letterSpacing: "-0.03em", color: "#0f172a", margin: "0 0 0.75rem",
          }}>
            Scored across 5 categories.
          </h2>
          <p style={{ fontSize: "1rem", color: "#64748b", maxWidth: "440px", margin: "0 auto", lineHeight: 1.65 }}>
            Every point has a reason. Every deduction has a fix.
          </p>
        </div>

        {/* Tab bar */}
        <Tabs.Root value={active} onValueChange={setActive}>
          <Tabs.List style={{
            display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.375rem",
            marginBottom: "2.5rem", ...fadeUp(120),
          }}>
            {TABS.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.45rem 1rem", borderRadius: "9999px",
                  border: active === tab.value ? "1px solid #a855f7" : "1px solid #e2e8f0",
                  background: active === tab.value ? "#faf5ff" : "#ffffff",
                  color: active === tab.value ? "#7c3aed" : "#64748b",
                  fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.8rem",
                  cursor: "pointer", transition: "all 0.15s",
                  outline: "none",
                }}
              >
                {tab.icon} {tab.label}
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                  color: active === tab.value ? "#a855f7" : "#94a3b8",
                  marginLeft: "0.15rem",
                }}>{tab.pts}pt</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Tab content */}
          {TABS.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value} className="tab-content-panel" style={fadeUp(240)}>
              <div key={active} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem",
                alignItems: "center", background: "#ffffff",
                border: "1px solid #e9d5ff", borderRadius: "1.5rem",
                overflow: "hidden",
              }} className="feature-tab-grid">
                {/* Left: text */}
                <div style={{ padding: "3rem" }} className="tab-content-left">
                  <div style={{
                    display: "inline-flex", alignItems: "center",
                    border: "1px solid #e9d5ff", backgroundColor: "#faf5ff",
                    borderRadius: "9999px", padding: "0.25rem 0.75rem",
                    fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                    color: "#7c3aed", marginBottom: "1.25rem",
                  }}>
                    {tab.badge}
                  </div>
                  <h3 style={{
                    fontFamily: "var(--font-sans)", fontWeight: 800,
                    fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)",
                    letterSpacing: "-0.025em", color: "#0f172a",
                    lineHeight: 1.2, margin: "0 0 1rem",
                  }}>
                    {tab.title}
                  </h3>
                  <p style={{ fontSize: "0.92rem", color: "#64748b", lineHeight: 1.7, margin: "0 0 1.75rem" }}>
                    {tab.description}
                  </p>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#7c3aed",
                    background: "#faf5ff", border: "1px solid #e9d5ff",
                    borderRadius: "0.5rem", padding: "0.4rem 0.75rem",
                  }}>
                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>{tab.pts}</span> points available
                  </div>
                </div>

                {/* Right: preview */}
                <div style={{ background: "#faf5ff", borderLeft: "1px solid #e9d5ff", minHeight: 300 }} className="tab-content-right">
                  {tab.preview}
                </div>
              </div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .feature-tab-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
