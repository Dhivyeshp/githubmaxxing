const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

async function callAI(systemPrompt, userPrompt, timeoutMs = 25000) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://githubmaxxing.vercel.app",
      "X-Title": "GitHub Maxxing",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJSON(raw) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

const PROFILE_SUMMARY_SYSTEM = `You are analyzing a GitHub developer's profile to produce a structured skill summary used for matching them to open source issues.

Output a JSON object with exactly these fields:
- "primary_languages": array of 1-3 languages they use most (strings)
- "frameworks": array of frameworks/libraries detected from README content, repo descriptions, and dependency files (strings). Examples: React, Next.js, Vue, Django, Flask, FastAPI, Express, NestJS, Spring Boot, Rails, Laravel, Phoenix, Svelte, Angular, PyTorch, TensorFlow, Prisma, Tailwind, GraphQL, tRPC, Supabase, etc.
- "experience_level": one of "beginner", "intermediate", "advanced" based on commit volume, repo complexity, and activity consistency
- "domain_interests": array of 1-4 domains they seem to focus on (e.g., "web frontend", "ML infra", "devtools", "data viz", "mobile", "systems", "blockchain", "CLI tooling")
- "recent_momentum": one of "active", "moderate", "dormant" based on commits in the last 30 days
- "strengths_summary": a single sentence (max 25 words) describing what this developer is good at

Rules:
- Use readmeSnippets to detect frameworks — scan for import statements, dependency names, and tech-stack badges in README files.
- Use redditTechSignals (if present) as supporting evidence for frameworks and tools. A technology mentioned many times on Reddit is likely part of their real-world stack, not just a repo experiment.
- Cross-reference GitHub and Reddit signals: if both agree on a technology, include it with high confidence. If only Reddit mentions it, include it if count >= 3.
- Only include frameworks you can infer with confidence from the provided data. Do not invent skills.
- Output valid JSON only. No preamble, no markdown fences.`;

const MATCH_CONTEXT_SYSTEM = `You are helping a developer discover open source issues that match their skills and experience. Given a developer's profile summary and a list of issues, write ONE sentence (maximum 20 words) for each issue explaining why it is a good match for this specific developer.

Rules:
- Be specific. Reference their actual languages, frameworks, or project history.
- Never be generic. Do not write things like "This matches your skills" or "Great for your level."
- If their profile shows they've used the framework/library in question, mention it.
- If the issue matches their experience level (beginner vs advanced), say so naturally.
- No emojis. No marketing language. No exclamation points.
- Output valid JSON only: an object where each key is the issue ID (string) and the value is the one-sentence match context.
- No preamble, no markdown fences.

Example good outputs per issue:
- "You've shipped 3 React + Tailwind projects — this is a small UI fix in a library you likely already use."
- "Python is your top language and you have 40+ commits this month. Good compatibility fix to grab."`;

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
- Never tell the user to "be confident" or "don't be afraid to ask questions." Skip the pep talk.
- Output valid JSON array of strings only. No preamble.`;

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body?.type || !body?.payload) {
    return Response.json({ error: "Missing type or payload" }, { status: 400 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: "AI features unavailable" }, { status: 503 });
  }

  const { type, payload } = body;

  try {
    if (type === "profile_summary") {
      const { githubData, redditData } = payload;
      const readmeSnippets = (githubData.readmes || [])
        .filter((r) => r.snippet)
        .map((r) => ({ repo: r.repo, snippet: r.snippet.slice(0, 500) }));
      const slim = {
        username: githubData.username,
        bio: githubData.profile?.bio,
        publicRepos: githubData.profile?.publicRepos,
        topLanguages: githubData.repos?.topLanguages,
        topRepos: (githubData.repos?.topRepos || []).slice(0, 5).map((r) => ({
          name: r.name,
          description: r.description,
          stars: r.stars,
          language: r.language,
        })),
        readmeSnippets,
        commitsLast30Days: githubData.activity?.commitsLast30Days,
        daysSinceLastCommit: githubData.activity?.daysSinceLastCommit,
      };
      if (redditData?.technologies?.length > 0) {
        slim.redditTechSignals = redditData.technologies
          .slice(0, 20)
          .map((t) => `${t.tech} (${t.count} mention${t.count > 1 ? "s" : ""})`);
      }
      const raw = await callAI(
        PROFILE_SUMMARY_SYSTEM,
        `Analyze this GitHub profile:\n${JSON.stringify(slim, null, 2)}`
      );
      return Response.json({ result: parseJSON(raw) });
    }

    if (type === "match_batch") {
      const { profileSummary, issues } = payload;
      if (!Array.isArray(issues) || issues.length === 0) {
        return Response.json({ contexts: {} });
      }
      const slim = issues.map((i) => ({
        id: String(i.id),
        title: i.title,
        repo: i.repoName,
        labels: i.labels,
      }));
      const userPrompt = `Developer profile:\n${JSON.stringify(profileSummary, null, 2)}\n\nIssues to match (return a JSON object keyed by id):\n${JSON.stringify(slim, null, 2)}`;
      const raw = await callAI(MATCH_CONTEXT_SYSTEM, userPrompt, 30000);
      return Response.json({ contexts: parseJSON(raw) });
    }

    if (type === "classify") {
      const { issue } = payload;
      const userPrompt = `Issue title: ${issue.title}\nRepo: ${issue.repoName}\nLabels: ${(issue.labels || []).join(", ")}\nLanguage: ${issue.language || "unknown"}`;
      const raw = await callAI(CLASSIFY_SYSTEM, userPrompt);
      return Response.json({ result: parseJSON(raw) });
    }

    if (type === "action_plan") {
      const { profileSummary, issue } = payload;
      const profileStr = profileSummary
        ? JSON.stringify(profileSummary, null, 2)
        : `{ "primary_languages": ${JSON.stringify(issue.languages || [])}, "experience_level": "intermediate" }`;
      const userPrompt = `Developer profile:\n${profileStr}\n\nIssue:\nTitle: ${issue.title}\nRepo: ${issue.repoName}\nURL: ${issue.url}\nLabels: ${(issue.labels || []).join(", ")}`;
      const raw = await callAI(ACTION_PLAN_SYSTEM, userPrompt, 30000);
      const steps = parseJSON(raw);
      return Response.json({ steps: Array.isArray(steps) ? steps : [] });
    }

    return Response.json({ error: `Unknown type: ${type}` }, { status: 400 });
  } catch (err) {
    console.error(`[contributions/ai] type=${type}:`, err.message);
    return Response.json({ error: err.message || "AI request failed" }, { status: 500 });
  }
}
