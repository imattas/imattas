import { shell } from "./layout.js";
import { ENDPOINTS, PARAMS } from "./registry.js";

// Client script. Written WITHOUT template literals / ${...} so it can be embedded
// verbatim inside the server-side template literal below. REG is injected as JSON.
const CLIENT = `
var current = (REG.endpoints.filter(function(e){return !e.json;})[0]||{}).id;
var state = {};

function paramsFor(id){ return REG.params.filter(function(p){ return p.applies.indexOf('*')>=0 || p.applies.indexOf(id)>=0; }); }
function endpoint(id){ return REG.endpoints.filter(function(e){ return e.id===id; })[0]; }
function helpHtml(p){ return p.help ? '<div class="help">'+p.help+'</div>' : ''; }

function fieldHtml(p){
  var t=p.type, head='<label>'+p.label+'</label>';
  if(t==='text') return '<div class="field" data-field="'+p.key+'" data-type="text">'+head+'<input type="text" placeholder="'+(p.placeholder||'')+'">'+helpHtml(p)+'</div>';
  if(t==='select'){ var o=p.options.map(function(x){return '<option'+(p.default===x?' selected':'')+'>'+x+'</option>';}).join(''); return '<div class="field" data-field="'+p.key+'" data-type="select">'+head+'<select>'+o+'</select>'+helpHtml(p)+'</div>'; }
  if(t==='range'){ var d=(p.default!=null?p.default:p.min); return '<div class="field" data-field="'+p.key+'" data-type="range"><label>'+p.label+' <span class="muted rngval">'+d+'</span></label><input type="range" min="'+p.min+'" max="'+p.max+'" value="'+d+'">'+helpHtml(p)+'</div>'; }
  if(t==='bool') return '<div class="field row" data-field="'+p.key+'" data-type="bool"><label>'+p.label+'</label><span class="switch"><input type="checkbox"><span class="slider"></span></span></div>'+(p.help?'<div class="help" style="margin-top:-8px;margin-bottom:14px">'+p.help+'</div>':'');
  if(t==='color') return '<div class="field" data-field="'+p.key+'" data-type="color">'+head+'<div class="color-wrap"><span class="switch"><input type="checkbox"><span class="slider"></span></span><input type="color" value="#58a6ff"><span class="muted">enable override</span></div></div>';
  return '';
}

function renderTabs(){
  document.getElementById('tabs').innerHTML = REG.endpoints.filter(function(e){return !e.json;}).map(function(e){
    return '<button class="tab'+(e.id===current?' active':'')+'" data-tab="'+e.id+'">'+e.title+'</button>';
  }).join('');
}
function renderDesc(){ var e=endpoint(current); document.getElementById('epdesc').textContent = e ? e.desc : ''; }
function renderControls(){ document.getElementById('controls').innerHTML = paramsFor(current).map(fieldHtml).join(''); applyState(); }

function applyState(){
  var vals=state[current]||{};
  document.querySelectorAll('#controls [data-field]').forEach(function(f){
    var key=f.dataset.field, type=f.dataset.type, v=vals[key];
    if(type==='color'){ var ck=f.querySelector('input[type=checkbox]'), col=f.querySelector('input[type=color]'); ck.checked=v!==undefined; if(v!==undefined) col.value=v; }
    else if(type==='bool'){ f.querySelector('input[type=checkbox]').checked=!!v; }
    else if(type==='range'){ var r=f.querySelector('input[type=range]'); if(v!==undefined) r.value=v; var rv=f.querySelector('.rngval'); if(rv) rv.textContent=r.value; }
    else { var el=f.querySelector('input,select'); if(v!==undefined) el.value=v; }
  });
}
function collect(){
  var vals={};
  document.querySelectorAll('#controls [data-field]').forEach(function(f){
    var key=f.dataset.field, type=f.dataset.type;
    if(type==='color'){ if(f.querySelector('input[type=checkbox]').checked) vals[key]=f.querySelector('input[type=color]').value; }
    else if(type==='bool'){ if(f.querySelector('input[type=checkbox]').checked) vals[key]=true; }
    else if(type==='range'){ vals[key]=f.querySelector('input[type=range]').value; var rv=f.querySelector('.rngval'); if(rv) rv.textContent=vals[key]; }
    else { var v=f.querySelector('input,select').value; if(v!=='') vals[key]=v; }
  });
  state[current]=vals;
}
function buildQuery(id, preview){
  var vals=state[id]||{}, sp=[];
  paramsFor(id).forEach(function(p){
    var v=vals[p.key];
    if(v===undefined) return;
    if(p.type==='bool'){ if(v) sp.push(p.key+'='+(p.onValue||'true')); return; }
    if(p.type==='select'){ if(p.default&&v===p.default) return; sp.push(p.key+'='+encodeURIComponent(v)); return; }
    if(p.type==='range'){ if(p.default!=null&&String(v)===String(p.default)) return; sp.push(p.key+'='+encodeURIComponent(v)); return; }
    if(p.type==='color'){ sp.push(p.key+'='+v.replace('#','')); return; }
    if(p.key==='user'){ if(v) sp.push('user='+encodeURIComponent(v)); return; }
    if(v!=='') sp.push(p.key+'='+encodeURIComponent(v));
  });
  if(preview && !vals.user) sp.push('mock=1');
  return sp.join('&');
}
var timer;
function update(){
  collect();
  var ep=endpoint(current);
  var q=buildQuery(current,false), qp=buildQuery(current,true);
  var abs=location.origin+ep.path+(q?'?'+q:'');
  document.getElementById('preview').src=ep.path+(qp?'?'+qp:'');
  document.getElementById('outUrl').value=abs;
  document.getElementById('outMd').value='!['+ep.title+']('+abs+')';
}
function debounced(){ clearTimeout(timer); timer=setTimeout(update,180); }
function copy(id, btn){ var el=document.getElementById(id); navigator.clipboard.writeText(el.value).then(function(){ var o=btn.textContent; btn.textContent='Copied!'; btn.classList.add('copied'); setTimeout(function(){ btn.textContent=o; btn.classList.remove('copied'); },1200); }); }

document.addEventListener('input', function(e){ if(e.target.closest && e.target.closest('#controls')) debounced(); });
document.addEventListener('change', function(e){ if(e.target.closest && e.target.closest('#controls')) update(); });
document.getElementById('tabs').addEventListener('click', function(e){
  var b=e.target.closest('[data-tab]'); if(!b) return;
  current=b.dataset.tab;
  document.querySelectorAll('#tabs .tab').forEach(function(x){ x.classList.toggle('active', x.dataset.tab===current); });
  renderDesc(); renderControls(); update();
});
renderTabs(); renderDesc(); renderControls(); update();
`;

