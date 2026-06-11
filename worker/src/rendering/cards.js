// Card compositions — minimal, consistent, github-readme-stats style.
// Shared look: 25px padding, accent-tinted title with a leading icon, subtle
// animations, fully themed. Each renderer takes the resolved `theme`.
import { LANG_COLORS, icon, dot } from "./icons.js";
import {
  esc, kFormat, trunc, langItem, progressBar, pillRow,
  statLine, rankCircle, achievementIcon, animationCss, fade,
} from "./badges.js";

function frame(w, h, inner, theme) {
  const r = theme.radius ?? 8;
  const showBorder = !theme.hideBorder && theme.border && theme.border !== "none";
  const stroke = showBorder ? ` stroke="${theme.border}"` : "";

  let defs = "", overlay = "";
  if (theme.glass) {
    // frosted-glass sheen gradient + inner edge highlight over the translucent fill
    defs = `<defs>
    <linearGradient id="glassSheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.20"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>`;
    overlay = `  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${r}" fill="url(#glassSheen)"/>
  <rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${Math.max(0, r - 1)}" fill="none" stroke="#ffffff" stroke-opacity="0.14"/>`;
  }

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Ubuntu, 'Helvetica Neue', Sans-Serif">
${animationCss(theme)}
${defs}
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${r}" fill="${theme.bg}"${stroke}/>
${overlay}
${inner}
</svg>`;
}

// Consistent header used by every card.
function header(title, iconName, theme) {
  return `<g transform="translate(25, 30)">
    <g transform="translate(0, -13)">${icon(iconName, theme.accent)}</g>
    <text x="26" y="0" fill="${theme.title}" font-size="17" font-weight="600">${esc(title)}</text>
  </g>`;
}

// --- /github/profile  (the stats card) --------------------------------------

export function renderProfile(p, theme) {
  const W = 480, padX = 25;
  const rows = [
    ["star", "Total Stars Earned", p.stars],
    ["commit", "Total Commits", p.commits],
    ["pullRequest", "Total PRs", p.prs],
    ["issue", "Total Issues", p.issues],
    ["people", "Followers", p.followers],
  ];
  const rankPos = p.rank ? theme.rank : "off"; // right | left | off
  const startY = 78, step = 26;

  // stats occupy the side opposite the rank ring
  const statX = rankPos === "left" ? padX + 96 : padX;
  const valueX = rankPos === "right" ? 320 : W - padX;
  const lines = rows
    .map((r, i) => statLine(icon(r[0], theme.icon), r[1], r[2], statX, startY + i * step, valueX, theme, i))
    .join("\n");

  let rank = "";
  if (rankPos === "right") rank = rankCircle(p.rank, W - 78, 130, 42, theme);
  else if (rankPos === "left") rank = rankCircle(p.rank, padX + 46, 132, 42, theme);

  let cy = startY + rows.length * step + 12;
  const extras = [];
  if (p.achievements && p.achievements.length) {
    extras.push(section("ACHIEVEMENTS", padX, cy, theme));
    const size = 30, gap = 9;
    let ax = padX;
    extras.push(
      p.achievements.slice(0, 8).map((a, i) => {
        const g = achievementIcon(a, ax, cy + 8, size, theme, i);
        ax += size + gap;
        return g;
      }).join("\n")
    );
    cy += 8 + size + 16;
  }
  if (p.badges && p.badges.length) {
    extras.push(pillRow(p.badges, padX, cy, { bg: theme.accent, fg: "#ffffff" }));
    cy += 28;
  }

  const H = Math.max(195, cy);
  return frame(W, H, `  ${header(`${p.name}'s GitHub Stats`, "person", theme)}\n${lines}\n  ${rank}\n${extras.join("\n")}`, theme);
}

function section(text, x, y, theme) {
  return `<text x="${x}" y="${y}" fill="${theme.text}" font-size="10" font-weight="700" letter-spacing="1" opacity="0.7">${esc(text)}</text>`;
}

// --- /github/languages ------------------------------------------------------

export function renderLanguages(langs, theme) {
  if (!langs.length) return errorCard("no language data", theme);
  const W = 320, padX = 25, innerW = W - padX * 2;
  const head = header("Most Used Languages", "code", theme);

  if (theme.langLayout === "normal") {
    // one row per language: name + percent, with its own full-width bar
    let y = 58;
    const rows = langs
      .map((l, i) => {
        const labelY = y;
        const barY = y + 8;
        const w = Math.max(2, (l.pct / 100) * innerW);
        const animBar = theme.animations ? ` class="grow" style="--grow-w:${w.toFixed(1)}px"` : "";
        const out = `<g${fade(theme, 300 + i * 90)}>
    <text x="${padX}" y="${labelY}" fill="${theme.text}" font-size="12">${esc(l.name)}</text>
    <text x="${W - padX}" y="${labelY}" text-anchor="end" fill="${theme.title}" font-size="12" font-weight="600">${l.pct.toFixed(1)}%</text>
    <rect x="${padX}" y="${barY}" width="${innerW}" height="8" rx="4" fill="${theme.cardBorder}" opacity="0.5"/>
    <rect x="${padX}" y="${barY}" width="${w.toFixed(1)}" height="8" rx="4" fill="${l.color}"${animBar}/>
  </g>`;
        y += 40;
        return out;
      })
      .join("\n");
    return frame(W, y + 6, `  ${head}\n${rows}`, theme);
  }

  // compact: single stacked bar + two-column legend
  const barY = 50;
  const bar = progressBar(langs, padX, barY, innerW, theme);
  const colW = innerW / 2;
  const rowsPerCol = Math.ceil(langs.length / 2);
  const list = langs
    .map((l, i) => {
      const col = Math.floor(i / rowsPerCol);
      const row = i % rowsPerCol;
      return langItem(l.name, l.color, l.pct, padX + col * colW, 86 + row * 24, theme, i);
    })
    .join("\n");
  const H = 86 + rowsPerCol * 24;
  return frame(W, H, `  ${head}\n${bar}\n${list}`, theme);
}

// --- /github/repos ----------------------------------------------------------

export function renderRepos(user, repos, theme) {
  if (theme.limit) repos = repos.slice(0, theme.limit);
  if (!repos.length) return errorCard(`no public non-fork repos for '${user}'`, theme);
  const cols = theme.columns === 1 ? 1 : 2, cardW = 360, cardH = 110, gap = 16, padX = 25, headH = 52, padB = 22;
  const rows = Math.ceil(repos.length / cols);
  const W = padX * 2 + cols * cardW + (cols - 1) * gap;
  const H = headH + rows * cardH + (rows - 1) * gap + padB;
  const tiles = repos
    .map((r, i) => {
      const c = i % cols;
      const rr = Math.floor(i / cols);
      const x = padX + c * (cardW + gap);
      const y = headH + rr * (cardH + gap);
      const color = LANG_COLORS[r.lang] || "#8b949e";
      const lang = r.lang ? `${dot(color, 5)}<text x="16" y="0">${esc(r.lang)}</text>` : "";
      const off = r.lang ? 104 : 0;
      const delay = theme.animations ? ` class="fade" style="animation-delay:${200 + i * 80}ms"` : "";
      return `  <g transform="translate(${x}, ${y})"${delay}>
    <rect width="${cardW}" height="${cardH}" rx="${theme.radius ?? 8}" fill="${theme.card}" stroke="${theme.cardBorder}"/>
    <g transform="translate(16, 26)"><g transform="translate(0, -12)">${icon("repo", theme.accent)}</g><text x="22" y="0" fill="${theme.link}" font-size="15" font-weight="600">${esc(trunc(r.name, 28))}</text></g>
    <text x="16" y="52" fill="${theme.text}" font-size="12">${esc(trunc(r.desc, 44))}</text>
    <g transform="translate(16, ${cardH - 18})" font-size="12" fill="${theme.text}">
      ${lang}
      <g transform="translate(${off}, -12)">${icon("star", theme.text)}</g>
      <text x="${off + 17}" y="0">${kFormat(r.stars)}</text>
      <g transform="translate(${off + 56}, -12)">${icon("fork", theme.text)}</g>
      <text x="${off + 73}" y="0">${kFormat(r.forks)}</text>
    </g>
  </g>`;
    })
    .join("\n");
  return frame(W, H, `  ${header("Repositories", "repo", theme)}\n${tiles}`, theme);
}

// --- error ------------------------------------------------------------------

export function errorCard(msg, theme = { bg: "#0d1117", title: "#ffffff", text: "#888888", accent: "#1f6feb", error: "#f85149", radius: 8, animations: false }) {
  const t = { error: "#f85149", animations: false, ...theme };
  return frame(
    480,
    120,
    `  <text x="25" y="42" fill="${t.error}" font-size="16" font-weight="700">Card error</text>
  <text x="25" y="70" fill="${t.text}" font-size="13">${esc(trunc(msg, 66))}</text>
  <text x="25" y="94" fill="${t.text}" font-size="11">Check the Worker logs and the GITHUB_TOKEN secret.</text>`,
    t
  );
}
