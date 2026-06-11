// Small reusable card components + text utilities. Everything that draws color
// takes the resolved `theme`. Animation is opt-out via theme.animations; the
// CSS keyframes themselves are injected once per card by animationCss().
import { dot } from "./icons.js";

export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function kFormat(n) {
  n = Number(n) || 0;
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
}

export function trunc(s, n) {
  s = String(s);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function textWidth(s, fontSize = 11) {
  return String(s).length * fontSize * 0.6;
}

// Keyframes shared by all animated pieces. Animations only touch `opacity`,
// `stroke-dashoffset`, and clip `width` — never `transform` — so they never
// clobber an element's positioning transform attribute.
export function animationCss(theme) {
  if (!theme.animations) return "";
  return `<style>
    .fade { opacity: 0; animation: ipaFade 0.7s ease-in-out forwards; }
    @keyframes ipaFade { to { opacity: 1; } }
    .rank-rim { animation: ipaRank 1s ease-in-out forwards; }
    @keyframes ipaRank { from { stroke-dashoffset: var(--rim-full); } to { stroke-dashoffset: var(--rim-target); } }
    .grow { width: 0; animation: ipaGrow 1s ease-in-out forwards; }
    @keyframes ipaGrow { to { width: var(--grow-w); } }
  </style>`;
}

export const fade = (theme, delayMs) =>
  theme.animations ? ` class="fade" style="animation-delay:${delayMs}ms"` : "";
const fadeAttrs = fade;

// One stat row: icon + label (left), value (right, bold). Absolute coords.
export function statLine(iconSvg, label, value, padX, y, valueX, theme, index = 0) {
  return `<g${fadeAttrs(theme, 300 + index * 120)}>
    <g transform="translate(${padX}, ${y - 11})">${iconSvg}</g>
    <text x="${padX + 26}" y="${y}" fill="${theme.text}" font-size="14">${esc(label)}</text>
    <text x="${valueX}" y="${y}" text-anchor="end" fill="${theme.title}" font-size="14" font-weight="600">${kFormat(value)}</text>
  </g>`;
}

// Animated rank ring with the level letter + percentile in the middle.
export function rankCircle(rank, cx, cy, r, theme) {
  const C = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(100, 100 - rank.percentile));
  const target = C * (1 - progress / 100);
  const rim = theme.animations
    ? ` class="rank-rim" style="--rim-full:${C.toFixed(1)}px;--rim-target:${target.toFixed(1)}px"`
    : "";
  return `<g${fadeAttrs(theme, 200)}>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.cardBorder}" stroke-width="6" opacity="0.4"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.accent}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${target.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"${rim}/>
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" fill="${theme.title}" font-size="22" font-weight="700">${esc(rank.level)}</text>
    <text x="${cx}" y="${cy + 15}" text-anchor="middle" fill="${theme.text}" font-size="10">${Math.round(progress)}%</text>
  </g>`;
}

// One achievement: real inlined image (circular) or a letter fallback.
export function achievementIcon(ach, x, y, size, theme, index = 0) {
  const inner = ach.image
    ? `<clipPath id="ach${index}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></clipPath>
    <image x="0" y="0" width="${size}" height="${size}" href="${ach.image}" clip-path="url(#ach${index})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${theme.badgeBg}"/>
    <text x="${size / 2}" y="${size / 2 + size * 0.18}" text-anchor="middle" fill="${theme.badgeFg}" font-size="${size * 0.5}" font-weight="700">${esc((ach.name || "?")[0])}</text>`;
  return `<g transform="translate(${x}, ${y})"${fadeAttrs(theme, 500 + index * 90)}><title>${esc(ach.name)}</title>${inner}</g>`;
}

// A rounded pill (account badges etc.). Returns {svg, width}.
export function pill(text, x, y, opts = {}) {
  const fs = opts.fontSize || 11;
  const padX = opts.padX || 9;
  const h = opts.height || 20;
  const bg = opts.bg || "#21262d";
  const fg = opts.fg || "#c9d1d9";
  const w = Math.round(textWidth(text, fs) + padX * 2);
  const svg = `<g transform="translate(${x}, ${y})">
    <rect width="${w}" height="${h}" rx="${h / 2}" fill="${bg}"/>
    <text x="${w / 2}" y="${h / 2 + fs * 0.36}" text-anchor="middle" fill="${fg}" font-size="${fs}">${esc(text)}</text>
  </g>`;
  return { svg, width: w };
}

export function pillRow(labels, x, y, opts = {}) {
  const gap = opts.gap || 7;
  let cx = x;
  return labels
    .map((label) => {
      const p = pill(label, cx, y, opts);
      cx += p.width + gap;
      return p.svg;
    })
    .join("\n");
}

// A language entry: colored dot + "Name 12.3%".
export function langItem(name, color, pct, x, y, theme, index = 0) {
  return `<g transform="translate(${x}, ${y})"${fadeAttrs(theme, 300 + index * 90)}>
    ${dot(color, 5)}
    <text x="16" y="0" fill="${theme.text}" font-size="12">${esc(name)} <tspan fill="${theme.title}" font-weight="600">${pct.toFixed(1)}%</tspan></text>
  </g>`;
}

// Stacked horizontal percentage bar with rounded ends; the clip wipes in.
export function progressBar(segments, x, y, width, theme, height = 8, id = "bar") {
  let cur = x;
  const rects = segments
    .map((s) => {
      const w = Math.max(2, (s.pct / 100) * width);
      const r = `<rect x="${cur.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${height}" fill="${s.color}"/>`;
      cur += w;
      return r;
    })
    .join("");
  const clip = theme.animations
    ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" class="grow" style="--grow-w:${width}px"/>`
    : `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}"/>`;
  return `<clipPath id="${id}">${clip}</clipPath>
  <g clip-path="url(#${id})">${rects}</g>`;
}
