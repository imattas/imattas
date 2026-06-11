// Router for the /help site (HTML pages).
import { homePage } from "./home.js";
import { listPage } from "./list.js";
import { designPage } from "./design.js";
import { shell } from "./layout.js";

export function handleHelp(url) {
  const path = url.pathname.replace(/\/+$/, "") || "/help";
  let html, status = 200;
  if (path === "/help" || path === "/help/home") html = homePage();
  else if (path === "/help/list") html = listPage();
  else if (path === "/help/design") html = designPage();
  else {
    status = 404;
    html = shell(
      "Not found",
      "",
      `<section class="hero"><div class="eyebrow">404</div><h1>Page not found</h1>
       <p>No help page at <code>${escapeHtml(path)}</code>.</p>
       <div style="display:flex;gap:12px"><a class="btn" href="/help">Home</a>
       <a class="btn ghost" href="/help/list">Endpoints</a>
       <a class="btn ghost" href="/help/design">Designer</a></div></section>`
    );
  }
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" },
  });
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
