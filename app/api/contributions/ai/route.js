// ── Providers ─────────────────────────────────────────────────────────────────

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = [
  "llama-3.1-8b-instant",
];

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS = [
  "meta-llama/llama-3-8b-instruct",
];

// ── In-memory cache ───────────────────────────────────────────────────────────

const _cache = new Map();

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _cache.delete(key); return null; }
  return entry.value;
}

function cacheSet(key, value, ttlMs) {
  _cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// ── AI callers ────────────────────────────────────────────────────────────────

async function tryGroq(systemPrompt, userPrompt, timeoutMs) {
  if (!process.env.GROQ_API_KEY) throw new Error("no GROQ_API_KEY");
  let lastErr;
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(`Groq ${res.status}: ${e.error?.message || "error"}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function tryOpenRouter(systemPrompt, userPrompt, timeoutMs) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("no OPENROUTER_API_KEY");
  let lastErr;
  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://githubmaxxing.vercel.app",
          "X-Title": "GitHub Maxxing",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`OpenRouter ${res.status} (${model})`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function callAI(systemPrompt, userPrompt, timeoutMs = 25000) {
  try {
    return await tryGroq(systemPrompt, userPrompt, timeoutMs);
  } catch (groqErr) {
    console.warn("[contributions/ai] Groq failed, trying OpenRouter:", groqErr.message);
    try {
      return await tryOpenRouter(systemPrompt, userPrompt, timeoutMs);
    } catch (orErr) {
      throw new Error(`All AI providers failed — Groq: ${groqErr.message} | OpenRouter: ${orErr.message}`);
    }
  }
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseJSONCandidate(candidate) {
  try {
    return JSON.parse(candidate);
  } catch (firstErr) {
    const repaired = candidate
      .replace(/\\'/g, "'")
      .replace(/,\s*([}\]])/g, "$1");
    if (repaired !== candidate) return JSON.parse(repaired);
    throw firstErr;
  }
}

function parseJSON(raw) {
  const text = String(raw)
    .replace(/^\uFEFF/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return parseJSONCandidate(text);
  } catch {}

  const start = text.search(/[\[{]/);
  if (start === -1) throw new Error("No JSON object or array found");

  const opening = text[start];
  const closing = opening === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === opening) {
      depth++;
    } else if (char === closing) {
      depth--;
      if (depth === 0) {
        return parseJSONCandidate(text.slice(start, i + 1));
      }
    }
  }

  throw new Error("JSON was not balanced");
}

// ── System prompts ────────────────────────────────────────────────────────────

const COMPANY_SIGNAL_GUIDANCE = `Tiers: T1 Microsoft/Google/Meta/Vercel/Netflix/Stripe/Shopify; T2 Supabase/PostHog/HashiCorp/Grafana/Elastic/MongoDB/Redis/GitLab/Sentry/Plausible/Umami; T3 HF/LangChain/LlamaIndex/Ollama/Anthropic/OpenAI/Modal/Replit. Use tier only after skill fit.`;

const PROFILE_SUMMARY_SYSTEM = `You are analyzing a GitHub developer's profile to produce a structured skill summary used for matching them to open source issues.

Output a JSON object with exactly these fields:
- "primary_languages": array of 1-3 languages they use most (strings)
- "frameworks": array of frameworks/libraries detected from README content, repo descriptions, and dependency files (strings). Examples: React, Next.js, Vue, Django, Flask, FastAPI, Express, NestJS, Spring Boot, Rails, Laravel, Phoenix, Svelte, Angular, PyTorch, TensorFlow, Prisma, Tailwind, GraphQL, tRPC, Supabase, etc.
- "experience_level": one of "beginner", "intermediate", "advanced" based on commit volume, repo complexity, and activity consistency
- "domain_interests": array of 1-4 domains they seem to focus on (e.g., "web frontend", "ML infra", "devtools", "data viz", "mobile", "systems", "blockchain", "CLI tooling")
- "recent_momentum": one of "active", "moderate", "dormant" based on commits in the last 30 days
- "strengths_summary": a single sentence (max 25 words) describing what this developer is good at

Rules:
- HIGHEST CONFIDENCE: repoDependencies contains actual dependency files (package.json deps, requirements.txt, Cargo.toml, etc.). These are ground truth — if "react", "next", "fastapi", "sqlalchemy" appear here, include them as frameworks with full confidence.
- HIGH CONFIDENCE: readmeSnippets — scan for import statements, dependency names, and tech-stack badges. Shield.io badge URLs encode the tech name directly (e.g. "React", "Next.js", "Docker") — extract them all.
- SUPPORTING SIGNAL: redditTechSignals — use to confirm or discover additional tools. Include if count >= 3 or confirmed by another source.
- Map raw package names to canonical framework names: "react" → "React", "next" → "Next.js", "tailwindcss" → "Tailwind", "fastapi" → "FastAPI", "@prisma/client" → "Prisma", etc.
- Only include frameworks you can infer with confidence from the provided data. Do not invent skills.
- Output valid JSON only. No preamble, no markdown fences.`;

const MATCH_CONTEXT_SYSTEM = `You are helping a developer discover open source issues that match their skills and experience. Given a developer's profile summary and a list of issues, write ONE sentence (maximum 20 words) for each issue explaining why it is a good match for this specific developer.

${COMPANY_SIGNAL_GUIDANCE}

Rules:
- Be specific. Reference their actual languages, frameworks, or project history.
- If an issue has company metadata, mention the company signal only when it fits naturally with the skill match.
- Never be generic. Do not write things like "This matches your skills" or "Great for your level."
- If their profile shows they've used the framework/library in question, mention it.
- If the issue matches their experience level (beginner vs advanced), say so naturally.
- No emojis. No marketing language. No exclamation points.
- Output valid JSON only: an object where each key is the issue ID (string) and the value is the one-sentence match context.
- No preamble, no markdown fences.

Example good outputs per issue:
- "You've shipped 3 React + Tailwind projects — this is a small UI fix in a library you likely already use."
- "Python is your top language and you have 40+ commits this month. Good compatibility fix to grab."
- "Vercel is a Tier 1 JS signal, and your Next.js repos make this routing issue a believable fit."`;

const CLASSIFY_SYSTEM = `You are classifying the difficulty of a GitHub issue for a developer considering whether to contribute to it.

Output a JSON object with exactly these fields:
- "difficulty": one of "beginner", "intermediate", "advanced"
- "estimated_hours": integer from 1 to 40, representing realistic hours for someone with the right skills
- "required_skills": array of 1-5 specific skills needed (e.g., "React hooks", "Postgres indexing", "WebSocket debugging")
- "blockers": array of things that might block a new contributor (e.g., "requires local Docker setup", "needs access to paid API", "requires domain knowledge in cryptography") — empty array if none
- "one_line_summary": plain-language description of what the issue actually asks for (max 15 words)

Rules:
- Err toward higher difficulty when the issue is vague or the repo is large.
- "beginner" means a developer familiar with the language could do it in an afternoon without deep repo knowledge.
- Output valid JSON only. No preamble.`;

const ACTION_PLAN_SYSTEM = `You are a senior engineer helping a developer make their first contribution to an open source project. Given an issue and the developer's profile, produce a short, tactical plan to go from "I want to do this" to "PR merged."

${COMPANY_SIGNAL_GUIDANCE}

Output format: A JSON array of 5-8 strings. Each string is one step sentence. No fluff, no motivation talk, no emojis.

Steps should cover:
- Forking and cloning correctly
- Setting up the local dev environment (reference the repo's CONTRIBUTING.md if mentioned)
- Reproducing the bug or understanding the feature request
- Where in the codebase to look first (be specific if the issue gives hints)
- Testing conventions for this repo
- Commit message / PR conventions
- What to write in the PR description

Rules:
- Be specific to THIS issue and THIS repo. Do not write generic "make a fork" guidance.
- If the repo is from a high-signal company, emphasize reading CONTRIBUTING.md, issue etiquette, tests, and a tight PR scope.
- Never tell the user to "be confident" or "don't be afraid to ask questions." Skip the pep talk.
- Output valid JSON array of strings only. No preamble.`;

const PROFILE_SUMMARY_SYSTEM_MIN = `Return JSON only:
{"primary_languages":[],"frameworks":[],"experience_level":"beginner|intermediate|advanced","domain_interests":[],"recent_momentum":"active|moderate|dormant","strengths_summary":""}
Use deps first, README second, reddit only if repeated. Canonicalize packages. Do not invent skills.`;

const MATCH_CONTEXT_SYSTEM_MIN = `Return JSON object id->one sentence max 20 words explaining issue fit. Mention skills; mention company tier only if provided/relevant. No generic text, emojis, markdown.`;

const CLASSIFY_SYSTEM_MIN = `Return JSON only: {"difficulty":"beginner|intermediate|advanced","estimated_hours":1,"required_skills":[],"blockers":[],"one_line_summary":""}. Use 1-40 hours; harder if vague/large repo.`;

const ACTION_PLAN_SYSTEM_MIN = `Return JSON array of 5-7 concise PR steps for this exact issue/repo: setup, reproduce/understand, files, tests, commit/PR notes. No pep talk/markdown.`;

function buildFallbackMatchContexts(profileSummary, issues) {
  const languages = [
    ...(profileSummary?.primary_languages || []),
    ...(profileSummary?.frameworks || []),
  ].filter(Boolean);
  const primarySkill = languages[0] || "your stack";

  return Object.fromEntries(
    issues.map((issue) => {
      const repo = issue.repoName?.split("/")[1] || issue.repoName || "this repo";
      const labels = (issue.labels || []).map((label) => label.toLowerCase());
      const title = (issue.title || "").toLowerCase();
      let reason;

      if (issue.company && issue.companyTier) {
        reason = `${issue.company} is a Tier ${issue.companyTier} signal, and this ${repo} issue lines up with ${primarySkill}.`;
      } else if (title.includes("readme") || labels.some((label) => label.includes("doc"))) {
        reason = `${repo} has a docs-sized issue, a practical way to contribute with ${primarySkill} context.`;
      } else if (title.includes("test") || labels.some((label) => label.includes("test"))) {
        reason = `${repo} needs test work, which is a scoped contribution that shows maintainers reliability.`;
      } else if (title.includes("bug") || labels.some((label) => label.includes("bug"))) {
        reason = `${repo} has a bug-sized task, giving you a clear before-and-after PR.`;
      } else if (labels.some((label) => label.includes("good first") || label.includes("beginner"))) {
        reason = `${repo} marked this beginner-friendly, so it is a lower-risk contribution in ${primarySkill}.`;
      } else if (labels.some((label) => label.includes("help wanted"))) {
        reason = `${repo} is asking for outside help, making this a realistic contribution target.`;
      } else {
        reason = `${repo} matches your detected stack and has a scoped open issue to start from.`;
      }

      return [String(issue.id), reason];
    })
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body?.type || !body?.payload) {
    return Response.json({ error: "Missing type or payload" }, { status: 400 });
  }

  const { type, payload } = body;

  if (!process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY) {
    if (type === "match_batch") {
      return Response.json({
        contexts: buildFallbackMatchContexts(payload.profileSummary, payload.issues || []),
        fallback: true,
      });
    }
    return Response.json({ error: "AI features unavailable" }, { status: 503 });
  }

  try {
    if (type === "profile_summary") {
      const { githubData, redditData } = payload;
      const username = githubData?.username;

      const cacheKey = `ps:${username}`;
      const cached = cacheGet(cacheKey);
      if (cached) return Response.json({ result: cached, cached: true });

      const readmeSnippets = (githubData.readmes || [])
        .filter((r) => r.snippet)
        .slice(0, 3)
        .map((r) => ({ repo: r.repo, snippet: r.snippet.slice(0, 600) }));

      // Dependency files are the most reliable tech signal — include them directly
      const repoDependencies = (githubData.repoDeps || []).map((d) => ({
        repo: d.repo,
        file: d.file,
        deps: Array.isArray(d.deps) ? d.deps.slice(0, 40) : d.deps?.slice(0, 700),
      }));

      const slim = {
        username,
        bio: githubData.profile?.bio,
        publicRepos: githubData.profile?.publicRepos,
        topLanguages: githubData.repos?.topLanguages,
        topRepos: (githubData.repos?.topRepos || []).slice(0, 3).map((r) => ({
          name: r.name,
          description: r.description,
          stars: r.stars,
          language: r.language,
        })),
        repoDependencies,
        readmeSnippets,
        commitsLast30Days: githubData.activity?.commitsLast30Days,
        daysSinceLastCommit: githubData.activity?.daysSinceLastCommit,
      };
      if (redditData?.technologies?.length > 0) {
        slim.redditTechSignals = redditData.technologies
          .slice(0, 8)
          .map((t) => `${t.tech} (${t.count} mention${t.count > 1 ? "s" : ""})`);
      }
      const raw = await callAI(
        PROFILE_SUMMARY_SYSTEM_MIN,
        JSON.stringify(slim)
      );
      const result = parseJSON(raw);
      cacheSet(cacheKey, result, 2 * 60 * 60 * 1000); // 2 hours
      return Response.json({ result });
    }

    if (type === "match_batch") {
      const { profileSummary, issues } = payload;
      if (!Array.isArray(issues) || issues.length === 0) {
        return Response.json({ contexts: {} });
      }

      const profileKey = JSON.stringify(profileSummary || {}).slice(0, 500);
      const cacheKey = `mb:${profileKey}:${issues.map((i) => i.id).sort().join(",")}`;
      const cached = cacheGet(cacheKey);
      if (cached) return Response.json({ contexts: cached, cached: true });

      const slim = issues.map((i) => ({
        id: String(i.id),
        title: i.title,
        repo: i.repoName,
        labels: i.labels,
        company: i.company,
        companyTier: i.companyTier,
        companySignal: i.companySignal,
      }));
      const userPrompt = JSON.stringify({ profile: profileSummary, issues: slim });
      let contexts;
      let usedFallback = false;
      try {
        const raw = await callAI(MATCH_CONTEXT_SYSTEM_MIN, userPrompt, 30000);
        contexts = parseJSON(raw);
      } catch (err) {
        console.warn("[contributions/ai] match_batch fallback:", err.message);
        contexts = buildFallbackMatchContexts(profileSummary, issues);
        usedFallback = true;
      }
      cacheSet(cacheKey, contexts, 30 * 60 * 1000); // 30 minutes
      return Response.json({ contexts, fallback: usedFallback });
    }

    if (type === "classify") {
      const { issue } = payload;
      const cacheKey = `cl:${issue.url || issue.id}`;
      const cached = cacheGet(cacheKey);
      if (cached) return Response.json({ result: cached, cached: true });

      const userPrompt = `Issue title: ${issue.title}\nRepo: ${issue.repoName}\nCompany: ${issue.company || "unknown"}\nCompany tier: ${issue.companyTier || "none"}\nCompany signal: ${issue.companySignal || "none"}\nLabels: ${(issue.labels || []).join(", ")}\nLanguage: ${issue.language || "unknown"}`;
      const raw = await callAI(CLASSIFY_SYSTEM_MIN, userPrompt);
      const result = parseJSON(raw);
      cacheSet(cacheKey, result, 6 * 60 * 60 * 1000); // 6 hours
      return Response.json({ result });
    }

    if (type === "action_plan") {
      const { profileSummary, issue } = payload;
      const cacheKey = `ap:${issue.url || issue.title}`;
      const cached = cacheGet(cacheKey);
      if (cached) return Response.json({ steps: cached, cached: true });

      const profileStr = profileSummary
        ? JSON.stringify(profileSummary, null, 2)
        : `{ "primary_languages": ${JSON.stringify(issue.languages || [])}, "experience_level": "intermediate" }`;
      const userPrompt = `Developer profile:\n${profileStr}\n\nIssue:\nTitle: ${issue.title}\nRepo: ${issue.repoName}\nURL: ${issue.url}\nCompany: ${issue.company || "unknown"}\nCompany tier: ${issue.companyTier || "none"}\nCompany signal: ${issue.companySignal || "none"}\nLabels: ${(issue.labels || []).join(", ")}`;
      const raw = await callAI(ACTION_PLAN_SYSTEM_MIN, userPrompt, 30000);
      const steps = parseJSON(raw);
      const result = Array.isArray(steps) ? steps : [];
      cacheSet(cacheKey, result, 60 * 60 * 1000); // 1 hour
      return Response.json({ steps: result });
    }

    return Response.json({ error: `Unknown type: ${type}` }, { status: 400 });
  } catch (err) {
    console.error(`[contributions/ai] type=${type}:`, err.message);
    return Response.json({ error: err.message || "AI request failed" }, { status: 500 });
  }
}
