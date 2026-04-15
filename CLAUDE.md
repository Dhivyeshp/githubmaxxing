# CLAUDE.md — githubmaxxing

## What We're Building
A web app that analyzes your GitHub profile and tells you exactly how to maximize it — for job hunting, open source credibility, and general clout. User enters a GitHub username, we fetch their public data, score them across key categories, and give them a prioritized action plan to improve.

The vibe: brutally honest, actionable, not a toy. Think "Grammarly for your GitHub profile."

---

## Tech Stack
- **Next.js** (app router)
- **Tailwind CSS** for styling
- **GitHub REST API** (free, public, no auth needed)
- **OpenRouter API** (free tier, use `meta-llama/llama-3.3-70b-instruct:free` or `google/gemma-4-31b-it:free`)
- **Vercel** for deployment

---

## Environment Variables
```
OPENROUTER_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here  # optional, bumps rate limit to 5000/hr — free to get
```

Get OpenRouter key free at: https://openrouter.ai
Get GitHub token free at: https://github.com/settings/tokens (no scopes needed for public data)

---

## Project Structure
```
githubmaxxing/
├── app/
│   ├── page.jsx                  # Landing — username input
│   ├── results/
│   │   └── page.jsx              # Results — scores + action plan
│   └── api/
│       ├── analyze/
│       │   └── route.js          # Orchestrates GitHub fetch + scoring
│       └── insights/
│           └── route.js          # OpenRouter call for AI action plan
├── lib/
│   ├── github.js                 # All GitHub API fetch logic
│   ├── scorer.js                 # Scoring logic (deterministic, no AI needed)
│   └── prompts.js                # Prompt templates for OpenRouter
├── components/
│   ├── ScoreCard.jsx             # Individual category score display
│   ├── ActionPlan.jsx            # Prioritized fix list
│   └── ShareCard.jsx             # Shareable image card (OG image)
├── .env.local                    # API keys (never commit this)
└── README.md
```

---

## Step 1 — GitHub Data to Fetch

All free public endpoints. Put this logic in `lib/github.js`.

### Endpoints:
```
GET https://api.github.com/users/{username}
GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated
GET https://api.github.com/users/{username}/events/public?per_page=100
GET https://api.github.com/repos/{username}/{username}        # profile README check
```

### What to extract:

**From `/users/{username}`:**
- `name`, `bio`, `location`, `company`, `blog` (website), `twitter_username`
- `avatar_url` — check if it's the default GitHub avatar (contains "avatars.githubusercontent.com" with no custom upload)
- `public_repos`, `followers`, `following`
- `created_at` — account age in years
- `hireable`

**From `/repos`:**
- Total repo count, how many are forks vs original
- Repos with no description (count)
- Repos with no README or empty README (check `readme` endpoint per repo — batch carefully)
- Repos with 0 stars AND 0 forks (abandoned/unfinished count)
- Top 3 languages used (aggregate `language` field across repos)
- Most recently updated repo + how many days ago
- Any repos with cringe names: "test", "practice", "tutorial", "homework", "untitled", "asdf", "new-repo"
- Pinned repos (use GitHub GraphQL API: `https://api.github.com/graphql` — or skip and note limitation)
- Whether `{username}/{username}` repo exists (profile README)

**From `/events`:**
- Days since last public commit
- Most common commit hour (morning / afternoon / night / 3am tier)
- Total commits in last 30 days
- Commit message quality check — look for patterns like "fix", "asdf", "update", "wip", "test" as red flags

---

## Step 2 — Scoring System

Put this in `lib/scorer.js`. This is **deterministic** — no AI needed for scoring, only for the action plan text.

Score each category 0–100. Final score is weighted average.

### Categories & Weights:

#### 1. Profile Completeness (20%)
| Signal | Points |
|--------|--------|
| Has custom profile picture | 15 |
| Has bio (>20 chars) | 20 |
| Has location | 10 |
| Has website/blog | 15 |
| Has profile README (`username/username` repo exists) | 40 |

#### 2. Repository Quality (25%)
| Signal | Points deducted |
|--------|----------------|
| >50% repos are forks | -20 |
| >30% repos have no description | -15 per 10% over |
| Cringe-named repos exist | -10 each (cap at -30) |
| Most recent commit > 30 days ago | -10 |
| Most recent commit > 90 days ago | -25 |

Base score 100, apply deductions.

#### 3. README Quality (20%)
Sample top 5 non-fork repos. Check each for README existence and length.
| Signal | Points |
|--------|--------|
| README exists | 10 per repo |
| README > 200 chars | 5 per repo |
| README > 1000 chars (well documented) | 5 per repo |

#### 4. Commit Consistency (20%)
| Signal | Points |
|--------|--------|
| Committed in last 7 days | 100 |
| Committed in last 30 days | 75 |
| Committed in last 90 days | 40 |
| Committed in last 180 days | 20 |
| No commits in 180+ days | 0 |

#### 5. Social Proof (15%)
| Signal | Points |
|--------|--------|
| followers > 100 | 100 |
| followers > 50 | 75 |
| followers > 20 | 50 |
| followers > 5 | 25 |
| followers <= 5 | 10 |

