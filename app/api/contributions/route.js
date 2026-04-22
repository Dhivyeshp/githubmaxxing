const GITHUB_SEARCH = "https://api.github.com/search/issues";

const QUERY_CACHE_TTL_MS = 15 * 60 * 1000;
const QUERY_CACHE_STALE_MS = 60 * 60 * 1000;
const RESULT_CACHE_TTL_MS = 5 * 60 * 1000;
const RESULT_CACHE_STALE_MS = 30 * 60 * 1000;
const MAX_GITHUB_QUERIES_PER_REQUEST = 6;

const queryCache = globalThis.__contributionQueryCache || new Map();
const resultCache = globalThis.__contributionResultCache || new Map();
const inFlightSearches = globalThis.__contributionInFlightSearches || new Map();

globalThis.__contributionQueryCache = queryCache;
globalThis.__contributionResultCache = resultCache;
globalThis.__contributionInFlightSearches = inFlightSearches;

// Languages GitHub indexes for the language: search qualifier
// Frameworks (React, Tailwind, FastAPI, etc.) are excluded — they produce 0 results
const GITHUB_LANGUAGES = new Set([
  "JavaScript","TypeScript","Python","Go","Rust","Java","C++","C","C#",
  "Ruby","PHP","Swift","Kotlin","Dart","Scala","Elixir","Haskell",
  "HTML","CSS","SCSS","Vue","Svelte","Shell","Bash","PowerShell",
  "Perl","Lua","Tcl","Zig","Nim","Crystal","Assembly","CUDA","VHDL",
  "Verilog","Fortran","OCaml","Clojure","F#","Erlang","Racket","Scheme",
  "Idris","Elm","Groovy","R","MATLAB","Julia","Jupyter Notebook","SQL",
  "HCL","Nix","Makefile","Dockerfile","Solidity","Move","WebAssembly",
  "Gleam","V","Objective-C",
]);

