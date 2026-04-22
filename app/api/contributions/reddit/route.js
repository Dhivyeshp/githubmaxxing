// keyword → canonical tech name
// Keys are lowercase; longer/more-specific keys must come before short ambiguous ones
const TECH_MAP = {
  // ── Languages ──────────────────────────────────────────────────────────────
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  golang: "Go",
  "go lang": "Go",
  "go programming": "Go",
  rustlang: "Rust",
  kotlin: "Kotlin",
  swift: "Swift",
  "c++": "C++",
  cplusplus: "C++",
  "c#": "C#",
  csharp: "C#",
  ruby: "Ruby",
  scala: "Scala",
  elixir: "Elixir",
  haskell: "Haskell",
  clojure: "Clojure",
  erlang: "Erlang",
  julia: "Julia",
  lua: "Lua",
  perl: "Perl",
  dart: "Dart",
  fortran: "Fortran",
  cobol: "COBOL",
  assembly: "Assembly",
  solidity: "Solidity",
  zig: "Zig",
  nim: "Nim",
  crystal: "Crystal",
  "r programming": "R",
  rlang: "R",
  "data science": "R",
  matlab: "MATLAB",
  julia: "Julia",
  groovy: "Groovy",
  powershell: "PowerShell",
  bash: "Bash",
  // ── Frontend ───────────────────────────────────────────────────────────────
  "react native": "React Native",
  reactjs: "React",
  "react.js": "React",
  nextjs: "Next.js",
  "next.js": "Next.js",
  "next js": "Next.js",
  nuxtjs: "Nuxt",
  "nuxt.js": "Nuxt",
  vuejs: "Vue",
  "vue.js": "Vue",
  angular: "Angular",
  sveltekit: "SvelteKit",
  svelte: "Svelte",
  astro: "Astro",
  remix: "Remix",
  solidjs: "Solid",
  "solid.js": "Solid",
  qwik: "Qwik",
  ember: "Ember",
  tailwindcss: "Tailwind",
  tailwind: "Tailwind",
  shadcn: "shadcn/ui",
  "radix ui": "Radix UI",
  framer: "Framer Motion",
  "framer motion": "Framer Motion",
  threejs: "Three.js",
  "three.js": "Three.js",
  d3: "D3.js",
  "d3.js": "D3.js",
  chartjs: "Chart.js",
  react: "React",
  vue: "Vue",
  // ── Backend ────────────────────────────────────────────────────────────────
  fastapi: "FastAPI",
  django: "Django",
  flask: "Flask",
  "express.js": "Express",
  expressjs: "Express",
  express: "Express",
  nestjs: "NestJS",
  "nest.js": "NestJS",
  springboot: "Spring Boot",
  "spring boot": "Spring Boot",
  spring: "Spring",
  rails: "Rails",
  "ruby on rails": "Rails",
  laravel: "Laravel",
  phoenix: "Phoenix",
  "gin framework": "Gin",
  "actix web": "Actix",
  axum: "Axum",
  fiber: "Fiber",
  hono: "Hono",
  fastify: "Fastify",
  "asp.net": "ASP.NET",
  aspnet: "ASP.NET",
  koa: "Koa",
  "trpc": "tRPC",
  "t3 stack": "T3 Stack",
  strapi: "Strapi",
  // ── Databases ──────────────────────────────────────────────────────────────
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  sqlite: "SQLite",
  dynamodb: "DynamoDB",
  cassandra: "Cassandra",
  neo4j: "Neo4j",
  cockroachdb: "CockroachDB",
  planetscale: "PlanetScale",
  supabase: "Supabase",
  firebase: "Firebase",
  turso: "Turso",
  neon: "Neon",
  drizzle: "Drizzle ORM",
  prisma: "Prisma",
  sequelize: "Sequelize",
  sqlalchemy: "SQLAlchemy",
  typeorm: "TypeORM",
  hibernate: "Hibernate",
  redis: "Redis",
  elasticsearch: "Elasticsearch",
  clickhouse: "ClickHouse",
  // ── Cloud & DevOps ─────────────────────────────────────────────────────────
  aws: "AWS",
  "amazon web services": "AWS",
  "google cloud": "GCP",
  gcp: "GCP",
  azure: "Azure",
  heroku: "Heroku",
  vercel: "Vercel",
  netlify: "Netlify",
  cloudflare: "Cloudflare",
  "digital ocean": "DigitalOcean",
  digitalocean: "DigitalOcean",
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  terraform: "Terraform",
  ansible: "Ansible",
  helm: "Helm",
  "github actions": "GitHub Actions",
  gitlab: "GitLab CI",
  "ci/cd": "CI/CD",
  nginx: "NGINX",
  caddy: "Caddy",
  // ── Mobile ─────────────────────────────────────────────────────────────────
  flutter: "Flutter",
  expo: "Expo",
  swiftui: "SwiftUI",
  "jetpack compose": "Jetpack Compose",
  // ── ML / AI ────────────────────────────────────────────────────────────────
  pytorch: "PyTorch",
  tensorflow: "TensorFlow",
  keras: "Keras",
  "scikit-learn": "scikit-learn",
  "sklearn": "scikit-learn",
  huggingface: "HuggingFace",
  "hugging face": "HuggingFace",
  langchain: "LangChain",
  llamaindex: "LlamaIndex",
  "llm": "LLMs",
  "large language model": "LLMs",
  openai: "OpenAI",
  anthropic: "Anthropic",
  transformers: "Transformers",
  "stable diffusion": "Stable Diffusion",
  // ── Tools & protocols ─────────────────────────────────────────────────────
  graphql: "GraphQL",
  grpc: "gRPC",
  websocket: "WebSocket",
  kafka: "Kafka",
  rabbitmq: "RabbitMQ",
  celery: "Celery",
  webpack: "Webpack",
  vite: "Vite",
  esbuild: "esbuild",
  vitest: "Vitest",
  jest: "Jest",
  pytest: "pytest",
  playwright: "Playwright",
  cypress: "Cypress",
  graphite: "Graphite",
  prometheus: "Prometheus",
  grafana: "Grafana",
  sentry: "Sentry",
  stripe: "Stripe",
  twilio: "Twilio",
};