Cap star count bonus: if any single repo has >10 stars, +10 to this category.

#### Score Labels:
- 90–100: **S Tier** — Recruiter bait
- 75–89: **A Tier** — Solid, small tweaks needed
- 60–74: **B Tier** — Good bones, needs work
- 40–59: **C Tier** — Needs serious attention
- 0–39: **D Tier** — Start from scratch

---

## Step 3 — AI Action Plan (OpenRouter)

Put the API call in `app/api/insights/route.js`. Put prompt templates in `lib/prompts.js`.

### OpenRouter API Call:
```javascript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://githubmaxxing.vercel.app",
    "X-Title": "GitHub Maxxing"
  },
  body: JSON.stringify({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [{ role: "user", content: buildPrompt(githubData, scores) }]
  })
});
```

### Prompt structure (in `lib/prompts.js`):
```
You are a brutally honest career coach and GitHub expert.

Here is the GitHub profile data for ${username}:
${JSON.stringify(profileSummary)}

Their scores:
- Profile Completeness: ${scores.profile}/100
- Repository Quality: ${scores.repos}/100
- README Quality: ${scores.readmes}/100
- Commit Consistency: ${scores.commits}/100
- Social Proof: ${scores.social}/100
- Overall: ${scores.total}/100 (${scores.label})

Give them a prioritized action plan. Return ONLY a JSON array of actions, like:
[
  {
    "priority": 1,
    "category": "Profile Completeness",
    "issue": "Missing profile README",
    "fix": "Create a repo named exactly '${username}' and add a README.md — this shows up on your profile page and is the #1 thing recruiters see",
    "impact": "high",
    "effort": "low",
    "timeEstimate": "15 minutes"
  }
]

Be specific. Reference their actual data (repo names, missing fields, etc.).
Order by impact/effort ratio — quick wins first.
Max 6 actions. No fluff.
```

### Response fields:
- `priority` — 1-6
- `category` — which score category this fixes
- `issue` — what's wrong (one sentence)
- `fix` — exactly what to do (specific, actionable)
- `impact` — "high" | "medium" | "low"
- `effort` — "high" | "medium" | "low"
- `timeEstimate` — e.g. "15 minutes", "1 hour"

---

## Step 4 — Design System

### Philosophy
Devtools-adjacent. Clean, sharp, opinionated. Not a toy, not a SaaS template. Feels like something a good engineer would build for themselves — then open source.

Reference aesthetic: linear.app meets a terminal. Dark mode first.

---

### Fonts
Install via Google Fonts or `next/font`:
```
Display: Syne (weights 400, 700, 800) — for headings and the logo
Mono: DM Mono (weights 400, 500) — for scores, labels, badges, code
```

In `tailwind.config.js`:
```js
fontFamily: {
  display: ['Syne', 'sans-serif'],
  mono: ['DM Mono', 'monospace'],
}
```

Use `font-display` for all headings and the logo. Use `font-mono` for all score numbers, tier badges, category labels, and any pill/tag UI.

---

### Color Tokens
Define in `globals.css` as CSS variables:

```css
:root {
  --green: #1D9E75;
  --green-light: #E1F5EE;
  --green-dark: #0F6E56;
  --amber: #EF9F27;
  --amber-light: #FAEEDA;
  --amber-dark: #854F0B;
  --red: #E24B4A;
  --red-light: #FCEBEB;
  --red-dark: #A32D2D;
  --blue: #378ADD;
  --blue-light: #E6F1FB;
  --blue-dark: #185FA5;
}
```

Semantic usage:
- **Green** — high impact, good scores (80+), positive signals
- **Amber** — medium effort, mid scores (50–79), warnings
- **Red** — low scores (<50), high effort, blockers
- **Blue** — low effort pills, informational

---

### 21st.dev Components to Use
Install: `npx shadcn@latest init` then add components as needed.

| Component | Used for |
|-----------|----------|
| `Badge` | Tier label (S/A/B/C/D), impact/effort pills |
| `Card` | Score category cards, action items |
| `Progress` | Score bar inside each category card |
| `Separator` | Dividers between sections |
| `Input` | Username input on landing |
| `Button` | Analyze CTA, Share button |
| `Avatar` | User profile pic + initials fallback |
| `Tooltip` | Explain what each score category means on hover |

Override shadcn defaults in `components.json` and `globals.css` to match the Syne/DM Mono type stack and color tokens above. Don't use shadcn's default purple accent — replace with `--green`.

---

### Layout Rules
- Max content width: `640px`, centered
- No sidebars. Single column always.
- Section spacing: `gap-6` between major blocks
- Card padding: `p-4` (16px)
- Border style: `border border-border` (shadcn default, 0.5px equivalent)
- Border radius: `rounded-lg` for cards, `rounded-md` for pills/badges, `rounded-full` for avatar

---

### Component Specs

#### Nav
```
logo left — "github" + "maxxing" in green
"beta" badge right — font-mono, muted, small
border-bottom
```

