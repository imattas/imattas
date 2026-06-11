// Single source of truth for the /help pages. Both /help/list (docs) and
// /help/design (visual designer) are generated from this — they never drift.

export const ENDPOINTS = [
  {
    id: "profile",
    path: "/github/profile",
    title: "Profile · Stats",
    icon: "person",
    desc: "Stats card: animated rank ring, total stars / commits / PRs / issues / followers, account badges, and real achievement icons.",
  },
  {
    id: "languages",
    path: "/github/languages",
    title: "Top Languages",
    icon: "code",
    desc: "Your most-used languages by bytes of code, as a stacked bar with a percentage breakdown.",
  },
  {
    id: "repos",
    path: "/github/repos",
    title: "Repositories",
    icon: "repo",
    desc: "Grid of your public, non-fork repositories with language, stars and forks.",
  },
  {
    id: "htb",
    path: "/hackthebox",
    title: "Hack The Box (JSON)",
    icon: "flame",
    desc: "Live Hack The Box stats as CORS-enabled JSON for a portfolio site. Not an image; needs the HTB_TOKEN secret.",
    json: true,
  },
];

// type: text | select | color | bool | range
// applies: array of endpoint ids the param affects ("*" = all image endpoints)
export const PARAMS = [
  { key: "user", type: "text", label: "Username", placeholder: "imattas", applies: ["*"],
    help: "GitHub login to render for. Leave blank in the designer to preview with mock data." },

  { key: "theme", type: "select", label: "Theme preset", default: "default", applies: ["*"],
    options: ["default", "dark", "light", "dracula", "radical", "tokyonight", "liquid_glass", "transparent"] },

  { key: "bg", type: "color", label: "Background", applies: ["*"] },
  { key: "title", type: "color", label: "Title", applies: ["*"] },
  { key: "text", type: "color", label: "Text", applies: ["*"] },
  { key: "icon", type: "color", label: "Icons", applies: ["*"] },
  { key: "accent", type: "color", label: "Accent", applies: ["*"] },
  { key: "link", type: "color", label: "Links", applies: ["*"] },
  { key: "card", type: "color", label: "Tile fill", applies: ["repos"] },
  { key: "border", type: "color", label: "Border", applies: ["*"] },

  { key: "transparent", type: "bool", label: "Transparent background", applies: ["*"] },
  { key: "hide_border", type: "bool", label: "Hide outer border", applies: ["*"] },
  { key: "disable_animations", type: "bool", label: "Disable animations", applies: ["*"] },
  { key: "radius", type: "range", label: "Corner radius", min: 0, max: 24, default: 8, applies: ["*"] },

  { key: "rank", type: "select", label: "Rank ring placement", default: "right",
    options: ["right", "left", "off"], applies: ["profile"] },
  { key: "achievements", type: "bool", label: "Hide achievements", onValue: "off", applies: ["profile"],
    help: "Drops the achievement icons — much smaller card." },

  { key: "layout", type: "select", label: "Languages layout", default: "compact",
    options: ["compact", "normal"], applies: ["languages"] },

  { key: "columns", type: "select", label: "Columns", default: "2", options: ["2", "1"], applies: ["repos"] },
  { key: "limit", type: "range", label: "Max repos", min: 1, max: 12, default: 12, applies: ["repos"] },
];

export function paramsFor(endpointId) {
  return PARAMS.filter((p) => p.applies.includes("*") || p.applies.includes(endpointId));
}
