// Theme system + SVG glyph registry shared by the renderers.
//
// Cards are themed per-request: resolveTheme(searchParams) merges the default
// palette with an optional named preset (?theme=) and any individual color
// overrides (?bg=, ?title=, ?text=, ...). Colors accept bare hex ("0d1117"),
// "#"-prefixed hex, CSS names, or "transparent".

export const DEFAULT_THEME = {
  bg: "#0d1117",        // card background ("transparent" = none)
  title: "#ffffff",     // headings
  text: "#888888",      // secondary text / labels
  icon: "#ffffff",      // glyph + marker color
  card: "#0d1117",      // inner tile background (repos)
  cardBorder: "#30363d",// inner tile border
  link: "#58a6ff",      // repo name / @login
  badgeBg: "#21262d",   // pill background
  badgeFg: "#c9d1d9",   // pill text
  accent: "#1f6feb",    // account-badge background
  border: "none",       // OUTER card frame border (none by default)
  radius: 8,            // corner radius
  hideBorder: false,
  glass: false,         // frosted-glass sheen + edge (liquid_glass preset)
  animations: true,     // CSS fade/grow/rank animations
  // layout / placement
  rank: "right",        // profile rank ring: right | left | off
  langLayout: "compact",// languages: compact | normal
  columns: 2,           // repos: 1 | 2
  limit: null,          // repos: max tiles (null = all)
};

// A few ready-made looks selectable with ?theme=NAME.
export const PRESETS = {
  default: {},
  dark: {},
  transparent: { bg: "transparent" },
  light: {
    bg: "#ffffff", title: "#24292f", text: "#57606a", icon: "#24292f",
    card: "#ffffff", cardBorder: "#d0d7de", link: "#0969da",
    badgeBg: "#eaeef2", badgeFg: "#24292f", accent: "#0969da",
  },
  dracula: {
    bg: "#282a36", title: "#ff79c6", text: "#f8f8f2", icon: "#bd93f9",
    card: "#282a36", cardBorder: "#44475a", link: "#8be9fd",
    badgeBg: "#44475a", badgeFg: "#f8f8f2", accent: "#bd93f9",
  },
  radical: {
    bg: "#141321", title: "#fe428e", text: "#a9fef7", icon: "#f8d847",
    card: "#141321", cardBorder: "#30363d", link: "#fe428e",
    badgeBg: "#30363d", badgeFg: "#a9fef7", accent: "#fe428e",
  },
  tokyonight: {
    bg: "#1a1b27", title: "#70a5fd", text: "#a9b1d6", icon: "#bf91f3",
    card: "#1a1b27", cardBorder: "#30363d", link: "#38bdae",
    badgeBg: "#30363d", badgeFg: "#a9b1d6", accent: "#70a5fd",
  },
  // Apple-style frosted glass. Translucent dark tint (8-digit hex alpha) so the
  // README background shows through, with light text that stays legible on both
  // light and dark pages. The glass flag adds a sheen + frosted edge in frame().
  liquid_glass: {
    bg: "#0e141cb0", title: "#ffffff", text: "#e4ebf3", icon: "#ffffff",
    card: "#ffffff14", cardBorder: "#ffffff38", link: "#a8d3ff",
    badgeBg: "#ffffff24", badgeFg: "#ffffff", accent: "#86b6ff",
    border: "#ffffff45", glass: true,
  },
};

