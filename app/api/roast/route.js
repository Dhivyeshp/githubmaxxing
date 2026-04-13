import { GoogleGenerativeAI } from "@google/generative-ai";

const modeInstructions = {
  standard: "Be savage but funny. Think comedy roast.",
  nomercy: "Absolutely ruthless. No filter. Destroy them.",
  soft: "Light roast. Playful, not mean.",
  academic:
    "Roast them specifically as a CS student. Reference classes, assignments, job hunting.",
};

export async function POST(request) {
  const { githubData, mode } = await request.json();

  if (!githubData || !mode) {
    return Response.json(
      { error: "Missing githubData or mode" },
      { status: 400 }
    );
  }

  if (!modeInstructions[mode]) {
    return Response.json({ error: "Invalid mode" }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are a savage comedian roasting a developer's GitHub profile.
Be SPECIFIC — reference their actual repo names, languages, stats, and patterns.
Never be generic. Every line should feel personal to THIS profile.
Keep it under 150 words. Make it hurt but make it funny.
End with one brutal one-liner summary of their entire dev career so far.

Roast style: ${modeInstructions[mode]}

GitHub Profile Data:
${JSON.stringify(githubData, null, 2)}
`;

  const result = await model.generateContent(prompt);
  const roast = result.response.text();

  return Response.json({ roast });
}
