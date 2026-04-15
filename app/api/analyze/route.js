import { fetchGitHubData } from "@/lib/github";
import { computeScores } from "@/lib/scorer";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return Response.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const githubData = await fetchGitHubData(username);
    const scores = computeScores(githubData);
    return Response.json({ githubData, scores });
  } catch (err) {
    const status = [404, 429].includes(err.status) ? err.status : 500;
    return Response.json({ error: err.message }, { status });
  }
}