export function parseColor(v) {
  if (v == null) return v;
  const s = String(v).trim();
  if (!s) return s;
  const low = s.toLowerCase();
  if (low === "transparent" || low === "none") return "transparent";
  if (/^([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return "#" + s;
  return s; // CSS name or already "#rrggbb"
}

function pick(params, ...names) {
  for (const n of names) {
    const v = params.get(n);
    if (v != null && v !== "") return v;
  }
  return null;
}

const truthy = (v) => ["true", "1", "yes", "on"].includes(String(v || "").toLowerCase());

export function resolveTheme(params) {
  const named = (params.get("theme") || "").toLowerCase();
  const base = { ...DEFAULT_THEME, ...(PRESETS[named] || {}) };

  const set = (key, raw) => { if (raw != null) base[key] = parseColor(raw); };
  set("bg", pick(params, "bg", "bg_color", "background"));
  set("title", pick(params, "title", "title_color"));
  set("text", pick(params, "text", "text_color"));
  set("icon", pick(params, "icon", "icon_color"));
  set("accent", pick(params, "accent", "accent_color"));
  set("link", pick(params, "link", "link_color"));
  set("card", pick(params, "card", "card_color"));
  set("cardBorder", pick(params, "card_border", "tile_border"));
  set("badgeBg", pick(params, "badge", "badge_bg"));
  set("badgeFg", pick(params, "badge_text", "badge_fg"));
  set("border", pick(params, "border", "border_color"));

  if (truthy(pick(params, "transparent"))) base.bg = "transparent";
  if (truthy(pick(params, "hide_border", "hideborder"))) base.hideBorder = true;
  if (truthy(pick(params, "disable_animations", "no_animations"))) base.animations = false;

  const rad = pick(params, "radius", "border_radius");
  if (rad != null) {
    const n = Number(rad);
    if (!Number.isNaN(n)) base.radius = Math.max(0, n);
  }

  // layout / placement
  const rank = (pick(params, "rank") || "").toLowerCase();
  if (["right", "left", "off"].includes(rank)) base.rank = rank;
  const layout = (pick(params, "layout", "lang_layout") || "").toLowerCase();
  if (["compact", "normal"].includes(layout)) base.langLayout = layout;
  const cols = parseInt(pick(params, "columns"), 10);
  if (cols === 1 || cols === 2) base.columns = cols;
  const lim = parseInt(pick(params, "limit"), 10);
  if (Number.isFinite(lim)) base.limit = Math.max(1, Math.min(12, lim));

  return base;
}

// --- glyphs -----------------------------------------------------------------

// GitHub Octicons (https://octicons.github.com, MIT), 16x16 path data.
// Add more by copying the <path d="..."> from any 16px octicon.
export const OCTICONS = {
  star: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z",
  fork: "M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z",
  branch: "M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z",
  commit: "M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z",
  pullRequest: "M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z",
  issue: "M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z",
  repo: "M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z",
  people: "M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.575-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Z",
  person: "M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.622 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z",
  location: "M11.536 3.464a5 5 0 0 1 0 7.072L8 14.07l-3.536-3.535a5 5 0 1 1 7.072-7.072v.001Zm-1.06 6.012a3.5 3.5 0 1 0-4.95-4.95 3.5 3.5 0 0 0 4.95 4.95ZM8 9a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 9Z",
  link: "M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0Z",
  eye: "M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z",
  code: "m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.44 8.53a.75.75 0 0 1 0-1.06l4.28-4.25Z",
  heart: "m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.857 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002Z",
  organization: "M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75Zm-.25-1.75c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75Zm4 3A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z",
};

// Render an octicon as an SVG <path> with the given fill, scaled (16px -> ~13.6px).
export function icon(name, fill, scale = 0.85) {
  const d = OCTICONS[name];
  if (!d) return "";
  return `<path transform="scale(${scale})" d="${d}" fill="${fill}"/>`;
}

// a small colored circle (language / stat marker)
export function dot(color, r = 4, cx = 5, cy = -4) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
}

// GitHub linguist colors for languages the REST repos endpoint reports as a
// bare name (the GraphQL languages query already returns its own colors).
export const LANG_COLORS = {
  C: "#555555", "C++": "#f34b7d", Rust: "#dea584", Python: "#3572A5",
  Go: "#00ADD8", JavaScript: "#f1e05a", TypeScript: "#3178c6", Swift: "#F05138",
  Lua: "#000080", Shell: "#89e051", Assembly: "#6E4C13", HTML: "#e34c26",
  CSS: "#563d7c", Java: "#b07219", Ruby: "#701516", "C#": "#178600",
  Solidity: "#AA6746", Makefile: "#427819", Dockerfile: "#384d54", Nix: "#7e7eff",
  Zig: "#ec915c", Kotlin: "#A97BFF", PHP: "#4F5D95", Vue: "#41b883",
};
