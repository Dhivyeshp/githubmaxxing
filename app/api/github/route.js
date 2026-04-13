import { fetchGitHubData } from "@/lib/github";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return Response.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const data = await fetchGitHubData(username);
    return Response.json(data);
  } catch (err) {
    const status = err.message.includes("404") ? 404 : 500;
    return Response.json({ error: err.message }, { status });
  }
}