function githubHeaders() {
  const h = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

const DIFFICULTY_LABEL_STAGES = {
  beginner: [
    'label:"good first issue"',
    'label:"good-first-issue"',
    'label:"first-timers-only"',
    'label:"help wanted"',
    null,
  ],
  intermediate: ['label:"help wanted"', null],
  advanced: [null],
};

const TOP_COMPANY_TIERS = [
  {
    tier: 1,
    label: "Tier 1 recruiter magnet",
    companies: [
      {
        name: "Microsoft",
        signal: "VS Code, TypeScript, PowerToys, .NET",
        owners: ["microsoft", "dotnet"],
        languages: ["TypeScript", "JavaScript", "C#", "C++", "PowerShell", "Go", "Python"],
      },
      {
        name: "Google",
        signal: "TensorFlow, Angular, Go, Kubernetes, Bazel",
        owners: ["google", "tensorflow", "angular", "kubernetes", "bazelbuild", "golang"],
        languages: ["Python", "Go", "TypeScript", "JavaScript", "Java", "C++", "C", "Shell"],
      },
      {
        name: "Meta",
        signal: "React, React Native, PyTorch, Jest",
        owners: ["facebook", "pytorch", "jestjs"],
        languages: ["JavaScript", "TypeScript", "Python", "C++", "Java", "Objective-C"],
      },
      {
        name: "Vercel",
        signal: "Next.js, SWR, Turbo",
        owners: ["vercel"],
        languages: ["TypeScript", "JavaScript", "Rust", "Go"],
      },
      {
        name: "Netflix",
        signal: "Infra tools, Metaflow, platform engineering",
        owners: ["Netflix"],
        languages: ["Java", "Python", "Go", "JavaScript", "TypeScript"],
      },
      {
        name: "Stripe",
        signal: "SDKs and developer tooling",
        owners: ["stripe"],
        languages: ["TypeScript", "JavaScript", "Ruby", "Python", "Go", "Java", "PHP"],
      },
      {
        name: "Shopify",
        signal: "Hydrogen, Polaris, Ruby and JS tooling",
        owners: ["Shopify"],
        languages: ["TypeScript", "JavaScript", "Ruby", "Go"],
      },
    ],
  },
  {
    tier: 2,
    label: "Tier 2 dev-tool ecosystem",
    companies: [
      {
        name: "Supabase",
        signal: "Postgres, auth, realtime, storage",
        owners: ["supabase"],
        languages: ["TypeScript", "JavaScript", "Dart", "Python", "Go", "Rust"],
      },
      {
        name: "PostHog",
        signal: "Product analytics and contributor-friendly devtools",
        owners: ["PostHog"],
        languages: ["TypeScript", "JavaScript", "Python"],
      },
      {
        name: "HashiCorp",
        signal: "Terraform, Vault, Consul",
        owners: ["hashicorp"],
        languages: ["Go", "HCL", "TypeScript", "JavaScript", "Ruby"],
      },
      {
        name: "Grafana Labs",
        signal: "Grafana, Loki, Tempo, observability",
        owners: ["grafana"],
        languages: ["Go", "TypeScript", "JavaScript", "Jsonnet"],
      },
      {
        name: "Elastic",
        signal: "Elasticsearch, Kibana, search infrastructure",
        owners: ["elastic"],
        languages: ["Java", "TypeScript", "JavaScript", "Go", "Python"],
      },
      {
        name: "MongoDB",
        signal: "Database drivers, tools, docs",
        owners: ["mongodb"],
        languages: ["JavaScript", "TypeScript", "Python", "Go", "Java", "C++", "C#"],
      },
      {
        name: "Redis",
        signal: "Redis core, clients, data infrastructure",
        owners: ["redis"],
        languages: ["C", "Rust", "Python", "JavaScript", "TypeScript", "Go"],
      },
      {
        name: "GitLab",
        signal: "Open-source developer platform",
        owners: ["gitlab-org"],
        languages: ["Ruby", "Go", "TypeScript", "JavaScript", "Vue"],
      },
      {
        name: "Sentry",
        signal: "SDKs across many languages and observability tooling",
        owners: ["getsentry"],
        languages: ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Ruby", "PHP", "Java"],
      },
      {
        name: "Plausible",
        signal: "Privacy-focused analytics",
        owners: ["plausible"],
        languages: ["Elixir", "JavaScript", "TypeScript"],
      },
      {
        name: "Umami",
        signal: "Open-source analytics",
        owners: ["umami-software"],
        languages: ["TypeScript", "JavaScript"],
      },
    ],
  },
  {
    tier: 3,
    label: "Tier 3 AI momentum",
    companies: [
      {
        name: "Hugging Face",
        signal: "Transformers, datasets, diffusers",
        owners: ["huggingface"],
        languages: ["Python", "Jupyter Notebook", "TypeScript", "JavaScript", "Rust"],
      },
      {
        name: "LangChain",
        signal: "LangChain, LangGraph, agent tooling",
        owners: ["langchain-ai"],
        languages: ["Python", "TypeScript", "JavaScript"],
      },
      {
        name: "LlamaIndex",
        signal: "RAG, agents, data framework tooling",
        owners: ["run-llama"],
        languages: ["Python", "TypeScript", "JavaScript"],
      },
      {
        name: "Ollama",
        signal: "Local LLM runtime",
        owners: ["ollama"],
        languages: ["Go", "TypeScript", "JavaScript", "Python"],
      },
      {
        name: "Anthropic",
        signal: "Claude SDKs, Claude Code, MCP ecosystem",
        owners: ["anthropics", "modelcontextprotocol"],
        languages: ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "Ruby", "C#"],
      },
      {
        name: "OpenAI",
        signal: "SDKs, evals, tiktoken, AI developer tooling",
        owners: ["openai"],
        languages: ["Python", "TypeScript", "JavaScript", "Go", "Java", "C#"],
      },
      {
        name: "Modal",
        signal: "AI infrastructure and serverless GPU tooling",
        owners: ["modal-labs"],
        languages: ["Python", "TypeScript", "JavaScript", "Go", "Rust", "Svelte"],
      },
      {
        name: "Replit",
        signal: "Cloud development environment and AI coding tools",
        owners: ["replit"],
        languages: ["Go", "TypeScript", "JavaScript", "Nix", "Python", "Rust"],
      },
    ],
  },
];

const TIER_SEARCH_ORDER = { 1: 0, 3: 1, 2: 2 };
const TIER_RANK_BOOST = { 1: 400, 3: 325, 2: 275 };

const COMPANY_SCOPES = TOP_COMPANY_TIERS.flatMap(({ tier, label, companies }) =>
  companies.flatMap((company) =>
    company.owners.map((owner) => ({
      owner,
      company: company.name,
      tier,
      tierLabel: label,
      signal: company.signal,
      languages: company.languages,
    }))
  )
);

