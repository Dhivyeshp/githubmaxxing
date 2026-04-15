const GITHUB_API = "https://api.github.com";

function getHeaders() {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchJSON(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: getHeaders(),
      signal: controller.signal,
    });
    if (!res.ok) {
      let message;
      if (res.status === 404) {
        message = "GitHub user not found";
      } else if (res.status === 403 || res.status === 429) {
        const remaining = res.headers.get("x-ratelimit-remaining");
        if (remaining === "0") {
          message =
            "GitHub API rate limit exceeded. Add a GITHUB_TOKEN to your .env.local to raise the limit to 5,000 requests/hr.";
        } else {
          message = "GitHub API access denied (403). The profile may be restricted.";
        }
      } else {
        message = `GitHub API error ${res.status}`;
      }
      const err = new Error(message);
      err.status = res.status === 403 ? 429 : res.status;
      throw err;
    }
    return res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      const timeout = new Error(`GitHub API timeout: ${url}`);
      timeout.status = 504;
      throw timeout;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchReadmeLength(username, repoName) {
  try {
    const data = await fetchJSON(
      `${GITHUB_API}/repos/${username}/${repoName}/readme`,
      3000
    );
    // content is base64-encoded
    const decoded = Buffer.from(data.content, "base64").toString("utf8");
    return decoded.length;
  } catch {
    return 0;
  }
}

async function checkProfileReadme(username) {
  try {
    await fetchJSON(`${GITHUB_API}/repos/${username}/${username}`, 3000);
    return true;
  } catch {
    return false;
  }
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

  const noDescription = repos.filter((r) => !r.description).length;
  const emptyRepos = repos.filter(
    (r) => r.stargazers_count === 0 && r.forks_count === 0 && !r.description
  ).length;

  const cringePattern = /^(test|practice|tutorial|homework|untitled|asdf|new.?repo)$/i;
  const cringeRepos = repos
    .filter((r) => cringePattern.test(r.name))
    .map((r) => r.name);

  const sortedByUpdated = [...repos].sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  );
  const recentRepo = sortedByUpdated[0] || null;
  const daysSinceLastPush = recentRepo
    ? Math.floor(
        (Date.now() - new Date(recentRepo.pushed_at || recentRepo.updated_at)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const topStarredRepo = repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)[0];

  return {
    total: repos.length,
    forks,
    originals,
    topLanguages,
    noDescription,
    emptyRepos,
    cringeRepos,
    recentRepoName: recentRepo?.name || null,
    daysSinceLastPush,
    topStarCount: topStarredRepo?.stargazers_count || 0,
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
    daysSinceLastCommit = Math.floor(
      (Date.now() - last) / (1000 * 60 * 60 * 24)
    );
  }

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const commitsLast30Days = pushEvents
    .filter((e) => new Date(e.created_at) > thirtyDaysAgo)
    .reduce((sum, e) => sum + (e.payload?.commits?.length || 0), 0);

  const messages = pushEvents
    .flatMap((e) => e.payload?.commits?.map((c) => c.message) ?? [])
    .slice(0, 20);

  return {
    commitTime,
    daysSinceLastCommit,
    commitsLast30Days,
    sampleCommitMessages: messages,
  };
}

export async function fetchGitHubData(username) {
  const [user, repos, events] = await Promise.all([
    fetchJSON(`${GITHUB_API}/users/${username}`),
    fetchJSON(
      `${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`
    ),
    fetchJSON(
      `${GITHUB_API}/users/${username}/events/public?per_page=100`
    ),
  ]);

  // Check profile README and fetch top 5 non-fork repo READMEs in parallel
  const topNonForkRepos = repos
    .filter((r) => !r.fork)
    .slice(0, 5)
    .map((r) => r.name);

  const [hasProfileReadme, ...readmeLengths] = await Promise.all([
    checkProfileReadme(username),
    ...topNonForkRepos.map((name) => fetchReadmeLength(username, name)),
  ]);

  const readmes = topNonForkRepos.map((name, i) => ({
    repo: name,
    length: readmeLengths[i],
  }));

  const defaultAvatarPattern = /avatars\.githubusercontent\.com\/u\/\d+\?v=4$/;
  const hasDefaultAvatar = defaultAvatarPattern.test(user.avatar_url);

  const accountAgeYears = parseFloat(
    (
      (Date.now() - new Date(user.created_at)) /
      (1000 * 60 * 60 * 24 * 365)
    ).toFixed(1)
  );

  const websiteUrl = user.blog || "";
  const bioText = user.bio || "";
  const linkedInPattern = /linkedin\.com\/in\//i;
  const websiteIsLinkedIn = linkedInPattern.test(websiteUrl);
  // LinkedIn URL mentioned in bio but not set as the website field
  const linkedInInBio = !websiteUrl && linkedInPattern.test(bioText);

  return {
    username,
    avatar_url: user.avatar_url,
    profile: {
      name: user.name,
      bio: bioText || null,
      location: user.location,
      company: user.company,
      website: websiteUrl || null,
      websiteIsLinkedIn,
      linkedInInBio,
      twitterUsername: user.twitter_username,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      accountAgeYears,
      hasDefaultAvatar,
      hasProfileReadme,
      hireable: user.hireable,
    },
    repos: analyzeRepos(repos),
    readmes,
    activity: analyzeEvents(events),
  };
}
