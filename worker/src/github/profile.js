// endpoint on the worker will be worker.com/github/profile
// Loads identity + account badges + (best-effort) achievements + headline stats
// + a computed rank (same idea as github-readme-stats).
import { gql, fetchText } from "./client.js";

// "account badge" flags live directly on the GraphQL User type — reliable.
const ACCOUNT_BADGES = [
  ["isEmployee", "Staff"],
  ["isGitHubStar", "Star"],
  ["isDeveloperProgramMember", "Developer Program"],
  ["isCampusExpert", "Campus Expert"],
  ["isBountyHunter", "Bug Bounty Hunter"],
  ["isHireable", "Open to work"],
];

// Profile "achievements" have no official API; mapped names for the slug fallback.
const ACHIEVEMENT_NAMES = {
  "pull-shark": "Pull Shark", yolo: "YOLO", quickdraw: "Quickdraw",
  starstruck: "Starstruck", "pair-extraordinaire": "Pair Extraordinaire",
  "galaxy-brain": "Galaxy Brain", "arctic-code-vault-contributor": "Arctic Code Vault",
  "public-sponsor": "Public Sponsor", "heart-on-your-sleeve": "Heart On Your Sleeve",
  "open-sourcerer": "Open Sourcerer",
};

export async function loadProfile(login, token, opts = {}) {
  const wantAchievements = opts.achievements !== false;
  const data = await gql(
    `query($login:String!){
      user(login:$login){
        login name bio url avatarUrl
        isEmployee isGitHubStar isDeveloperProgramMember
        isCampusExpert isBountyHunter isHireable
        followers{ totalCount }
        following{ totalCount }
        repositories(ownerAffiliations:OWNER, first:100, orderBy:{field:STARGAZERS, direction:DESC}){
          totalCount
          nodes{ stargazers{ totalCount } }
        }
        pullRequests{ totalCount }
        openIssues: issues(states:OPEN){ totalCount }
        closedIssues: issues(states:CLOSED){ totalCount }
        contributionsCollection{
          totalCommitContributions
          totalPullRequestReviewContributions
        }
      }
    }`,
    { login },
    token
  );
  const u = data.user;
  if (!u) throw new Error(`user '${login}' not found`);

  const badges = ACCOUNT_BADGES.filter(([flag]) => u[flag]).map(([, label]) => label);
  const stars = u.repositories.nodes.reduce((s, n) => s + n.stargazers.totalCount, 0);
  const commits = u.contributionsCollection.totalCommitContributions;
  const reviews = u.contributionsCollection.totalPullRequestReviewContributions;
  const prs = u.pullRequests.totalCount;
  const issues = u.openIssues.totalCount + u.closedIssues.totalCount;
  const followers = u.followers.totalCount;

  const achievements = wantAchievements ? await loadAchievements(login) : [];

  return {
    login: u.login,
    name: u.name || u.login,
    bio: u.bio || "",
    url: u.url,
    badges,
    achievements,
    followers,
    following: u.following.totalCount,
    repos: u.repositories.totalCount,
    stars, commits, prs, issues,
    rank: calculateRank({ commits, prs, issues, reviews, stars, followers }),
  };
}

// --- rank (weighted percentile, github-readme-stats style) ------------------

const expCdf = (x) => 1 - 2 ** -x;
const logNormalCdf = (x) => x / (1 + x);

function calculateRank({ commits, prs, issues, reviews, stars, followers }) {
  const W = { commits: 2, prs: 3, issues: 1, reviews: 1, stars: 4, followers: 1 };
  const M = { commits: 1000, prs: 50, issues: 25, reviews: 2, stars: 50, followers: 10 };
  const total = W.commits + W.prs + W.issues + W.reviews + W.stars + W.followers;
  const THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
  const LEVELS = ["S", "A+", "A", "A-", "B+", "B", "B-", "C+", "C"];
  const rank =
    1 -
    (W.commits * expCdf(commits / M.commits) +
      W.prs * expCdf(prs / M.prs) +
      W.issues * expCdf(issues / M.issues) +
      W.reviews * expCdf(reviews / M.reviews) +
      W.stars * logNormalCdf(stars / M.stars) +
      W.followers * logNormalCdf(followers / M.followers)) /
      total;
  const percentile = rank * 100;
  const level = LEVELS[THRESHOLDS.findIndex((t) => percentile <= t)] || "C";
  return { level, percentile };
}

// --- achievements (best-effort scrape of the public profile HTML) -----------

async function loadAchievements(login) {
  // Scraping github.com is non-deterministic (GitHub sometimes serves the badge
  // images, sometimes not). Cache the result PER USER so every card variant
  // (?transparent, ?theme=..., etc.) renders identical achievements instead of
  // each capturing a different scrape. Only successful (non-empty) scrapes are
  // cached, so one transient failure doesn't pin "no achievements" for all.
  const cache = caches.default;
  const cacheKey = new Request(`https://ipa-cards.cache/achievements/${encodeURIComponent(login)}`);
  const hit = await cache.match(cacheKey);
  if (hit) {
    try { return await hit.json(); } catch { /* fall through and re-scrape */ }
  }

  const result = await scrapeAchievements(login);
  // Cache successes for 6h, empties for only 10min (so a transient scrape
  // failure self-heals) — but always cache SOMETHING, so every card variant
  // rendered in the same window sees identical achievements.
  const ttl = result.length ? 21600 : 600;
  await cache.put(
    cacheKey,
    new Response(JSON.stringify(result), {
      headers: { "content-type": "application/json", "cache-control": `public, max-age=${ttl}` },
    })
  );
  return result;
}

async function scrapeAchievements(login) {
  // The dedicated achievements tab lists every badge with its image; fall back
  // to the main profile page if it's unavailable.
  const u = encodeURIComponent(login);
  const html =
    (await fetchText(`https://github.com/${u}?tab=achievements`)) ||
    (await fetchText(`https://github.com/${u}`));
  if (!html) return [];

  // Preferred: real achievement badge <img> (alt="Achievement: <Name>").
  const found = [];
  const seen = new Set();
  const imgRe = /<img\b[^>]*>/g;
  let m;
  while ((m = imgRe.exec(html)) && found.length < 8) {
    const tag = m[0];
    if (!/alt="Achievement:/.test(tag)) continue;
    const name = (tag.match(/alt="Achievement:\s*([^"]+?)"/) || [])[1];
    const src = (tag.match(/src="([^"]+)"/) || [])[1];
    if (!name) continue;
    const clean = name.replace(/\s*x\d+$/i, "").trim();
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ name: clean, src });
  }

  if (found.length) {
    return Promise.all(
      found.map(async (a) => ({ name: a.name, image: a.src ? await inlineImage(a.src) : null }))
    );
  }

  // Fallback: detect by ?achievement=<slug> links, no image available.
  const slugs = new Set();
  const slugRe = /achievement=([a-z0-9-]+)/g;
  while ((m = slugRe.exec(html))) slugs.add(m[1]);
  return [...slugs].slice(0, 8).map((slug) => ({
    name: ACHIEVEMENT_NAMES[slug] || titleCase(slug),
    image: null,
  }));
}

// Fetch a remote image and return it as a base64 data URI (so it renders inside
// an SVG served through GitHub's image proxy). null on any failure.
async function inlineImage(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "ipa-cards-worker" } });
    if (!r.ok) return null;
    const ctype = r.headers.get("content-type") || "image/png";
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return `data:${ctype};base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

function titleCase(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