// Escape special regex chars in a keyword
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build all patterns once at module load
const PATTERNS = Object.entries(TECH_MAP).map(([keyword, tech]) => ({
  tech,
  re: new RegExp(`(?<![a-z0-9])${escapeRegex(keyword)}(?![a-z0-9])`, "gi"),
}));

function extractTech(text) {
  const counts = {};
  for (const { tech, re } of PATTERNS) {
    const matches = text.match(re);
    if (matches) counts[tech] = (counts[tech] || 0) + matches.length;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tech, count]) => ({ tech, count }));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();
  if (!username) {
    return Response.json({ error: "Missing username" }, { status: 400 });
  }

  const url = `https://www.reddit.com/user/${encodeURIComponent(username)}/comments.json?limit=100&sort=new`;
  let res;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "githubmaxxing/1.0 (stack detection tool)" },
      signal: AbortSignal.timeout(7000),
    });
  } catch (err) {
    return Response.json({ found: false, technologies: [], error: err.message });
  }

  if (res.status === 404) {
    return Response.json({ found: false, technologies: [] });
  }
  if (!res.ok) {
    return Response.json(
      { found: false, technologies: [], error: `Reddit ${res.status}` },
      { status: res.status === 429 ? 429 : 502 }
    );
  }

  const data = await res.json().catch(() => null);
  const children = data?.data?.children || [];

  // Combine comment bodies (cap at 60k chars to stay reasonable)
  const text = children
    .map((c) => c.data?.body || "")
    .join(" ")
    .slice(0, 60000)
    .toLowerCase();

  const technologies = extractTech(text).slice(0, 25);

  return Response.json({ found: true, username, technologies });
}
