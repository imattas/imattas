import { shell } from "./layout.js";
import { ENDPOINTS } from "./registry.js";

export function homePage() {
  const cards = ENDPOINTS.map(
    (e) => `<div class="panel">
      <h3>${e.title}</h3>
      <p>${e.desc}</p>
      <p style="margin-top:10px"><code>${e.path}</code></p>
    </div>`
  ).join("\n");

  const body = `
  <section class="hero">
    <div class="eyebrow">self-hosted · no third parties</div>
    <h1>Your GitHub cards,<br>rendered on your own edge.</h1>
    <p>Live profile, language and repository cards generated from <code>api.github.com</code>
       on a Cloudflare Worker — fully themeable, animated, and with zero dependency on
       shields.io or github-readme-stats. Design one visually and drop the URL in your README.</p>
    <div style="display:flex; gap:12px; flex-wrap:wrap">
      <a class="btn" href="/help/design">🎨 Open the designer</a>
      <a class="btn ghost" href="/help/list">Browse endpoints</a>
    </div>
  </section>

  <section style="margin-top:42px">
    <div class="eyebrow">cards</div>
    <div class="grid cols-3" style="margin-top:14px">${cards}</div>
  </section>

  <section style="margin-top:42px">
    <div class="panel">
      <h3>Quick start</h3>
      <p>Add a card to any Markdown file (replace the host with your Worker's domain):</p>
      <p style="margin-top:10px"><code>![stats](/github/profile?user=imattas&amp;theme=dracula)</code></p>
      <p class="muted" style="margin-top:10px">Every card accepts the same theming params — colors, presets,
        transparency, animation toggles and per-card layout. See <a href="/help/list">Endpoints</a> for the full list,
        or build it on the <a href="/help/design">Designer</a>.</p>
    </div>
  </section>`;
  return shell("Home", "home", body);
}
