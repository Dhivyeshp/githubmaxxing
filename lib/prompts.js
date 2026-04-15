/**
 * Builds the prompt sent to OpenRouter for the AI action plan.
 * Returns a JSON array of up to 6 prioritised actions.
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
    reposWithNoDescription: repos.noDescription,
    cringeNamedRepos: repos.cringeRepos,
    daysSinceLastCommit: activity.daysSinceLastCommit,
    commitsLast30Days: activity.commitsLast30Days,
    commitTime: activity.commitTime,
    sampleCommitMessages: activity.sampleCommitMessages.slice(0, 5),
  };

  return `You are a brutally honest career coach and GitHub expert.

Here is the GitHub profile data for ${username}:
${JSON.stringify(profileSummary, null, 2)}

Their scores:
- Profile Completeness: ${scores.profile}/100
- Repository Quality: ${scores.repos}/100
- README Quality: ${scores.readmes}/100
- Commit Consistency: ${scores.commits}/100
- Social Proof: ${scores.social}/100
- Overall: ${scores.total}/100 (${scores.label})

Give them a prioritized action plan. Return ONLY a JSON array of actions, like:
[
  {
    "priority": 1,
    "category": "Profile Completeness",
    "issue": "Missing profile README",
    "fix": "Create a repo named exactly '${username}' and add a README.md — this shows up on your profile page and is the #1 thing recruiters see",
    "impact": "high",
    "effort": "low",
    "timeEstimate": "15 minutes"
  }
]

Be specific. Reference their actual data (repo names, missing fields, etc.).
Order by impact/effort ratio — quick wins first.
Max 6 actions. No fluff. Return ONLY valid JSON, no prose outside the array.`;
}
