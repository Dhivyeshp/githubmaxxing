/**
 * Scoring system for GitHub profile analysis.
 * All categories scored 0-100. Final score is weighted average.
 *
 * Weights:
 *   Profile Completeness: 20%
 *   Repository Quality:   25%
 *   README Quality:       20%
 *   Commit Consistency:   20%
 *   Social Proof:         15%
 */

function scoreProfileCompleteness(profile) {
  let score = 0;
  if (!profile.hasDefaultAvatar) score += 15;
  if (profile.bio && profile.bio.length > 20) score += 20;
  if (profile.location) score += 10;
  if (profile.website) score += 15;
  if (profile.hasProfileReadme) score += 40;
  return Math.min(score, 100);
}

function scoreRepositoryQuality(repos) {
  let score = 100;
  const { total, forks, noDescription, cringeRepos, daysSinceLastPush } = repos;

  if (total > 0 && forks / total > 0.5) score -= 20;

  if (total > 0) {
    const noDescPct = noDescription / total;
    if (noDescPct > 0.3) {
      const overage = Math.floor((noDescPct - 0.3) / 0.1);
      score -= Math.min(overage * 15, 45);
    }
  }

  const cringePenalty = Math.min(cringeRepos.length * 10, 30);
  score -= cringePenalty;

  if (daysSinceLastPush !== null) {
    if (daysSinceLastPush > 90) score -= 25;
    else if (daysSinceLastPush > 30) score -= 10;
  }

  return Math.max(score, 0);
}

function scoreReadmeQuality(readmes) {
  if (!readmes || readmes.length === 0) return 0;
  let score = 0;
  for (const { length } of readmes) {
    if (length > 0) score += 10;
    if (length > 200) score += 5;
    if (length > 1000) score += 5;
  }
  // Max possible = 20 per repo × 5 repos = 100, but we only score sampled repos
  // Normalise to 100 based on how many were sampled
  const maxPossible = readmes.length * 20;
  return Math.round((score / maxPossible) * 100);
}

function scoreCommitConsistency(activity, repos) {
  // Events API only keeps ~90 days of history — fall back to repo push date when empty
  const days = activity.daysSinceLastCommit ?? repos?.daysSinceLastPush ?? null;
  if (days === null) return 0;
  if (days <= 7) return 100;
  if (days <= 30) return 75;
  if (days <= 90) return 40;
  if (days <= 180) return 20;
  return 0;
}

function scoreSocialProof(profile, repos) {
  const { followers } = profile;
  let score;
  if (followers > 100) score = 100;
  else if (followers > 50) score = 75;
  else if (followers > 20) score = 50;
  else if (followers > 5) score = 25;
  else score = 10;

  if (repos.topStarCount > 10) score = Math.min(score + 10, 100);
  return score;
}

function getScoreLabel(total) {
  if (total >= 90) return "S Tier";
  if (total >= 75) return "A Tier";
  if (total >= 60) return "B Tier";
  if (total >= 40) return "C Tier";
  return "D Tier";
}

function getScoreVerdict(total, actions) {
  const quickWins = actions > 0 ? `${actions} quick win${actions !== 1 ? "s" : ""} available` : "keep it up";
  if (total >= 90) return `recruiter bait · ${quickWins}`;
  if (total >= 75) return `solid profile · ${quickWins}`;
  if (total >= 60) return `good bones · ${quickWins}`;
  if (total >= 40) return `needs work · ${quickWins}`;
  return `start from scratch · ${quickWins}`;
}

/**
 * Generates deterministic action items from scores + githubData.
 * Used as a fallback when the AI insights call fails.
 */