const COMPANY_BY_OWNER = new Map();
for (const scope of COMPANY_SCOPES) {
  const key = scope.owner.toLowerCase();
  const existing = COMPANY_BY_OWNER.get(key);
  const scopeOrder = TIER_SEARCH_ORDER[scope.tier] ?? 9;
  const existingOrder = existing ? TIER_SEARCH_ORDER[existing.tier] ?? 9 : Infinity;
  if (!existing || scopeOrder < existingOrder) {
    COMPANY_BY_OWNER.set(key, {
      company: scope.company,
      tier: scope.tier,
      tierLabel: scope.tierLabel,
      signal: scope.signal,
    });
  }
}

function formatAge(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

async function searchIssues(query, perPage = 15) {
  const cacheKey = `${query}|${perPage}`;
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < QUERY_CACHE_TTL_MS) {
    return { ...cached.value, cached: true };
  }

  const inFlight = inFlightSearches.get(cacheKey);
  if (inFlight) return inFlight;

  const url = `${GITHUB_SEARCH}?q=${encodeURIComponent(query)}&sort=created&order=desc&per_page=${perPage}`;
  const request = fetch(url, {
    headers: githubHeaders(),
    signal: AbortSignal.timeout(10000),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const error = new Error(err.message || `GitHub search error ${res.status}`);
        error.status = res.status;
        throw error;
      }
      const data = await res.json();
      queryCache.set(cacheKey, { value: data, cachedAt: Date.now() });
      return data;
    })
    .catch((err) => {
      if (cached && Date.now() - cached.cachedAt < QUERY_CACHE_STALE_MS) {
        return { ...cached.value, stale: true };
      }
      throw err;
    })
    .finally(() => {
      inFlightSearches.delete(cacheKey);
    });

  inFlightSearches.set(cacheKey, request);
  return request;
}

async function safeSearchIssues(query, perPage) {
  try {
    return await searchIssues(query, perPage);
  } catch (err) {
    if (err.status === 403 || err.status === 429) {
      throw new Error("GitHub Search rate limit hit. Wait a minute, then retry.");
    }
    console.warn("[contributions] skipped search:", err.message);
    return { items: [], total_count: 0 };
  }
}

function formatQualifierValue(value) {
  return /^[A-Za-z0-9_.-]+$/.test(value) ? value : `"${value.replace(/"/g, '\\"')}"`;
}

