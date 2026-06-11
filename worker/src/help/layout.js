// Shared HTML shell + styles for the /help site. Keeps every page consistent.

const CSS = `
:root{
  --bg:#0d1117; --panel:#161b22; --panel-2:#0d1117; --border:#30363d;
  --text:#c9d1d9; --muted:#8b949e; --title:#f0f6fc; --accent:#58a6ff;
  --accent-2:#1f6feb; --radius:12px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0; background:radial-gradient(1200px 600px at 50% -10%, #15203a 0%, var(--bg) 55%);
  color:var(--text); font:15px/1.6 'Segoe UI',Ubuntu,-apple-system,Helvetica,Arial,sans-serif;
  min-height:100vh;
}
a{color:var(--accent); text-decoration:none}
a:hover{text-decoration:underline}
code,.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
header.nav{
  position:sticky; top:0; z-index:10; backdrop-filter:blur(10px);
  background:rgba(13,17,23,.72); border-bottom:1px solid var(--border);
}
.nav-inner{max-width:1080px; margin:0 auto; padding:14px 24px; display:flex; align-items:center; gap:22px}
.brand{font-weight:700; color:var(--title); font-size:16px; letter-spacing:.3px}
.brand b{color:var(--accent)}
.nav a.link{color:var(--muted); font-weight:500}
.nav a.link.active,.nav a.link:hover{color:var(--title); text-decoration:none}
.nav .spacer{flex:1}
main{max-width:1080px; margin:0 auto; padding:40px 24px 80px}
.hero h1{font-size:34px; line-height:1.15; margin:0 0 12px; color:var(--title); letter-spacing:-.5px}
.hero p{font-size:17px; color:var(--muted); max-width:680px; margin:0 0 24px}
.btn{
  display:inline-flex; align-items:center; gap:8px; padding:10px 16px; border-radius:10px;
  background:var(--accent-2); color:#fff; font-weight:600; border:1px solid #2b6fe0; cursor:pointer;
}
.btn:hover{background:#2b7bff; text-decoration:none}
.btn.ghost{background:transparent; color:var(--text); border-color:var(--border)}
.btn.ghost:hover{border-color:var(--accent); color:var(--title)}
.grid{display:grid; gap:18px}
@media(min-width:760px){.cols-3{grid-template-columns:repeat(3,1fr)} .cols-2{grid-template-columns:1.1fr .9fr}}
.panel{background:var(--panel); border:1px solid var(--border); border-radius:var(--radius); padding:20px}
.panel h3{margin:.2em 0 .4em; color:var(--title); display:flex; align-items:center; gap:8px}
.panel p{margin:.2em 0; color:var(--muted)}
.eyebrow{text-transform:uppercase; letter-spacing:1.5px; font-size:11px; color:var(--accent); font-weight:700}
table{width:100%; border-collapse:collapse; font-size:14px}
th,td{text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); vertical-align:top}
th{color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.6px}
td code{background:var(--panel-2); border:1px solid var(--border); border-radius:6px; padding:1px 6px; color:#79c0ff}
.pill{display:inline-block; padding:2px 9px; border-radius:999px; background:#21262d; color:var(--muted); font-size:12px; border:1px solid var(--border)}
.muted{color:var(--muted)}
footer{max-width:1080px; margin:0 auto; padding:24px; color:var(--muted); font-size:13px; border-top:1px solid var(--border)}

/* designer */
.designer{display:grid; gap:24px}
@media(min-width:900px){.designer{grid-template-columns:340px 1fr}}
.controls{align-self:start}
.tabs{display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap}
.tab{padding:7px 12px; border-radius:8px; border:1px solid var(--border); background:var(--panel-2); color:var(--muted); cursor:pointer; font-size:13px; font-weight:600}
.tab.active{background:var(--accent-2); color:#fff; border-color:#2b6fe0}
.field{margin:0 0 14px}
.field label{display:block; font-size:13px; color:var(--text); margin-bottom:6px; font-weight:600}
.field .help{font-size:12px; color:var(--muted); margin-top:4px}
.field input[type=text],.field select,.field input[type=number]{
  width:100%; padding:8px 10px; border-radius:8px; background:var(--panel-2);
  border:1px solid var(--border); color:var(--text); font:inherit;
}
.field.row{display:flex; align-items:center; justify-content:space-between; gap:10px}
.field.row label{margin:0}
.color-wrap{display:flex; align-items:center; gap:8px}
.color-wrap input[type=color]{width:38px; height:32px; padding:0; border:1px solid var(--border); border-radius:8px; background:none; cursor:pointer}
.color-wrap .clear{font-size:12px; color:var(--muted); cursor:pointer; user-select:none}
input[type=range]{width:100%; accent-color:var(--accent)}
.switch{position:relative; width:42px; height:24px; flex:0 0 auto}
.switch input{opacity:0; width:0; height:0}
.slider{position:absolute; inset:0; background:#30363d; border-radius:999px; transition:.2s; cursor:pointer}
.slider:before{content:""; position:absolute; height:18px; width:18px; left:3px; top:3px; background:#fff; border-radius:50%; transition:.2s}
.switch input:checked+.slider{background:var(--accent-2)}
.switch input:checked+.slider:before{transform:translateX(18px)}
.preview-wrap{align-self:start; position:sticky; top:84px}
.preview-stage{
  display:flex; align-items:center; justify-content:center; min-height:240px; padding:24px;
  border:1px solid var(--border); border-radius:var(--radius);
  background:repeating-conic-gradient(#161b22 0 25%, #11151c 0 50%) 0 0/22px 22px;
}
.preview-stage img{max-width:100%; height:auto; filter:drop-shadow(0 8px 24px rgba(0,0,0,.5))}
.out{margin-top:16px}
.out label{font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.6px; font-weight:700}
.out .box{display:flex; gap:8px; margin-top:6px}
.out textarea{
  flex:1; resize:none; height:64px; padding:10px; border-radius:8px; background:var(--panel-2);
  border:1px solid var(--border); color:#79c0ff; font:12px/1.5 ui-monospace,Consolas,monospace;
}
.copied{color:#3fb950 !important}
`;

export function shell(title, active, body) {
  const nav = (id, href, label) =>
    `<a class="link${active === id ? " active" : ""}" href="${href}">${label}</a>`;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · ipa-cards</title>
<style>${CSS}</style>
</head><body>
<header class="nav"><div class="nav-inner">
  <span class="brand">ipa&#8209;<b>cards</b></span>
  ${nav("home", "/help", "Home")}
  ${nav("list", "/help/list", "Endpoints")}
  ${nav("design", "/help/design", "Designer")}
  <span class="spacer"></span>
  <a class="link" href="https://github.com/imattas" target="_blank" rel="noopener">GitHub</a>
</div></header>
<main>${body}</main>
<footer>ipa&#8209;cards — self-hosted GitHub profile cards on Cloudflare Workers. No third-party services.</footer>
</body></html>`;
}