export function generateFallbackActions(githubData, scores) {
  const { username, profile, repos, activity } = githubData;
  const actions = [];

  // Profile README — highest leverage quick win
  if (!profile.hasProfileReadme) {
    actions.push({
      priority: actions.length + 1,
      category: "Profile Completeness",
      issue: "No profile README",
      fix: `Create a repo named exactly '${username}' and add a README.md. It appears at the top of your GitHub profile and is the #1 thing recruiters see. Add a short intro, your stack, and what you're working on.`,
      impact: "high",
      effort: "low",
      timeEstimate: "15 minutes",
    });
  }

  // Bio
  if (!profile.bio || profile.bio.length < 20) {
    actions.push({
      priority: actions.length + 1,
      category: "Profile Completeness",
      issue: "Missing or too-short bio",
      fix: "Add a bio (Settings → Edit profile) that says what you do and what you're looking for. Keep it under 160 chars: role, stack, and one line about what you build.",
      impact: "high",
      effort: "low",
      timeEstimate: "5 minutes",
    });
  }

  // Website / LinkedIn
  if (profile.linkedInInBio) {
    actions.push({
      priority: actions.length + 1,
      category: "Profile Completeness",
      issue: "LinkedIn URL is buried in your bio, not the Website field",
      fix: "Go to Settings → Edit profile → Website and paste your LinkedIn URL there. It becomes a clickable link at the top of your profile instead of plain text in your bio that most people miss.",
      impact: "medium",
      effort: "low",
      timeEstimate: "2 minutes",
    });
  } else if (!profile.website) {
    actions.push({
      priority: actions.length + 1,
      category: "Profile Completeness",
      issue: "No website or portfolio link",
      fix: "Add a URL to Settings → Edit profile → Website. A personal portfolio is best, but even your LinkedIn URL beats nothing — it signals you're hireable and gives recruiters a next step.",
      impact: "medium",
      effort: "low",
      timeEstimate: "2 minutes",
    });
  } else if (profile.websiteIsLinkedIn) {
    actions.push({
      priority: actions.length + 1,
      category: "Profile Completeness",
      issue: "Website is LinkedIn — consider building a portfolio",
      fix: "LinkedIn is a solid start, but a personal portfolio site (even a simple one-pager on GitHub Pages or Vercel) shows off your actual work and is more memorable to hiring managers than a LinkedIn profile.",
      impact: "medium",
      effort: "high",
      timeEstimate: "2–4 hours",
    });
  }

  // Repo descriptions
  if (repos.noDescription > 3) {
    actions.push({
      priority: actions.length + 1,
      category: "Repository Quality",
      issue: `${repos.noDescription} repos have no description`,
      fix: "Add a one-line description to your top repos. Click the gear icon on each repo page. Recruiters scan descriptions to decide whether to click in — missing ones get skipped.",
      impact: "medium",
      effort: "low",
      timeEstimate: "20 minutes",
    });
  }

  // README quality
  if (scores.readmes < 60) {
    actions.push({
      priority: actions.length + 1,
      category: "README Quality",
      issue: "READMEs are thin or missing across your repos",
      fix: "Pick your 3 best non-fork repos and add proper READMEs: what it does, how to run it, and a screenshot if applicable. Use a template like: Problem → Solution → Tech Stack → Setup → Demo.",
      impact: "high",
      effort: "medium",
      timeEstimate: "1-2 hours",
    });
  }

  // Social proof / followers
  if (scores.social < 50) {
    actions.push({
      priority: actions.length + 1,
      category: "Social Proof",
      issue: "Low follower count reduces perceived credibility",
      fix: "Follow developers in your stack and engage with their repos — star projects you use, open quality issues, submit small PRs. Genuine engagement compounds over time and raises your profile visibility.",
      impact: "medium",
      effort: "medium",
      timeEstimate: "ongoing",
    });
  }

  // Cringe repo names
  if (repos.cringeRepos && repos.cringeRepos.length > 0) {
    actions.push({
      priority: actions.length + 1,
      category: "Repository Quality",
      issue: `Weak repo names: ${repos.cringeRepos.slice(0, 3).join(", ")}`,
      fix: "Rename or archive these repos. Recruiters browse your repo list — names like 'test' or 'practice' signal hobby-level work. Either delete them or give them descriptive names that reflect what the project actually does.",
      impact: "medium",
      effort: "low",
      timeEstimate: "10 minutes",
    });
  }

  return actions.slice(0, 6);
}

export function computeScores(githubData) {
  const { profile, repos, readmes, activity } = githubData;

  const categories = {
    profile: scoreProfileCompleteness(profile),
    repos: scoreRepositoryQuality(repos),
    readmes: scoreReadmeQuality(readmes),
    commits: scoreCommitConsistency(activity, repos),
    social: scoreSocialProof(profile, repos),
  };

  const weights = {
    profile: 0.20,
    repos: 0.25,
    readmes: 0.20,
    commits: 0.20,
    social: 0.15,
  };

  const total = Math.round(
    Object.entries(categories).reduce(
      (sum, [key, val]) => sum + val * weights[key],
      0
    )
  );

  const label = getScoreLabel(total);

  return { ...categories, total, label };
}
