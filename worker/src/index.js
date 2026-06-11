// ipa-cards — Cloudflare Worker router.
//
// Renders GitHub profile cards as SVGs from live api.github.com data (no
// scheduled workflow), and proxies Hack The Box stats as JSON for a portfolio.
//
//   /github/profile     -> profile card  (name, account badges, achievements, stats)
//   /github/languages   -> top languages card
//   /github/repos       -> repositories grid card
//   /hackthebox  (/htb) -> live HTB stats as JSON (own CORS + cache)
//   ?user=NAME          -> override the GitHub username on any /github endpoint
//
// data loaders live in ./github, SVG rendering in ./rendering, HTB in ./hackthebox.

import { loadProfile } from "./github/profile.js";
import { loadLanguages } from "./github/langs.js";
import { loadRepos } from "./github/repos.js";
import { renderProfile, renderLanguages, renderRepos, errorCard } from "./rendering/cards.js";
import { resolveTheme } from "./rendering/icons.js";
import { handleHtb } from "./hackthebox/htb.js";
import { handleHelp } from "./help/index.js";

const DEFAULT_USER = "imattas";

// Sample data for ?mock=1 — lets you preview/tweak rendering and themes locally
// without a GITHUB_TOKEN or any API calls. Not used unless mock is requested.
const MOCK = {
  profile: {
    login: "imattas", name: "ian", bio: "aspiring red teamer · ctf · os dev",
    avatar: null,
    badges: ["Star", "Developer Program", "Security Bug Bounty Hunter"],
    achievements: [
      { slug: "pull-shark", name: "Pull Shark" },
      { slug: "starstruck", name: "Starstruck" },
      { slug: "quickdraw", name: "Quickdraw" },
    ],
    followers: 128, following: 42, repos: 17,
    stars: 342, commits: 2431, prs: 54, issues: 312,
    rank: { level: "A+", percentile: 11.2 },
  },
  languages: [
    { name: "C", color: "#555555", pct: 34.2 },
    { name: "Rust", color: "#dea584", pct: 25.1 },
    { name: "Python", color: "#3572A5", pct: 18.0 },
    { name: "Assembly", color: "#6E4C13", pct: 12.7 },
    { name: "C++", color: "#f34b7d", pct: 6.0 },
    { name: "Go", color: "#00ADD8", pct: 4.0 },
  ],
  repos: [
    { name: "zOs", desc: "custom x86_64 hybrid kernel (Limine, C/C++/ASM)", lang: "C", stars: 42, forks: 3 },
    { name: "debugary", desc: "modular x86_64 debugger", lang: "Rust", stars: 128, forks: 9 },
    { name: "WinTune", desc: "Rust/Tauri Windows optimizer", lang: "Rust", stars: 76, forks: 5 },
    { name: "rop-tools", desc: "ROP gadget finder + chain builder", lang: "Python", stars: 31, forks: 2 },
  ],
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // Help site (HTML): home, endpoint list, visual designer.
    if (path === "/help" || path.startsWith("/help/")) return handleHelp(url);

    // Landing: send the bare root to the help home.
    if (path === "/") return Response.redirect(url.origin + "/help", 302);

    // Hack The Box live stats proxy (JSON, manages its own CORS + edge cache).
    if (path === "/htb" || path === "/hackthebox" || path.startsWith("/hackthebox/")) {
      return handleHtb(request, env, ctx);
    }

    // GitHub SVG cards.
    return handleCard(request, env, ctx, url, path);
  },
};

async function handleCard(request, env, ctx, url, path) {
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const user = url.searchParams.get("user") || env.USERNAME || DEFAULT_USER;
  // trim: secrets set via piped stdin can pick up a trailing newline, which
  // GitHub rejects with 401.
  const token = (env.GITHUB_TOKEN || "").trim();
  const theme = resolveTheme(url.searchParams);
  const mock = ["1", "true", "yes"].includes((url.searchParams.get("mock") || "").toLowerCase());

  let svg;
  try {
    if (!mock && !token) throw new Error("GITHUB_TOKEN secret is not set on the Worker");
    if (path === "/github/profile") {
      const showAch = !["0", "false", "off", "no"].includes((url.searchParams.get("achievements") || "").toLowerCase());
      svg = renderProfile(mock ? MOCK.profile : await loadProfile(user, token, { achievements: showAch }), theme);
    } else if (path === "/github/languages") {
      svg = renderLanguages(mock ? MOCK.languages : await loadLanguages(user, token), theme);
    } else if (path === "/github/repos") {
      svg = renderRepos(user, mock ? MOCK.repos : await loadRepos(user, token), theme);
    } else {
      svg = errorCard("Unknown endpoint: " + path, theme);
    }
  } catch (e) {
    svg = errorCard(String((e && e.message) || e), theme);
  }

  // never edge-cache mock previews (so theme tweaks show immediately)
  if (mock) {
    return new Response(svg, {
      headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" },
    });
  }

  const res = new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      // 30 min edge + browser cache => cards refresh roughly every half hour
      "cache-control": "public, max-age=1800, s-maxage=1800",
      "access-control-allow-origin": "*",
    },
  });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
