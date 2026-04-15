import { buildPrompt } from "@/lib/prompts";
import { generateFallbackActions } from "@/lib/scorer";

export async function POST(request) {
  const { githubData, scores } = await request.json();

  if (!githubData || !scores) {
    return Response.json(
      { error: "Missing githubData or scores" },
      { status: 400 }
    );
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[insights] No OPENROUTER_API_KEY — using fallback actions");
    return Response.json({
      actions: generateFallbackActions(githubData, scores),
    });
  }

  try {
    const prompt = buildPrompt(githubData, scores);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://githubmaxxing.vercel.app",
        "X-Title": "GitHub Maxxing",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[insights] OpenRouter HTTP ${res.status}:`, errText);
      return Response.json({
        actions: generateFallbackActions(githubData, scores),
      });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";

    if (!raw) {
      console.error("[insights] Empty content from OpenRouter:", JSON.stringify(data));
      return Response.json({
        actions: generateFallbackActions(githubData, scores),
      });
    }

    try {
      // Strip markdown code fences the model sometimes wraps around JSON
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      const actions = JSON.parse(cleaned);
      if (!Array.isArray(actions) || actions.length === 0) {
        throw new Error("Not a non-empty array");
      }
      return Response.json({ actions });
    } catch (parseErr) {
      console.error("[insights] JSON parse failed. Raw response:", raw);
      return Response.json({
        actions: generateFallbackActions(githubData, scores),
      });
    }
  } catch (err) {
    console.error("[insights] Unexpected error:", err.message);
    return Response.json({
      actions: generateFallbackActions(githubData, scores),
    });
  }
}