function buildQuery(language, labelPart, minStars, dateStr, owner) {
  const parts = [
    "is:open",
    "is:issue",
    labelPart,
    `stars:>=${minStars}`,
    `created:>=${dateStr}`,
    `language:${formatQualifierValue(language)}`,
    owner ? `org:${owner}` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

function getCompanyMeta(repoName) {
  const owner = repoName.split("/")[0]?.toLowerCase();
  return owner ? COMPANY_BY_OWNER.get(owner) : null;
}

function mapItem(item) {
  const repoName = item.repository_url.replace("https://api.github.com/repos/", "");
  const companyMeta = getCompanyMeta(repoName);
  return {
    id: item.id,
    title: item.title,
    url: item.html_url,
    repoName,
    labels: (item.labels || []).map((l) => l.name),
    age: formatAge(item.created_at),
    createdAt: item.created_at,
    ...(companyMeta ? {
      company: companyMeta.company,
      companyTier: companyMeta.tier,
      companyTierLabel: companyMeta.tierLabel,
      companySignal: companyMeta.signal,
    } : {}),
  };
}

function scopeMatchesLanguage(scope, language) {
  return !scope.languages || scope.languages.includes(language);
}

function buildCompanyQueries(languages, labelPart, minStars, dateStr) {
  const selectedLanguages = languages.slice(0, 3);
  const seen = new Set();
  const queries = [];

  const scopes = COMPANY_SCOPES
    .filter((scope) => selectedLanguages.some((lang) => scopeMatchesLanguage(scope, lang)))
    .sort((a, b) => {
      const tierDelta = (TIER_SEARCH_ORDER[a.tier] ?? 9) - (TIER_SEARCH_ORDER[b.tier] ?? 9);
      if (tierDelta !== 0) return tierDelta;
      return a.company.localeCompare(b.company);
    });

  for (const scope of scopes) {
    const language = selectedLanguages.find((lang) => scopeMatchesLanguage(scope, lang));
    if (!language) continue;

    const key = `${scope.owner}:${language}`;
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push(buildQuery(language, labelPart, minStars, dateStr, scope.owner));
    if (queries.length >= 3) break;
  }

  return queries;
}

function rankIssue(issue) {
  const tierBoost = TIER_RANK_BOOST[issue.companyTier] || 0;
  const ageMs = Date.now() - new Date(issue.createdAt).getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
  const freshnessBoost = Math.max(0, 90 - ageDays);
  return tierBoost + freshnessBoost;
}

function getSearchStages(difficulty, minStars, dateStr) {
  const labels = DIFFICULTY_LABEL_STAGES[difficulty] || [null];
  const olderDateStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const stages = labels.slice(0, 2).map((labelPart) => ({ labelPart, minStars, dateStr }));
  stages.push({ labelPart: null, minStars: 0, dateStr });
  stages.push({ labelPart: null, minStars: 0, dateStr: olderDateStr });

  const seen = new Set();
  return stages.filter((stage) => {
    const key = `${stage.labelPart || "none"}:${stage.minStars}:${stage.dateStr}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function prepareIssues(results) {
  const seen = new Set();
  const issues = results
    .flatMap((r) => (r.items || []).map(mapItem))
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => {
      const rankDelta = rankIssue(b) - rankIssue(a);
      if (rankDelta !== 0) return rankDelta;
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, 30)
    .map(({ createdAt: _drop, ...rest }) => rest);

  const total = results.reduce((sum, r) => sum + (r.total_count || 0), 0);
  return { issues, total };
}

function getCachedResult(cacheKey, allowStale = false) {
  const cached = resultCache.get(cacheKey);
  if (!cached) return null;
  const age = Date.now() - cached.cachedAt;
  if (age < RESULT_CACHE_TTL_MS || (allowStale && age < RESULT_CACHE_STALE_MS)) {
    return { ...cached.value, cached: true, stale: age >= RESULT_CACHE_TTL_MS };
  }
  resultCache.delete(cacheKey);
  return null;
}

function setCachedResult(cacheKey, value) {
  resultCache.set(cacheKey, { value, cachedAt: Date.now() });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get("difficulty") || "beginner";
  const minStars = Math.max(0, parseInt(searchParams.get("minStars") || "5", 10));
  const maxAgeDays = Math.max(1, parseInt(searchParams.get("maxAgeDays") || "30", 10));
  const languagesParam = searchParams.get("languages") || "";
  const languages = languagesParam
    .split(",")
    .filter(Boolean)
    .filter((l) => GITHUB_LANGUAGES.has(l))
    .slice(0, 3);

  if (languages.length === 0) {
    return Response.json({ issues: [], total: 0 });
  }

  const resultCacheKey = JSON.stringify({ difficulty, minStars, maxAgeDays, languages });
  const freshCachedResult = getCachedResult(resultCacheKey);
  if (freshCachedResult) return Response.json(freshCachedResult);

  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
  const dateStr = cutoff.toISOString().split("T")[0];

  try {
    let finalResult = { issues: [], total: 0 };
    let queryBudget = MAX_GITHUB_QUERIES_PER_REQUEST;

    const stages = getSearchStages(difficulty, minStars, dateStr);
    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      const stage = stages[stageIndex];
      if (queryBudget <= 0) break;

      // Run broad language queries plus a capped set of high-signal company queries.
      const perLang = languages.length === 1 ? 30 : 15;
      const broadQueries = languages
        .slice(0, queryBudget)
        .map((lang) => buildQuery(lang, stage.labelPart, stage.minStars, stage.dateStr));
      queryBudget -= broadQueries.length;
      const companyQueries = stageIndex === 0 && queryBudget > 0
        ? buildCompanyQueries(languages, stage.labelPart, stage.minStars, stage.dateStr).slice(0, queryBudget)
        : [];
      queryBudget -= companyQueries.length;

      const broadResultsPromise = Promise.all(
        broadQueries.map((query) => safeSearchIssues(query, perLang))
      );
      const companyResultsPromise = Promise.all(
        companyQueries.map((query) => safeSearchIssues(query, 6))
      );
      const [broadResults, companyResults] = await Promise.all([broadResultsPromise, companyResultsPromise]);
      finalResult = prepareIssues([...companyResults, ...broadResults]);
      if (finalResult.issues.length > 0) break;
    }

    setCachedResult(resultCacheKey, finalResult);
    return Response.json(finalResult);
  } catch (err) {
    console.error("[contributions]", err.message);
    const staleCachedResult = getCachedResult(resultCacheKey, true);
    if (staleCachedResult) {
      return Response.json({ ...staleCachedResult, warning: err.message || "Search failed" });
    }
    return Response.json({ error: err.message || "Search failed" }, { status: 500 });
  }
}