#### Hero (Landing)
```
// profile analyzer   ← font-mono, green, small, uppercase tracking
[38–42px display heading, tight letter-spacing, -0.04em]
[14px muted subhead, max-w-md, line-height 1.6]
[@username input] [Analyze → button]
```
Input: left-aligned `@` prefix in mono. Button: green bg, white text, font-display bold.

#### Score Header (Results)
```
[Avatar + username + verdict]        [TIER BADGE]
                                     [64/100 big number]
```
- Avatar: 36px circle, green-light bg, green-dark text initials
- Tier badge: font-mono, green-light bg, green-dark text, rounded-md
- Big score: 42px, font-display 800, tight tracking. `/100` in 18px muted weight 500
- Verdict line: font-mono 11px muted — e.g. `needs work · 3 quick wins available`

#### Category Score Card (`ScoreCard.jsx`)
```jsx
<Card className="p-4">
  <div className="flex justify-between items-center mb-2">
    <span className="font-mono text-xs text-muted-foreground uppercase tracking-wide">
      {category}
    </span>
    <span className={`font-mono text-sm font-medium ${scoreColor}`}>
      {score}
    </span>
  </div>
  <Progress value={score} className={`h-[3px] ${progressColor}`} />
  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{note}</p>
</Card>
```

Score color logic:
- `score >= 75` → green (`text-[#1D9E75]`, progress green)
- `score >= 50` → amber (`text-[#EF9F27]`, progress amber)
- `score < 50` → red (`text-[#E24B4A]`, progress red)

Grid layout: `grid grid-cols-2 gap-2` — last item spans full width if odd count.

#### Action Item (`ActionPlan.jsx`)
```jsx
<Card className="p-4 flex gap-3">
  <span className="font-mono text-xs text-muted-foreground pt-0.5 min-w-[20px]">
    {String(priority).padStart(2, '0')}
  </span>
  <div className="flex-1">
    <p className="text-sm font-medium tracking-tight mb-1">{issue}</p>
    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{fix}</p>
    <div className="flex gap-1.5 flex-wrap">
      <Badge variant="outline" className={impactClass}>{impact} impact</Badge>
      <Badge variant="outline" className={effortClass}>{effort} effort</Badge>
      <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
        {timeEstimate}
      </Badge>
    </div>
  </div>
</Card>
```

Badge color classes:
```js
const impactClass = {
  high: 'bg-[#E1F5EE] text-[#0F6E56] border-0',
  medium: 'bg-[#FAEEDA] text-[#854F0B] border-0',
  low: 'bg-muted text-muted-foreground border-0',
}
const effortClass = {
  low: 'bg-[#E6F1FB] text-[#185FA5] border-0',
  medium: 'bg-[#FAEEDA] text-[#854F0B] border-0',
  high: 'bg-[#FCEBEB] text-[#A32D2D] border-0',
}
```

#### Share Strip
```
[Share your score. Challenge friends to beat it.]     [Share B tier ↗]
```
- Full-width, border-top, pt-6
- Button: transparent bg, border, font-display bold 12px
- Pre-filled tweet: `"My GitHub profile scored ${score}/100 on GitHub Maxxing (${tier} tier) githubmaxxing.vercel.app"`
- Use `window.open('https://twitter.com/intent/tweet?text=...')` on click

---

### Loading State
While the API fetches + scores, show a skeleton/loading view in the results layout:
- Pulse animation on score header, category grid, and action items
- Use shadcn `Skeleton` component: `<Skeleton className="h-4 w-full" />`
- Show "Analyzing @username..." in mono text above the skeleton

Don't use a spinner. The skeleton communicates the shape of what's coming, which feels more polished.

---

### Section Labels
Every major section gets a mono prefix label above it:
```jsx
<p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-2 uppercase">
  // priority action plan
</p>
```
This gives the app a terminal/devtools feel throughout.

---

## Step 5 — UI Pages

### Landing (`app/page.jsx`)
Layout order:
1. Nav (logo + beta badge)
2. Hero — label, title, subhead, input+button
3. Static example results card below the fold (use fake data for `dhivyeshp`) so people immediately see what they're getting before they type anything

### Results (`app/results/page.jsx`)
Layout order:
1. Nav
2. Score header (avatar + username + tier badge + big number)
3. `// score breakdown` label + category grid (2-col)
4. `// priority action plan` label + action list
5. Share strip
6. Footer — tiny mono text: `githubmaxxing · free forever · no login required`

Get `username` from URL search params: `?u=dhivyeshp`
Fetch from `/api/analyze?username=dhivyeshp` on mount.

---

## Step 6 — Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add env vars in Vercel dashboard
4. Deploy — done

No database needed. No auth needed. Fully stateless.

---

## Future Ideas (post-MVP)
- Monthly re-scan + email reminder ("check if you improved")
- Org/team mode — analyze a whole GitHub organization
- Compare mode — "you vs [famous dev]"
- Leaderboard of top-scoring profiles (opt-in)
- Embed badge for your README: `![GitHub Maxxing Score](https://githubmaxxing.vercel.app/badge/username)`