export function designPage() {
  const reg = JSON.stringify({ endpoints: ENDPOINTS, params: PARAMS });
  const body = `
  <section class="hero">
    <div class="eyebrow">designer</div>
    <h1>Design your card</h1>
    <p>Pick a card, tweak it live, then copy the URL or Markdown into your README.
       Leave <strong>Username</strong> blank to preview with sample data; set it to render real stats.</p>
  </section>

  <div class="designer">
    <div class="controls">
      <div class="tabs" id="tabs"></div>
      <p class="muted" id="epdesc" style="margin:0 0 14px"></p>
      <div class="panel"><div id="controls"></div></div>
    </div>
    <div class="preview-wrap">
      <div class="preview-stage"><img id="preview" alt="card preview"></div>
      <div class="out">
        <label>Image URL</label>
        <div class="box"><textarea id="outUrl" readonly spellcheck="false"></textarea><button class="btn" onclick="copy('outUrl',this)">Copy</button></div>
      </div>
      <div class="out">
        <label>Markdown</label>
        <div class="box"><textarea id="outMd" readonly spellcheck="false"></textarea><button class="btn ghost" onclick="copy('outMd',this)">Copy</button></div>
      </div>
      <p class="muted" style="margin-top:12px">The checkerboard shows transparency — try the <code>liquid_glass</code> or <code>transparent</code> theme.</p>
    </div>
  </div>

  <script>const REG=${reg};\n${CLIENT}</script>`;
  return shell("Designer", "design", body);
}
