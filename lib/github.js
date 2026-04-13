const GITHUB_API = "https://api.github.com";

function getHeaders() {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${url}`);
  }
  return res.json();
}

function analyzeRepos(repos) {
  const forks = repos.filter((r) => r.fork).length;
  const originals = repos.length - forks;

  const languageCounts = {};
  for (const repo of repos) {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  }
  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  const emptyRepos = repos.filter(
    (r) => r.stargazers_count === 0 && r.forks_count === 0 && !r.description
  ).length;

  const suspiciousNames = repos
    .filter((r) =>
      /test|practice|tutorial|homework|untitled/i.test(r.name)
    )
    .map((r) => r.name);

  const recentRepo = repos.length > 0 ? repos[0].name : null;

  return {
    total: repos.length,
    forks,
    originals,
    topLanguages,
    emptyRepos,
    suspiciousNames,
    recentRepo,
    repoNames: repos.slice(0, 20).map((r) => r.name),
  };
}

function analyzeEvents(events) {
  const pushEvents = events.filter((e) => e.type === "PushEvent");

  const hourCounts = Array(24).fill(0);
  for (const event of pushEvents) {
    const hour = new Date(event.created_at).getUTCHours();
    hourCounts[hour]++;
  }

  let peakHour = 0;
  for (let i = 1; i < 24; i++) {
    if (hourCounts[i] > hourCounts[peakHour]) peakHour = i;
  }

  let commitTime;
  if (peakHour >= 5 && peakHour < 12) commitTime = "morning";
  else if (peakHour >= 12 && peakHour < 18) commitTime = "afternoon";
  else if (peakHour >= 18 && peakHour < 23) commitTime = "night";
  else commitTime = "3am (concerning)";

  let daysSinceLastCommit = null;
  if (pushEvents.length > 0) {
    const last = new Date(pushEvents[0].created_at);
    daysSinceLastCommit = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
  }

  const messages = pushEvents
    .flatMap((e) => e.payload?.commits?.map((c) => c.message) ?? [])
    .slice(0, 20);

  return { commitTime, daysSinceLastCommit, sampleCommitMessages: messages };
}

export async function fetchGitHubData(username) {
  const [user, repos, events] = await Promise.all([
    fetchJSON(`${GITHUB_API}/users/${username}`),
    fetchJSON(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`),
    fetchJSON(`${GITHUB_API}/users/${username}/events/public?per_page=100`),
  ]);

  const defaultAvatarPattern = /avatars\.githubusercontent\.com\/u\/\d+\?v=4$/;
  const hasDefaultAvatar = defaultAvatarPattern.test(user.avatar_url);

  const accountCreated = new Date(user.created_at);
  const accountAgeYears = (
    (Date.now() - accountCreated) /
    (1000 * 60 * 60 * 24 * 365)
  ).toFixed(1);

  return {
    profile: {
      name: user.name,
      bio: user.bio,
      location: user.location,
      company: user.company,
      publicRepos: user.public_repos,
      publicGists: user.public_gists,
      followers: user.followers,
      following: user.following,
      accountAgeYears: Number(accountAgeYears),
      hasDefaultAvatar,
      hireable: user.hireable,
    },
    repos: analyzeRepos(repos),
    activity: analyzeEvents(events),
  };
}
