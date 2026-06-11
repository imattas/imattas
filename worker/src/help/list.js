import { shell } from "./layout.js";
import { ENDPOINTS, PARAMS, paramsFor } from "./registry.js";

function paramValues(p) {
  if (p.type === "select") return p.options.map((o) => `<code>${o}</code>`).join(" ");
  if (p.type === "bool") return `<code>true</code>` + (p.onValue ? ` (sends <code>${p.onValue}</code>)` : "");
  if (p.type === "range") return `<code>${p.min}</code>–<code>${p.max}</code>`;
  if (p.type === "color") return `hex / name / <code>transparent</code>`;
  return p.placeholder ? `<code>${p.placeholder}</code>` : "any";
}

export function listPage() {
  const endpointRows = ENDPOINTS.map((e) => {
    const applicable = paramsFor(e.id)
      .filter((p) => p.key !== "user")
      .map((p) => `<span class="pill">${p.key}</span>`)
      .join(" ");
    return `<tr>
      <td><code>${e.path}</code></td>
      <td>${e.desc}${e.json ? "" : `<div style="margin-top:8px">${applicable}</div>`}</td>
    </tr>`;
  }).join("\n");

  const paramRows = PARAMS.map((p) => {
    const scope = p.applies.includes("*")
      ? "all cards"
      : p.applies.map((id) => `<code>${id}</code>`).join(", ");
    return `<tr>
      <td><code>${p.key}</code></td>
      <td>${p.label}${p.help ? `<div class="muted" style="margin-top:4px">${p.help}</div>` : ""}</td>
      <td>${paramValues(p)}</td>
      <td>${scope}</td>
    </tr>`;
  }).join("\n");

  const body = `
  <section class="hero">
    <div class="eyebrow">reference</div>
    <h1>Endpoints</h1>
    <p>Every image endpoint returns an SVG and accepts the parameters below. Combine them freely;
       build a URL visually on the <a href="/help/design">Designer</a>.</p>
  </section>

  <section style="margin-top:24px">
    <div class="panel" style="padding:8px 8px 0">
      <table>
        <thead><tr><th>Endpoint</th><th>What it returns · accepted params</th></tr></thead>
        <tbody>${endpointRows}</tbody>
      </table>
    </div>
  </section>

  <section style="margin-top:32px">
    <div class="eyebrow">parameters</div>
    <div class="panel" style="margin-top:12px; padding:8px 8px 0">
      <table>
        <thead><tr><th>Param</th><th>Description</th><th>Values</th><th>Applies to</th></tr></thead>
        <tbody>${paramRows}</tbody>
      </table>
    </div>
    <p class="muted" style="margin-top:14px">Colors accept bare hex (<code>0d1117</code>), <code>#hex</code>,
      CSS names, or <code>transparent</code>. Add <code>?mock=1</code> to preview any card with sample data and
      no token. Add <code>?user=NAME</code> to render for a different account.</p>
  </section>`;
  return shell("Endpoints", "list", body);
}
