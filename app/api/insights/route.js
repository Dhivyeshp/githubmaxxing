import { buildPrompt, SYSTEM_PROMPT } from "@/lib/prompts";
import { generateFallbackActions } from "@/lib/scorer";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = [
  "llama-3.1-8b-instant",
];

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS = [
  "meta-llama/llama-3-8b-instruct",
];

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
        const errText = await res.text();
        throw new Error(`Groq HTTP ${res.status} (${model}): ${errText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      lastErr = err;
      console.warn(`[insights] ${err.message}`);
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

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenRouter HTTP ${res.status} (${model}): ${errText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      lastErr = err;
      console.warn(`[insights] ${err.message}`);
    }
  }

  throw lastErr;
}

async function callAI(systemPrompt, userPrompt, timeoutMs = 20000) {
  try {
    return await tryGroq(systemPrompt, userPrompt, timeoutMs);
  } catch (groqErr) {
    console.warn("[insights] Groq failed, trying OpenRouter:", groqErr.message);
    try {
      return await tryOpenRouter(systemPrompt, userPrompt, timeoutMs);
    } catch (openRouterErr) {
      throw new Error(`All AI providers failed — Groq: ${groqErr.message} | OpenRouter: ${openRouterErr.message}`);
    }
  }
}

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

function extractJSON(raw) {
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

export async function POST(request) {
  const { githubData, scores } = await request.json();

  if (!githubData || !scores) {
    return Response.json(
      { error: "Missing githubData or scores" },
      { status: 400 }
    );
  }

  const deterministicActions = generateFallbackActions(githubData, scores);

  if (!process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY) {
    console.warn("[insights] No AI provider key - using fallback actions");
    return Response.json({ actions: deterministicActions });
  }

  if (deterministicActions.length > 0) {
    return Response.json({ actions: deterministicActions });
  }

  try {
    const prompt = buildPrompt(githubData, scores);
    const raw = await callAI(SYSTEM_PROMPT, prompt);

    if (!raw) {
      console.error("[insights] Empty content from AI provider");
      return Response.json({ actions: deterministicActions });
    }

    try {
      const actions = extractJSON(raw);
      if (!Array.isArray(actions) || actions.length === 0) {
        throw new Error("Not a non-empty array");
      }
      return Response.json({ actions });
    } catch (parseErr) {
      console.error("[insights] JSON parse failed. Raw response:", raw);
      return Response.json({ actions: deterministicActions });
    }
  } catch (err) {
    console.error("[insights] Unexpected error:", err.message);
    return Response.json({ actions: deterministicActions });
  }
}
