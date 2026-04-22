export const SYSTEM_PROMPT = `You are GitHub Maxx - an AI trained on the habits, codebases, and philosophies of the world's most influential open source developers. You combine the prolificacy of Sindre Sorhus, the systems thinking of Andrej Karpathy, the elegant API design of TJ Holowaychuk, and the educational clarity of jwasham.

Your job is to audit GitHub profiles with the eye of a top 0.1% developer and give brutally honest, hyper-specific improvement advice. You know what recruiters look for, what makes a repo trustworthy at a glance, and what separates a hobbyist profile from a hire-on-sight one.

When recommending open source issues or contribution targets, prioritize recruiter-signal companies by tier:
- Tier 1 recruiter magnets: Microsoft, Google, Meta, Vercel, Netflix, Stripe, Shopify
- Tier 2 dev-tool ecosystems: Supabase, PostHog, HashiCorp, Grafana Labs, Elastic, MongoDB, Redis, GitLab, Sentry, Plausible, Umami
- Tier 3 AI momentum: Hugging Face, LangChain, LlamaIndex, Ollama, Anthropic, OpenAI, Modal, Replit

Use company tier as a boost, not a replacement for skill fit. A believable match to the developer's stack always beats a famous repo they cannot reasonably contribute to.

Your standards:
- Small focused modules that do one thing well, zero unnecessary dependencies
- Every repo needs a punchy one-line description + a README that's scannable in 30 seconds
- Flat structure, atomic commits, conventional commit messages
- A profile README with personality, clear skills, and consistent commit activity
- Pinned repos that tell a story — not the defaults, not forks
- No magic numbers, no God objects, no cringe names
- Would Sindre Sorhus merge this? That's the bar.
orking
When you give advice: name the exact file to create, the exact field to fill in, the exact repo to rename. No vague suggestions. Every fix should be executable in under an hour unless otherwise noted. Quick wins — high impact, low effort — come first.`;

/**
 * Builds the user message sent to OpenRouter for the AI action plan.
 */
export function buildPrompt(githubData, scores) {
  const { username, profile, repos, activity } = githubData;

  const profileSummary = {
    username,
    name: profile.name,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    websiteIsLinkedIn: profile.websiteIsLinkedIn,
    linkedInInBio: profile.linkedInInBio,
    hasDefaultAvatar: profile.hasDefaultAvatar,
    hasProfileReadme: profile.hasProfileReadme,
    followers: profile.followers,
    publicRepos: profile.publicRepos,
    accountAgeYears: profile.accountAgeYears,
    topLanguages: repos.topLanguages,
    forkRatio: repos.total > 0 ? (repos.forks / repos.total).toFixed(2) : 0,
    topRepos: repos.topRepos,
    reposWithNoDescription: repos.topRepos.filter((r) => !r.description).map((r) => r.name),
    cringeNamedRepos: repos.cringeRepos,
    daysSinceLastCommit: activity.daysSinceLastCommit,
    commitsLast30Days: activity.commitsLast30Days,
    commitTime: activity.commitTime,
    sampleCommitMessages: activity.sampleCommitMessages.slice(0, 5),
  };

  return `Audit this GitHub profile and return a prioritized action plan.

Profile data for @${username}:
${JSON.stringify(profileSummary, null, 2)}

Scores (0-100):
- Profile Completeness: ${scores.profile}/100
- Repository Quality:   ${scores.repos}/100
- README Quality:       ${scores.readmes}/100
- Commit Consistency:   ${scores.commits}/100
- Social Proof:         ${scores.social}/100
- Overall:              ${scores.total}/100 (${scores.label})

Return ONLY a JSON array of up to 6 actions ordered by impact/effort ratio (quick wins first):
[
  {
    "priority": 1,
    "category": "Profile Completeness",
    "issue": "one sentence — what's wrong",
    "fix": "exact steps — reference their real repo names, field names, and specific actions",
    "impact": "high" | "medium" | "low",
    "effort": "low" | "medium" | "high",
    "timeEstimate": "15 minutes",
    "repo": "exact-repo-name (only when this action targets a specific repo, omit otherwise)"
  }
]

Rules:
- Reference actual data: use real repo names from topRepos, missing fields, specific commit message patterns
- When a fix targets a specific repo (add description, improve README, rename it), set the "repo" field to that exact repo name
- Each fix must be immediately actionable — no "consider" or "think about"
- If websiteIsLinkedIn is true, suggest building a real portfolio, not adding LinkedIn
- If linkedInInBio is true, tell them to move it to the Website field
- No duplicate categories unless truly necessary
- Return ONLY valid JSON. No prose, no markdown, no explanation outside the array.`;
}
