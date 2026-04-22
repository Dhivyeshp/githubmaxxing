const GITHUB_API = "https://api.github.com";

function getHeaders() {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

const DIFFICULTY_LABELS = {
  beginner: ["good first issue", "good-first-issue", "beginner", "starter"],
  intermediate: ["help wanted", "help-wanted", "intermediate"],
  advanced: ["advanced", "complex", "performance", "architecture"],
};

function buildQuery({ languages, difficulty, minStars, maxAgeDays }) {
  const parts = ["is:issue", "is:open"];

  if (languages && languages.length > 0) {
    const langPart = languages.slice(0, 3).map((l) => `language:${l}`).join("+");
    parts.push(langPart);
  }

  const difficultyLabels =
    difficulty === "beginner"
      ? DIFFICULTY_LABELS.beginner
      : difficulty === "intermediate"
      ? DIFFICULTY_LABELS.intermediate
      : difficulty === "advanced"
      ? DIFFICULTY_LABELS.advanced
      : DIFFICULTY_LABELS.beginner; // default to good-first-issue

  parts.push(`label:"${difficultyLabels[0]}"`);

  const cutoff = new Date(Date.now() - (maxAgeDays || 30) * 24 * 60 * 60 * 1000);
  parts.push(`created:>=${cutoff.toISOString().slice(0, 10)}`);

  if (minStars && minStars > 0) {
    parts.push(`stars:>=${minStars}`);
  }

  return parts.join("+");
}

function ageLabel(createdAt) {
  const days = Math.floor((Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const languages = searchParams.get("languages")?.split(",").filter(Boolean) || [];
  const difficulty = searchParams.get("difficulty") || "beginner";
  const minStars = parseInt(searchParams.get("minStars") || "5", 10);
  const maxAgeDays = parseInt(searchParams.get("maxAgeDays") || "30", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);

  const query = buildQuery({ languages, difficulty, minStars, maxAgeDays });
  const url = `${GITHUB_API}/search/issues?q=${query}&sort=created&order=desc&per_page=20&page=${page}`;

  try {
    const res = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: 900 }, // 15 min cache
    });

    if (!res.ok) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        return Response.json({ error: "GitHub rate limit hit. Try again in a minute." }, { status: 429 });
      }
      return Response.json({ error: `GitHub API error ${res.status}` }, { status: res.status });
    }

    const data = await res.json();

    const issues = (data.items || []).map((item) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      url: item.html_url,
      repoName: item.repository_url.split("/").slice(-2).join("/"),
      repoUrl: item.html_url.split("/issues/")[0],
      labels: item.labels.map((l) => l.name),
      createdAt: item.created_at,
      age: ageLabel(item.created_at),
      comments: item.comments,
      // language and stars come from repo — not included in search results directly
      // we'll enrich a subset if needed; for now expose what we have
      language: null,
      stars: null,
    }));

    return Response.json(
      { issues, total: data.total_count, page },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err) {
    return Response.json({ error: err.message || "Failed to fetch issues" }, { status: 500 });
  }
}
