'use strict';

/* ─── THEME ─── */
function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  document.getElementById('themeBtn').textContent = isDark ? '☾ Dark' : '☀ Light';
  drawChart();
  if (simData) { drawSimCanvas(simData); drawTimelineCanvas(simData); drawAnimFrame(animCurrentSlot); }
}

/* ─── NAV ─── */
function navGo(id, el) {
  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('on'));
  if (el && el.classList && el.classList.contains('nav-link')) el.classList.add('on');
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}

/* ─── LEARN MODAL ─── */
function openLearn()  { document.getElementById('learnModal').classList.add('open'); }
function closeLearn() { document.getElementById('learnModal').classList.remove('open'); }
document.getElementById('learnModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeLearn(); });

function showLearnTab(i, btn) {
  document.querySelectorAll('.learn-tab').forEach((b, idx) => b.classList.toggle('on', idx === i));
  document.querySelectorAll('.learn-pane').forEach((p, idx) => p.classList.toggle('on', idx === i));
}

/* ─── DEVELOPED BY MODAL ─── */
function openDevBy()  { document.getElementById('devByModal').classList.add('open'); }
function closeDevBy() { document.getElementById('devByModal').classList.remove('open'); }
document.getElementById('devByModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeDevBy(); });

/* ─── HELP MODAL ─── */
function openHelp()  { document.getElementById('helpModal').classList.add('open'); }
function closeHelp() { document.getElementById('helpModal').classList.remove('open'); }
document.getElementById('helpModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeHelp(); });

/* ─── DOWNLOAD ─── */
function dlPage() {
  const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'alohanet-interactive.html'; a.click();
}

function getDlFormat() {
  const r = document.querySelector('input[name="dlFmt"]:checked');
  return r ? r.value : 'html';
}

function dlSim() {
  if (!simData) { alert('Run a simulation first before downloading.'); return; }
  const fmt = getDlFormat();
  if (fmt === 'png')  return dlSimPNG();
  if (fmt === 'json') return dlSimJSON();
  if (fmt === 'csv')  return dlSimCSV();
  dlSimHTML();
}

function dlSimPNG() {
  const cv = document.getElementById('sim-canvas');
  if (!cv) return;
  const a = document.createElement('a');
  a.href = cv.toDataURL('image/png');
  a.download = `aloha-sim-${simData.proto}-${Date.now()}.png`;
  a.click();
}

function dlSimJSON() {
  const d = simData;
  const payload = {
    protocol: d.proto,
    stations: d.nSta,
    offeredLoad_G: d.G,
    txProbability_p: +d.p.toFixed(6),
    slots: d.nSlots,
    metrics: {
      framesSent: d.slots.reduce((a,s)=>a+s.txStations.length,0),
      successful:  d.slots.filter(s=>s.type==='success').length,
      collisions:  d.slots.filter(s=>s.type==='collision').length,
      throughput_S: +(d.slots.filter(s=>s.type==='success').length/d.nSlots).toFixed(5),
    },
    slotLog: d.slots.map((s,i)=>({slot:i,type:s.type,stations:s.txStations}))
  };
  const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`aloha-sim-${d.proto}-${Date.now()}.json`; a.click();
}

function dlSimCSV() {
  const rows = ['slot,type,station_count,stations'];
  simData.slots.forEach((s,i)=>{
    rows.push(`${i},${s.type},${s.txStations.length},"${s.txStations.map(x=>'S'+x).join('|')}"`);
  });
  const blob = new Blob([rows.join('\n')],{type:'text/csv'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`aloha-sim-${simData.proto}-${Date.now()}.csv`; a.click();
}

function dlSimHTML() {
  const d = simData;
  const sent = d.slots.reduce((a,s)=>a+s.txStations.length,0);
  const succ = d.slots.filter(s=>s.type==='success').length;
  const coll = d.slots.filter(s=>s.type==='collision').length;
  const tp   = (succ/d.nSlots).toFixed(5);
  const cv   = document.getElementById('sim-canvas');
  const imgSrc = cv ? cv.toDataURL('image/png') : '';
  const tlCv  = document.getElementById('tl-canvas');
  const tlSrc = tlCv ? tlCv.toDataURL('image/png') : '';

  const logRows = d.slots.slice(0,60).map((s,i)=>{
    const cls = s.type==='success'?'color:#34d399':s.type==='collision'?'color:#f87171':'color:#5a6278';
    const msg = s.type==='success'?`Success (S${s.txStations[0]})`:s.type==='collision'?`Collision [${s.txStations.map(x=>'S'+x).join(', ')}]`:'Empty';
    return `<tr><td style="color:#5a6278;font-family:monospace">sl.${String(i).padStart(2,'0')}</td><td style="${cls}">${msg}</td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>ALOHA Sim Report — ${new Date().toLocaleString()}</title>
<style>
  body{background:#08090b;color:#e2e4ec;font-family:'Segoe UI',sans-serif;padding:32px;max-width:900px;margin:auto}
  h1{font-size:22px;border-bottom:1px solid #222;padding-bottom:12px;margin-bottom:24px;color:#3b9eff}
  .badge{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;
    background:#1c1d26;border:1px solid #333;margin-right:6px}
  .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
  .m{background:#0f1014;border:1px solid #222;border-radius:8px;padding:14px;text-align:center}
  .mv{font-size:28px;font-weight:700;font-family:monospace}
  .ml{font-size:11px;color:#5a6278;margin-top:4px}
  .green{color:#34d399}.red{color:#f87171}.blue{color:#3b9eff}
  img{width:100%;border-radius:8px;border:1px solid #222;margin:8px 0}
  table{width:100%;border-collapse:collapse;font-size:12px;font-family:monospace}
  th{text-align:left;padding:6px 10px;border-bottom:1px solid #222;color:#5a6278;font-size:10px}
  td{padding:5px 10px;border-bottom:1px solid #111}
  .section{margin:24px 0}
  h3{font-size:14px;color:#9ba3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #222;font-size:11px;color:#5a6278}
</style></head><body>
<h1>ALOHA Simulation Report</h1>
<span class="badge">${d.proto.toUpperCase()} ALOHA</span>
<span class="badge">G = ${d.G}</span>
<span class="badge">${d.nSta} Stations</span>
<span class="badge">${d.nSlots} Slots</span>
<span class="badge">${new Date().toLocaleString()}</span>

<div class="metrics">
  <div class="m"><div class="mv">${sent}</div><div class="ml">Frames Sent</div></div>
  <div class="m"><div class="mv green">${succ}</div><div class="ml">Successful</div></div>
  <div class="m"><div class="mv red">${coll}</div><div class="ml">Collisions</div></div>
  <div class="m"><div class="mv blue">${tp}</div><div class="ml">Throughput S</div></div>
</div>

<div class="section"><h3>Channel View</h3>${imgSrc?`<img src="${imgSrc}" alt="sim canvas">`:'(canvas unavailable)'}</div>
<div class="section"><h3>Station Timeline</h3>${tlSrc?`<img src="${tlSrc}" alt="timeline">`:'(canvas unavailable)'}</div>

<div class="section"><h3>Slot Log (first 60)</h3>
<table><thead><tr><th>Slot</th><th>Event</th></tr></thead><tbody>${logRows}</tbody></table></div>

<div class="footer">Generated by ALOHAnet Interactive Protocol Lab · p = ${d.p.toFixed(5)}</div>
</body></html>`;

  const blob = new Blob([html],{type:'text/html'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`aloha-sim-report-${Date.now()}.html`; a.click();
}

/* ─── COLOR HELPER ─── */
const C = {
  bg2:   () => getComputedStyle(document.documentElement).getPropertyValue('--bg2').trim(),
  bg3:   () => getComputedStyle(document.documentElement).getPropertyValue('--bg3').trim(),
  border:() => getComputedStyle(document.documentElement).getPropertyValue('--border').trim(),
  border2:()=> getComputedStyle(document.documentElement).getPropertyValue('--border2').trim(),
  amber: () => getComputedStyle(document.documentElement).getPropertyValue('--amber').trim(),
  blue:  () => getComputedStyle(document.documentElement).getPropertyValue('--blue').trim(),
  green: () => getComputedStyle(document.documentElement).getPropertyValue('--green').trim(),
  red:   () => getComputedStyle(document.documentElement).getPropertyValue('--red').trim(),
  dim:   () => getComputedStyle(document.documentElement).getPropertyValue('--dim').trim(),
  text2: () => getComputedStyle(document.documentElement).getPropertyValue('--text2').trim(),
  text:  () => getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),
};

/* ─── THROUGHPUT CHART ─── */
function drawChart() {
  const cv = document.getElementById('tp-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  cv.width  = cv.parentElement.offsetWidth;
  cv.height = 360;
  const W = cv.width, H = cv.height;
  const PAD = { l: 54, r: 24, t: 24, b: 44 };
  const cw = W - PAD.l - PAD.r, ch = H - PAD.t - PAD.b;
  const Gmax = 3.5, Smax = 0.45;
  const toX = g => PAD.l + (g / Gmax) * cw;
  const toY = s => PAD.t + (1 - s / Smax) * ch;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg2(); ctx.fillRect(0, 0, W, H);

  [0.1,0.2,0.3,0.4].forEach(s => {
    ctx.strokeStyle = C.border(); ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(PAD.l, toY(s)); ctx.lineTo(PAD.l+cw, toY(s)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.dim(); ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'right';
    ctx.fillText(s.toFixed(1), PAD.l-8, toY(s)+4);
  });
  [0.5,1,1.5,2,2.5,3,3.5].forEach(g => {
    ctx.strokeStyle = C.border(); ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(toX(g), PAD.t); ctx.lineTo(toX(g), PAD.t+ch); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.dim(); ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText(g.toFixed(1), toX(g), H-12);
  });

  ctx.strokeStyle = C.border2(); ctx.lineWidth = 1.5; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, PAD.t+ch); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PAD.l, PAD.t+ch); ctx.lineTo(PAD.l+cw, PAD.t+ch); ctx.stroke();

  ctx.fillStyle = C.dim(); ctx.font = '11px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('Offered Load  G', PAD.l+cw/2, H-2);
  ctx.save(); ctx.translate(14, H/2); ctx.rotate(-Math.PI/2);
  ctx.fillText('Throughput  S', 0, 0); ctx.restore();

  const Gs = Array.from({ length: 701 }, (_, i) => i/700*Gmax);

  ctx.setLineDash([7,5]); ctx.lineWidth = 2.5; ctx.strokeStyle = C.amber();
  ctx.beginPath();
  Gs.forEach((G,i) => { const S = G*Math.exp(-2*G); i===0 ? ctx.moveTo(toX(G),toY(S)) : ctx.lineTo(toX(G),toY(S)); });
  ctx.stroke(); ctx.setLineDash([]);

  ctx.lineWidth = 2.5; ctx.strokeStyle = C.blue();
  ctx.beginPath();
  Gs.forEach((G,i) => { const S = G*Math.exp(-G); i===0 ? ctx.moveTo(toX(G),toY(S)) : ctx.lineTo(toX(G),toY(S)); });
  ctx.stroke();

  const peaks = [
    { G:0.5, S:0.5*Math.exp(-1), label:'Pure: G=0.5, S=0.184', color:C.amber() },
    { G:1.0, S:Math.exp(-1),     label:'Slotted: G=1.0, S=0.368', color:C.blue() },
  ];
  if (window._showPeaks !== false) peaks.forEach(pt => {
    const px = toX(pt.G), py = toY(pt.S);
    ctx.strokeStyle = C.dim(); ctx.lineWidth = 0.8; ctx.setLineDash([3,4]);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, PAD.t+ch); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI*2);
    ctx.fillStyle = pt.color; ctx.fill();
    ctx.strokeStyle = C.bg2(); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.text2(); ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'left';
    ctx.fillText(pt.label, px+10, py-10);
  });
}

/* ─── THROUGHPUT TABLE ─── */
function buildThroughputTable() {
  const tbody = document.getElementById('throughput-tbody');
  if (!tbody) return;
  const Gs = [0.1,0.25,0.3,0.4,0.5,0.6,0.7,0.8,1.0,1.2,1.5,2.0];
  tbody.innerHTML = Gs.map(G => {
    const Sp = G*Math.exp(-2*G), Ss = G*Math.exp(-G);
    const ratio = Sp > 0.0001 ? (Ss/Sp).toFixed(2) : '∞';
    const mark = g => (g===0.5||g===1.0) ? ' ★' : '';
    return `<tr>
      <td class="td-highlight">${G.toFixed(2)}${mark(G)}</td>
      <td class="td-pure">${Sp.toFixed(4)}</td>
      <td class="td-pure">${(Sp*100).toFixed(2)}%</td>
      <td class="td-slot">${Ss.toFixed(4)}</td>
      <td class="td-slot">${(Ss*100).toFixed(2)}%</td>
      <td>${ratio}×</td>
    </tr>`;
  }).join('');
}

/* ─── SIMULATION ─── */
let simProto = 'pure';
let simData  = null;

function setProto(t) {
  simProto = t;
  document.getElementById('b-pure').classList.toggle('on', t==='pure');
  document.getElementById('b-slot').classList.toggle('on', t==='slotted');
}

function updVals() {
  document.getElementById('v-sta').textContent = document.getElementById('s-sta').value;
  document.getElementById('v-g').textContent   = (document.getElementById('s-g').value/10).toFixed(1);
  document.getElementById('v-sl').textContent  = document.getElementById('s-sl').value;
}

function runSim() {
  const btn = document.getElementById('runBtn');
  btn.classList.add('running'); btn.textContent = '⏳ Simulating…';
  setTimeout(() => {
    const nSta   = parseInt(document.getElementById('s-sta').value);
    const G      = parseInt(document.getElementById('s-g').value) / 10;
    const nSlots = parseInt(document.getElementById('s-sl').value);
    const proto  = simProto;
    const p      = Math.min(G / nSta, 1.0);
    let slots = [], txList = [];

    if (proto === 'slotted') {
      for (let s = 0; s < nSlots; s++) {
        const txStations = [];
        for (let st = 0; st < nSta; st++) { if (Math.random() < p) txStations.push(st); }
        slots.push({ txStations, type: txStations.length===0?'empty':txStations.length===1?'success':'collision' });
      }
    } else {
      for (let st = 0; st < nSta; st++) {
        for (let s = 0; s < nSlots; s++) {
          if (Math.random() < p) {
            const offset = Math.random() * 0.9;
            txList.push({ station:st, start:s+offset, end:s+offset+1.0, collision:false });
          }
        }
      }
      txList.forEach((f1,i) => txList.forEach((f2,j) => {
        if (i!==j && !(f1.end<=f2.start || f2.end<=f1.start)) f1.collision=true;
      }));
      for (let s = 0; s < nSlots; s++) {
        const inSlot = txList.filter(f => Math.floor(f.start)===s);
        const type   = inSlot.length===0?'empty':inSlot.some(f=>f.collision)?'collision':'success';
        slots.push({ txStations:inSlot.map(f=>f.station), type, frames:inSlot });
      }
    }

    simData = { nSta, nSlots, G, p, proto, slots, txList };
    updateMetrics(slots, nSlots);
    buildSimLog(slots);
    drawSimCanvas(simData);
    drawTimelineCanvas(simData);
    animReset();
    btn.classList.remove('running'); btn.innerHTML = '▶&nbsp; Run Simulation';
  }, 50);
}

function updateMetrics(slots, nSlots) {
  const sent = slots.reduce((a,s) => a+s.txStations.length, 0);
  const succ = slots.filter(s=>s.type==='success').length;
  const coll = slots.filter(s=>s.type==='collision').length;
  document.getElementById('m-sent').textContent = sent;
  document.getElementById('m-succ').textContent = succ;
  document.getElementById('m-coll').textContent = coll;
  document.getElementById('m-tp').textContent   = (succ/nSlots).toFixed(3);
}

function buildSimLog(slots) {
  const log = document.getElementById('sim-log');
  log.innerHTML = '';
  slots.slice(0,60).forEach((s,i) => {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    let cls='log-e', msg='Empty';
    if (s.type==='success')   { cls='log-s'; msg=`Success (S${s.txStations[0]})`; }
    else if (s.type==='collision') { cls='log-c'; msg=`Collision [${s.txStations.map(x=>'S'+x).join(', ')}]`; }
    entry.innerHTML = `<span class="log-t">sl.${String(i).padStart(2,'0')}</span><span class="${cls}">${msg}</span>`;
    log.appendChild(entry);
  });
}

function drawSimCanvas(data) {
  const cv = document.getElementById('sim-canvas'); if (!cv) return;
  const ctx = cv.getContext('2d');
  cv.width = cv.parentElement.offsetWidth; cv.height = 180;
  const W=cv.width, H=cv.height, PAD={l:36,r:16,t:24,b:24};
  const cw=W-PAD.l-PAD.r, ch=H-PAD.t-PAD.b;
  const { nSlots, slots, proto, txList } = data;
  const slotW = cw/nSlots;

  ctx.fillStyle=C.bg3(); ctx.fillRect(0,0,W,H);
  for (let i=0; i<nSlots; i++) {
    if (i%2===0) { ctx.fillStyle=C.bg2()+'88'; ctx.fillRect(PAD.l+i*slotW,PAD.t,slotW,ch); }
  }
  ctx.strokeStyle=C.border2(); ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(PAD.l,PAD.t+ch); ctx.lineTo(PAD.l+cw,PAD.t+ch); ctx.stroke();
  ctx.fillStyle=C.dim(); ctx.font='10px Space Mono,monospace'; ctx.textAlign='center';
  ctx.fillText('Time Slots', PAD.l+cw/2, H-4);

  if (proto==='pure') {
    txList.forEach(f => {
      const x=PAD.l+(f.start/nSlots)*cw, w=slotW;
      const col=f.collision?C.red():C.green();
      ctx.fillStyle=col+'44'; ctx.fillRect(x,PAD.t+4,w,ch-8);
      ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.strokeRect(x,PAD.t+4,w,ch-8);
    });
  } else {
    slots.forEach((s,i) => {
      if (s.type==='empty') return;
      const x=PAD.l+i*slotW;
      const col=s.type==='collision'?C.red():C.green();
      ctx.fillStyle=col+'44'; ctx.fillRect(x+1,PAD.t+4,slotW-2,ch-8);
      ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.strokeRect(x+1,PAD.t+4,slotW-2,ch-8);
    });
  }
}

function drawTimelineCanvas(data) {
  const cv = document.getElementById('tl-canvas'); if (!cv) return;
  const ctx = cv.getContext('2d');
  cv.width = cv.parentElement.offsetWidth;
  const rowH=22, H=(data.nSta*rowH)+40; cv.height=H;
  const { nSlots, proto, txList, slots } = data;
  const PAD={l:36,r:16,t:10,b:20}, cw=cv.width-PAD.l-PAD.r, slotW=cw/nSlots;

  ctx.fillStyle=C.bg3(); ctx.fillRect(0,0,cv.width,H);
  for (let st=0; st<data.nSta; st++) {
    const y=PAD.t+st*rowH;
    ctx.fillStyle=C.dim(); ctx.font='9px Space Mono,monospace'; ctx.textAlign='right';
    ctx.fillText('S'+st, PAD.l-4, y+14);
    ctx.strokeStyle=C.border(); ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(PAD.l,y+rowH); ctx.lineTo(cv.width-PAD.r,y+rowH); ctx.stroke();
  }
  if (proto==='pure') {
    txList.forEach(f => {
      const x=PAD.l+(f.start/nSlots)*cw, y=PAD.t+f.station*rowH;
      const col=f.collision?C.red():C.green();
      ctx.fillStyle=col+'77'; ctx.fillRect(x,y+3,slotW,rowH-6);
    });
  } else {
    slots.forEach((s,i) => {
      s.txStations.forEach(st => {
        const x=PAD.l+i*slotW, y=PAD.t+st*rowH;
        const col=s.type==='collision'?C.red():C.green();
        ctx.fillStyle=col+'77'; ctx.fillRect(x+1,y+3,slotW-2,rowH-6);
      });
    });
  }
}

/* ─── ANIMATION ─── */
let animCurrentSlot=0, animTimer=null, animSpeed=600;

function animReset() {
  clearTimeout(animTimer); animTimer=null; animCurrentSlot=0;
  document.getElementById('anim-play-btn').classList.remove('active');
  document.getElementById('anim-progress').style.width='0';
  document.getElementById('anim-slot-label').textContent='Slot: 0';
  if (simData) drawAnimFrame(0);
}

function animPlay() {
  if (!simData || animTimer) return;
  document.getElementById('anim-play-btn').classList.add('active');
  const step = () => {
    drawAnimFrame(animCurrentSlot);
    if (animCurrentSlot < simData.nSlots-1) { animCurrentSlot++; animTimer=setTimeout(step,animSpeed); }
    else animPause();
  };
  step();
}

function animPause() {
  clearTimeout(animTimer); animTimer=null;
  document.getElementById('anim-play-btn').classList.remove('active');
}

function drawAnimFrame(slotIdx) {
  const cv=document.getElementById('anim-canvas'); if (!cv||!simData) return;
  const ctx=cv.getContext('2d');
  cv.width=cv.parentElement.offsetWidth; cv.height=120;
  const W=cv.width, H=cv.height, { nSlots, slots } = simData;
  const PAD={l:36,r:16,t:16,b:20};
  const slotW=(W-PAD.l-PAD.r)/nSlots;
  ctx.fillStyle=C.bg3(); ctx.fillRect(0,0,W,H);

  document.getElementById('anim-progress').style.width=((slotIdx+1)/nSlots*100)+'%';
  document.getElementById('anim-slot-label').textContent=`Slot: ${slotIdx}`;

  slots.forEach((s,i) => {
    if (s.type==='empty') return;
    if (i<=slotIdx) {
      const base = s.type==='collision'?C.red():C.green();
      ctx.fillStyle = i===slotIdx ? base+'cc' : base+'22';
      ctx.fillRect(PAD.l+i*slotW+1, PAD.t+4, slotW-2, H-PAD.t-PAD.b-4);
    }
  });

  if (slots[slotIdx] && slots[slotIdx].type!=='empty') {
    const cur=slots[slotIdx];
    const x=PAD.l+slotIdx*slotW;
    const col=cur.type==='collision'?C.red():C.green();
    ctx.fillStyle=col+'ee'; ctx.fillRect(x+1,PAD.t+2,slotW-2,H-PAD.t-PAD.b);
    ctx.fillStyle='#fff'; ctx.font='bold 10px Space Mono,monospace'; ctx.textAlign='center';
    ctx.fillText(cur.type==='collision'?'COL':'OK', x+slotW/2, PAD.t+(H-PAD.t-PAD.b)/2+4);
  }
}

function setAnimSpeed(ms, btn) {
  animSpeed=ms;
  document.querySelectorAll('.anim-spd-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
}

function animSeek(e, el) {
  if (!simData) return;
  const rect=el.getBoundingClientRect();
  animCurrentSlot=Math.min(Math.floor(((e.clientX-rect.left)/rect.width)*simData.nSlots), simData.nSlots-1);
  drawAnimFrame(animCurrentSlot);
}

/* ─── NUMERICALS ─── */
function showP(i) {
  document.querySelectorAll('.num-tab').forEach((b,idx) => b.classList.toggle('on',idx===i));
  document.querySelectorAll('.num-prob').forEach((p,idx) => p.classList.toggle('on',idx===i));
}

/* ─── SMART SOLVER ─── */
function smartSolve(type, btn) {
  // Highlight active button
  document.querySelectorAll('.smart-prob-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Read ALL inputs
  const proto   = document.getElementById('sol-proto').value;
  const G       = parseFloat(document.getElementById('sol-G').value)        || 0.5;
  const k       = parseInt(document.getElementById('sol-k').value)          || 5;
  const p       = parseFloat(document.getElementById('sol-p').value)        || 0.2;
  const bwRaw   = parseFloat(document.getElementById('sol-bw').value)       || 200;
  const bwUnit  = document.getElementById('sol-bw-unit').value;
  const fsRaw   = parseFloat(document.getElementById('sol-frame').value)    || 1000;
  const fsUnit  = document.getElementById('sol-frame-unit').value;
  const Starget = parseFloat(document.getElementById('sol-S-target').value) || 0.10;
  const Spct    = parseFloat(document.getElementById('sol-S-pct').value)    || 30;

  const bwMul   = { bps:1, kbps:1e3, Mbps:1e6, Gbps:1e9 }[bwUnit];
  const fsMul   = { bits:1, bytes:8, KB:8192, MB:8388608 }[fsUnit];
  const bwBps   = bwRaw * bwMul;
  const fsBits  = fsRaw * fsMul;
  const isPure  = proto === 'pure';
  const label   = isPure ? 'Pure' : 'Slotted';
  const Tp      = fsBits / bwBps;

  // Core computed values
  const S       = isPure ? G * Math.exp(-2*G)  : G * Math.exp(-G);
  const Pempty  = isPure ? Math.exp(-2*G)       : Math.exp(-G);
  const Pcoll   = Math.max(0, 1 - Pempty - S);
  const pSuccB  = k * p * Math.pow(1-p, k-1);
  const effBps  = S * bwBps;

  // Formatters
  const fBW = b => {
    if (b >= 1e9) return `${(b/1e9).toFixed(4)} Gbps`;
    if (b >= 1e6) return `${(b/1e6).toFixed(4)} Mbps`;
    if (b >= 1e3) return `${(b/1e3).toFixed(4)} kbps`;
    return `${b.toFixed(4)} bps`;
  };
  const fFS = bits => {
    if (bits >= 8388608) return `${(bits/8388608).toFixed(4)} MB`;
    if (bits >= 8192)    return `${(bits/8192).toFixed(4)} KB`;
    if (bits % 8 === 0)  return `${bits} bits (${bits/8} bytes)`;
    return `${bits} bits`;
  };
  const fT = s => {
    if (s < 1e-6) return `${(s*1e9).toFixed(4)} ns`;
    if (s < 1e-3) return `${(s*1e6).toFixed(4)} µs`;
    if (s < 1)    return `${(s*1e3).toFixed(4)} ms`;
    return `${s.toFixed(6)} s`;
  };
  const pct = v => `${(v*100).toFixed(4)}%`;

  // Build steps array for given type
  let title = '', steps = [], summary = '', note = '';

  if (type === 'throughput') {
    title = `Find Throughput S — ${label} ALOHA`;
    steps = [
      { n:1, desc:'Identify formula for the protocol',
        math:`${label} ALOHA formula: <strong>S = G · e<sup>${isPure?'−2G':'−G'}</sup></strong>` },
      { n:2, desc:'Substitute offered load G',
        math:`G = <strong>${G}</strong><br>
              Exponent = ${isPure?`−2 × ${G} = ${(-2*G).toFixed(4)}`:`−${G}`}<br>
              e<sup>${isPure?(-2*G).toFixed(4):(-G).toFixed(4)}</sup> = <strong>${(isPure?Math.exp(-2*G):Math.exp(-G)).toFixed(6)}</strong>` },
      { n:3, desc:'Calculate S',
        math:`S = ${G} × ${(isPure?Math.exp(-2*G):Math.exp(-G)).toFixed(6)}<br>
              S = <strong>${S.toFixed(6)}</strong>` },
      { n:4, desc:'Convert to percentage',
        math:`S = ${S.toFixed(6)} × 100 = <strong>${pct(S)}</strong> channel utilisation` },
    ];
    summary = `<strong style="color:var(--green)">✓ Throughput S = ${S.toFixed(6)} = ${pct(S)}</strong>`;
    note = `${label} ALOHA max possible is ${isPure?'18.4% at G=0.5':'36.8% at G=1.0'}. Your G=${G} gives ${pct(S)}.`;

  } else if (type === 'probabilities') {
    title = `Find All Probabilities — ${label} ALOHA at G = ${G}`;
    steps = [
      { n:1, desc:'Throughput S = P(exactly one station transmits successfully)',
        math:`S = G · e<sup>${isPure?'−2G':'−G'}</sup> = ${G} · e<sup>${isPure?-2*G:-G}</sup><br>
              S = <strong>${S.toFixed(6)} = ${pct(S)}</strong>` },
      { n:2, desc:`P(empty ${isPure?'period':'slot'}) — no station transmits in vulnerable window`,
        math:`P(empty) = e<sup>${isPure?'−2G':'−G'}</sup> = e<sup>${isPure?(-2*G).toFixed(4):(-G).toFixed(4)}</sup><br>
              P(empty) = <strong>${Pempty.toFixed(6)} = ${pct(Pempty)}</strong><br>
              <span style="color:var(--dim)">Vulnerable period = ${isPure?'2×T_p (Pure ALOHA)':'1×T_p (Slotted ALOHA)'}</span>` },
      { n:3, desc:'P(collision) — two or more stations transmit simultaneously',
        math:`P(collision) = 1 − P(empty) − P(success)<br>
              = 1 − ${Pempty.toFixed(6)} − ${S.toFixed(6)}<br>
              P(collision) = <strong>${Pcoll.toFixed(6)} = ${pct(Pcoll)}</strong>` },
      { n:4, desc:'Verify all three probabilities sum to 1',
        math:`P(empty) + P(success) + P(collision)<br>
              = ${Pempty.toFixed(6)} + ${S.toFixed(6)} + ${Pcoll.toFixed(6)}<br>
              = <strong>${(Pempty+S+Pcoll).toFixed(4)} ≈ 1.0000 ✓</strong>` },
    ];
    summary = `P(empty) = <strong>${pct(Pempty)}</strong> &nbsp;|&nbsp; P(success) = <strong>${pct(S)}</strong> &nbsp;|&nbsp; P(collision) = <strong>${pct(Pcoll)}</strong>`;
    note = `Always check: P(empty) + P(success) + P(collision) = 1. Useful exam cross-check.`;

  } else if (type === 'binomial') {
    title = `P(Success) Binomial — k = ${k} stations, p = ${p}`;
    const oneminp_km1 = Math.pow(1-p, k-1);
    steps = [
      { n:1, desc:'Binomial success formula — exactly 1 of k stations transmits',
        math:`<strong>P<sub>s</sub> = k · p · (1−p)<sup>k−1</sup></strong><br>
              = C(${k},1) · p · (1−p)<sup>${k}−1</sup>` },
      { n:2, desc:`Compute (1−p)<sup>k−1</sup>`,
        math:`(1 − ${p})<sup>${k-1}</sup> = (${(1-p).toFixed(4)})<sup>${k-1}</sup><br>
              = <strong>${oneminp_km1.toFixed(6)}</strong>` },
      { n:3, desc:'Substitute all values',
        math:`P<sub>s</sub> = ${k} × ${p} × ${oneminp_km1.toFixed(6)}<br>
              = <strong>${pSuccB.toFixed(6)} = ${pct(pSuccB)}</strong>` },
      { n:4, desc:'Check if p is already optimal',
        math:`Optimal p = 1/k = 1/${k} = <strong>${(1/k).toFixed(4)}</strong><br>
              Your p = ${p} ${Math.abs(p - 1/k) < 0.001 ? '→ <strong style="color:var(--green)">Already optimal! ✓</strong>' : `→ <span style="color:var(--amber)">Not optimal. Try p = ${(1/k).toFixed(4)} for best result.</span>`}` },
    ];
    const pOptSucc = k * (1/k) * Math.pow(1 - 1/k, k-1);
    summary = `P(success) = <strong>${pSuccB.toFixed(6)} = ${pct(pSuccB)}</strong><br>
               At optimal p = 1/k = ${(1/k).toFixed(4)}: Max P(success) = <strong>${pOptSucc.toFixed(6)} = ${pct(pOptSucc)}</strong>`;
    note = `Binomial model is exact for finite k stations. Poisson model (S = G·e^{-G}) is the large-k approximation.`;

  } else if (type === 'optimal_p') {
    const pOpt     = isPure ? 1/(2*k) : 1/k;
    const PsOpt    = k * pOpt * Math.pow(1-pOpt, k-1);
    title = `Optimal p & Max P(success) — ${label} ALOHA, k = ${k}`;
    steps = [
      { n:1, desc:`Optimal transmission probability formula for ${label} ALOHA`,
        math:`${isPure
          ? `Pure ALOHA: <strong>p* = 1 / (2k) = 1 / (2×${k}) = ${pOpt.toFixed(6)}</strong>`
          : `Slotted ALOHA: <strong>p* = 1 / k = 1 / ${k} = ${pOpt.toFixed(6)}</strong>`}` },
      { n:2, desc:'Substitute p* into binomial success formula',
        math:`P<sub>s,max</sub> = k · p* · (1−p*)<sup>k−1</sup><br>
              = ${k} × ${pOpt.toFixed(6)} × (1 − ${pOpt.toFixed(6)})<sup>${k-1}</sup><br>
              = ${k} × ${pOpt.toFixed(6)} × (${(1-pOpt).toFixed(6)})<sup>${k-1}</sup>` },
      { n:3, desc:`Compute (1−p*)<sup>k−1</sup>`,
        math:`(${(1-pOpt).toFixed(6)})<sup>${k-1}</sup> = <strong>${Math.pow(1-pOpt,k-1).toFixed(6)}</strong>` },
      { n:4, desc:'Final result',
        math:`P<sub>s,max</sub> = ${k} × ${pOpt.toFixed(6)} × ${Math.pow(1-pOpt,k-1).toFixed(6)}<br>
              = <strong>${PsOpt.toFixed(6)} = ${pct(PsOpt)}</strong>` },
      { n:5, desc:'Intuition — as k → ∞',
        math:`P<sub>s,max</sub> → (1 − 1/k)<sup>k−1</sup> → 1/e ≈ 0.3679 as k → ∞<br>
              At k=${k}: P<sub>s,max</sub> = <strong>${pct(PsOpt)}</strong> (${k<20?'small k, so slightly above 1/e':'approaches 1/e'})` },
    ];
    summary = `Optimal p* = <strong>${pOpt.toFixed(6)}</strong> &nbsp;|&nbsp; Max P(success) = <strong>${pct(PsOpt)}</strong>`;
    note = `Setting every station to p = 1/k (Slotted) or 1/(2k) (Pure) maximises the probability that exactly one station transmits per slot.`;

  } else if (type === 'frame_time') {
    title = `Frame Transmission Time T\u209A`;
    steps = [
      { n:1, desc:'Convert frame size to bits',
        math:`Frame size = ${fsRaw} ${fsUnit}<br>
              Conversion factor: 1 ${fsUnit} = ${fsMul} bits<br>
              Frame size = ${fsRaw} × ${fsMul} = <strong>${fsBits.toLocaleString()} bits</strong>` },
      { n:2, desc:'Convert bandwidth to bps',
        math:`Bandwidth = ${bwRaw} ${bwUnit}<br>
              Conversion factor: 1 ${bwUnit} = ${bwMul.toExponential()} bps<br>
              Bandwidth = ${bwRaw} × ${bwMul.toExponential()} = <strong>${fBW(bwBps)}</strong>` },
      { n:3, desc:'Apply formula T_p = Frame Size / Bandwidth',
        math:`T_p = ${fsBits.toLocaleString()} bits ÷ ${bwBps.toExponential(4)} bps<br>
              T_p = <strong>${fT(Tp)}</strong> = ${Tp.toFixed(8)} s` },
      { n:4, desc:'Maximum channel capacity (frames/sec)',
        math:`Max frames/sec = 1 / T_p = 1 / ${Tp.toFixed(8)}<br>
              = <strong>${(1/Tp).toFixed(2)} frames/sec</strong>` },
    ];
    summary = `T\u209A = <strong>${fT(Tp)}</strong> &nbsp;|&nbsp; Max capacity = <strong>${(1/Tp).toFixed(2)} frames/sec</strong>`;
    note = `T_p is the time to transmit ONE frame completely. It is the fundamental time unit for ALOHA analysis.`;

  } else if (type === 'effective_bw') {
    const framesPerSec = S / Tp;
    title = `Effective Throughput in ${fBW(bwBps)} — ${label} ALOHA`;
    steps = [
      { n:1, desc:'Calculate frame transmission time T_p',
        math:`T_p = ${fsBits} bits ÷ ${fBW(bwBps)} = <strong>${fT(Tp)}</strong>` },
      { n:2, desc:`Calculate throughput S using ${label} ALOHA formula`,
        math:`S = ${isPure?'G · e^(−2G)':'G · e^(−G)'} = ${G} · e<sup>${isPure?(-2*G).toFixed(4):(-G).toFixed(4)}</sup><br>
              S = <strong>${S.toFixed(6)} = ${pct(S)}</strong>` },
      { n:3, desc:'Calculate successful frames per second',
        math:`Frames/sec = S / T_p = ${S.toFixed(6)} / ${Tp.toFixed(8)}<br>
              = <strong>${framesPerSec.toFixed(2)} frames/sec</strong>` },
      { n:4, desc:'Calculate effective data rate',
        math:`Effective BW = S × Channel Bandwidth<br>
              = ${S.toFixed(6)} × ${fBW(bwBps)}<br>
              = <strong>${fBW(effBps)}</strong>` },
      { n:5, desc:'Alternative: frames/sec × frame size',
        math:`Effective BW = ${framesPerSec.toFixed(2)} frames/sec × ${fsBits} bits/frame<br>
              = <strong>${fBW(effBps)}</strong> ✓ (same answer)` },
    ];
    summary = `S = <strong>${pct(S)}</strong> &nbsp;|&nbsp; Eff. BW = <strong>${fBW(effBps)}</strong> &nbsp;|&nbsp; ${framesPerSec.toFixed(2)} frames/sec`;
    note = `Effective throughput = ${pct(S)} of ${fBW(bwBps)} channel capacity. The remaining ${pct(1-S)} is wasted on collisions and idle periods.`;

  } else if (type === 'max_throughput') {
    const Gopt  = isPure ? 0.5 : 1.0;
    const Smax  = isPure ? 0.5*Math.exp(-1) : Math.exp(-1);
    title = `Maximum Throughput & Optimal G — ${label} ALOHA`;
    steps = [
      { n:1, desc:'Write the throughput formula',
        math:`${label} ALOHA: S = ${isPure?'G · e^(−2G)':'G · e^(−G)'}` },
      { n:2, desc:'Differentiate S with respect to G and set to zero',
        math:isPure
          ? `dS/dG = e^(−2G) + G · (−2) · e^(−2G)<br>
             = e^(−2G) · (1 − 2G) = 0<br>
             Since e^(−2G) ≠ 0 → <strong>1 − 2G = 0</strong>`
          : `dS/dG = e^(−G) + G · (−1) · e^(−G)<br>
             = e^(−G) · (1 − G) = 0<br>
             Since e^(−G) ≠ 0 → <strong>1 − G = 0</strong>` },
      { n:3, desc:'Solve for optimal G*',
        math:isPure
          ? `2G = 1 → <strong>G* = 0.5</strong>`
          : `G = 1 → <strong>G* = 1.0</strong>` },
      { n:4, desc:'Substitute G* to find S_max',
        math:`S_max = ${isPure?'G* · e^(−2×G*)':'G* · e^(−G*)'}<br>
              = ${Gopt} × e<sup>${isPure?-1:-1}</sup><br>
              = ${Gopt} × ${Math.exp(-1).toFixed(6)}<br>
              = <strong>${Smax.toFixed(6)} = ${pct(Smax)}</strong>` },
      { n:5, desc:'Express in closed form',
        math:isPure
          ? `S_max = 1/(2e) ≈ <strong>0.1839 = 18.39%</strong>`
          : `S_max = 1/e ≈ <strong>0.3679 = 36.79%</strong>` },
    ];
    summary = `Optimal G* = <strong>${Gopt}</strong> &nbsp;|&nbsp; Maximum S = <strong>${pct(Smax)}</strong> = <strong>${isPure?'1/(2e)':'1/e'}</strong>`;
    note = `This is the theoretical peak. Beyond G*, adding more load decreases throughput due to increasing collisions.`;

  } else if (type === 'inverse_G') {
    // Numerically find G1 < Gopt and G2 > Gopt that give target S
    const Gopt = isPure ? 0.5 : 1.0;
    const Smax_check = isPure ? 0.5*Math.exp(-1) : Math.exp(-1);
    const fn = g => isPure ? g*Math.exp(-2*g) : g*Math.exp(-g);

    let G1 = null, G2 = null;
    if (Starget <= Smax_check) {
      // Binary search for G1 (0 < G < Gopt)
      let lo = 0.0001, hi = Gopt;
      for (let i=0; i<80; i++) { const mid=(lo+hi)/2; fn(mid)<Starget ? lo=mid : hi=mid; }
      G1 = (lo+hi)/2;
      // Binary search for G2 (Gopt < G < 10)
      lo = Gopt; hi = 10;
      for (let i=0; i<80; i++) { const mid=(lo+hi)/2; fn(mid)>Starget ? lo=mid : hi=mid; }
      G2 = (lo+hi)/2;
    }
    title = `Find G given S = ${Starget} — ${label} ALOHA (Inverse Problem)`;
    steps = [
      { n:1, desc:'Check if target S is achievable',
        math:`Target S = ${Starget} = ${pct(Starget)}<br>
              Max possible S (${label}) = ${pct(Smax_check)}<br>
              ${Starget <= Smax_check
                ? `<strong style="color:var(--green)">${Starget} ≤ ${Smax_check.toFixed(4)} → Two solutions exist ✓</strong>`
                : `<strong style="color:var(--red)">Target S > S_max → Impossible! No solution. ✗</strong>`}` },
      ...(G1 !== null ? [
        { n:2, desc:'Understand why two solutions exist',
          math:`S = ${isPure?'G·e^(−2G)':'G·e^(−G)'} is a unimodal curve peaking at G=${Gopt}<br>
                Any S < S_max is hit twice: once on the rising side, once on the falling side` },
        { n:3, desc:'Solution 1 — G₁ (stable, lightly loaded)',
          math:`G₁ ≈ <strong>${G1.toFixed(4)}</strong> (below peak G*=${Gopt})<br>
                Verify: ${fn(G1).toFixed(6)} ≈ ${Starget} ${Math.abs(fn(G1)-Starget)<0.001?'✓':'(≈)'}` },
        { n:4, desc:'Solution 2 — G₂ (unstable, overloaded)',
          math:`G₂ ≈ <strong>${G2.toFixed(4)}</strong> (above peak G*=${Gopt})<br>
                Verify: ${fn(G2).toFixed(6)} ≈ ${Starget} ${Math.abs(fn(G2)-Starget)<0.001?'✓':'(≈)'}` },
        { n:5, desc:'Which solution to use?',
          math:`G₁ = ${G1.toFixed(4)} → <strong style="color:var(--green)">Stable</strong> operating point. Preferred in practice.<br>
                G₂ = ${G2.toFixed(4)} → <strong style="color:var(--red)">Unstable</strong>. Collision cascade risk. Avoid.` },
      ] : [
        { n:2, desc:'No solution — target is above maximum', math:`S_target = ${pct(Starget)} > S_max = ${pct(Smax_check)}<br>Reduce target S or switch protocol.` }
      ]),
    ];
    summary = G1 !== null
      ? `G₁ (stable) ≈ <strong>${G1.toFixed(4)}</strong> &nbsp;|&nbsp; G₂ (unstable) ≈ <strong>${G2.toFixed(4)}</strong>`
      : `<span style="color:var(--red)">No solution — Target S exceeds S_max = ${pct(Smax_check)}</span>`;
    note = `G₁ and G₂ are found by numerical binary search. In exams, use the known table values or the S-G curve graph to locate them.`;

  } else if (type === 'compare_G') {
    const Sp = G*Math.exp(-2*G), Ss = G*Math.exp(-G);
    const Pep = Math.exp(-2*G), Pes = Math.exp(-G);
    const Pcp = Math.max(0,1-Pep-Sp), Pcs = Math.max(0,1-Pes-Ss);
    title = `Pure vs Slotted ALOHA Comparison at G = ${G}`;
    steps = [
      { n:1, desc:'Pure ALOHA Throughput',
        math:`S_pure = G · e^(−2G) = ${G} · e^(${(-2*G).toFixed(4)})<br>
              = ${G} × ${Math.exp(-2*G).toFixed(6)} = <strong>${Sp.toFixed(6)} = ${pct(Sp)}</strong>` },
      { n:2, desc:'Slotted ALOHA Throughput',
        math:`S_slotted = G · e^(−G) = ${G} · e^(${(-G).toFixed(4)})<br>
              = ${G} × ${Math.exp(-G).toFixed(6)} = <strong>${Ss.toFixed(6)} = ${pct(Ss)}</strong>` },
      { n:3, desc:'Pure ALOHA — All Probabilities',
        math:`P(empty) = e^(−2G) = <strong>${Pep.toFixed(6)} = ${pct(Pep)}</strong><br>
              P(success) = <strong>${Sp.toFixed(6)} = ${pct(Sp)}</strong><br>
              P(collision) = 1 − ${Pep.toFixed(4)} − ${Sp.toFixed(4)} = <strong>${Pcp.toFixed(6)} = ${pct(Pcp)}</strong>` },
      { n:4, desc:'Slotted ALOHA — All Probabilities',
        math:`P(empty) = e^(−G) = <strong>${Pes.toFixed(6)} = ${pct(Pes)}</strong><br>
              P(success) = <strong>${Ss.toFixed(6)} = ${pct(Ss)}</strong><br>
              P(collision) = 1 − ${Pes.toFixed(4)} − ${Ss.toFixed(4)} = <strong>${Pcs.toFixed(6)} = ${pct(Pcs)}</strong>` },
      { n:5, desc:'Ratio comparison',
        math:`S_slotted / S_pure = ${Ss.toFixed(6)} / ${Sp.toFixed(6)} = <strong>${Sp>0?(Ss/Sp).toFixed(4):'∞'}×</strong><br>
              (This ratio → 2× as G→0, showing Slotted is always better or equal)` },
    ];
    summary = `At G = ${G}: Pure S = <strong>${pct(Sp)}</strong> &nbsp;|&nbsp; Slotted S = <strong>${pct(Ss)}</strong> &nbsp;|&nbsp; Ratio = <strong>${Sp>0?(Ss/Sp).toFixed(3):'∞'}×</strong>`;
    note = `Slotted ALOHA is always at least as good as Pure ALOHA at any given G. The ratio S_slotted / S_pure approaches exactly 2 for small G.`;

  } else if (type === 'min_stations') {
    const Sthresh = Spct / 100;
    const Smax_c  = isPure ? 0.5*Math.exp(-1) : Math.exp(-1);
    const fnS     = g => isPure ? g*Math.exp(-2*g) : g*Math.exp(-g);

    let kMin = null, found = false;
    if (Sthresh <= Smax_c) {
      for (let ki = 1; ki <= 500; ki++) {
        const Gi = ki * p;
        if (fnS(Gi) >= Sthresh) { kMin = ki; found = true; break; }
      }
    }
    title = `Minimum Stations for S ≥ ${Spct}% — ${label} ALOHA, p = ${p}`;
    steps = [
      { n:1, desc:'Understand the relationship G = k × p',
        math:`G = k × p = k × ${p}<br>
              More stations k → higher offered load G` },
      { n:2, desc:'Check if target is achievable',
        math:`Target S = ${pct(Sthresh)}<br>
              Max possible (${label}) = ${pct(Smax_c)}<br>
              ${Sthresh <= Smax_c
                ? '<strong style="color:var(--green)">Achievable ✓</strong>'
                : '<strong style="color:var(--red)">Not achievable — target exceeds S_max ✗</strong>'}` },
      ...(found && kMin !== null ? [
        { n:3, desc:'Try increasing k until S ≥ target',
          math:(() => {
            let rows = '';
            for (let ki = Math.max(1, kMin-2); ki <= kMin; ki++) {
              const Gi = ki*p, Si = fnS(Gi);
              rows += `k=${ki}: G=${Gi.toFixed(4)}, S=${Si.toFixed(4)}=${pct(Si)} ${Si>=Sthresh?'<strong style="color:var(--green)">≥ '+pct(Sthresh)+' ✓</strong>':'<span style="color:var(--red)">< '+pct(Sthresh)+' ✗</span>'}<br>`;
            }
            return rows;
          })() },
        { n:4, desc:`Verify k = ${kMin}`,
          math:`G = ${kMin} × ${p} = ${(kMin*p).toFixed(4)}<br>
                S = ${fnS(kMin*p).toFixed(6)} = ${pct(fnS(kMin*p))} ≥ ${pct(Sthresh)} ✓` },
      ] : [
        { n:3, desc:'No solution found', math:'Target throughput exceeds S_max — no value of k can achieve this.' }
      ]),
    ];
    summary = found && kMin !== null
      ? `Minimum k = <strong>${kMin}</strong> stations (G = ${(kMin*p).toFixed(4)}, S = ${pct(fnS(kMin*p))})`
      : `<span style="color:var(--red)">Not achievable — reduce target S%</span>`;
    note = `Higher k is not always better — beyond the optimal G, more stations actually decrease throughput due to more collisions.`;

  } else if (type === 'frames_per_sec') {
    const framesPerSec = S / Tp;
    const maxFPS = 1 / Tp;
    title = `Successful Frames per Second — ${label} ALOHA`;
    steps = [
      { n:1, desc:'Frame transmission time T_p',
        math:`T_p = Frame Size / Bandwidth<br>
              = ${fsBits} bits ÷ ${fBW(bwBps)}<br>
              = <strong>${fT(Tp)}</strong>` },
      { n:2, desc:'Maximum possible frames/sec (channel capacity)',
        math:`Max frames/sec = 1 / T_p = 1 / ${fT(Tp)}<br>
              = <strong>${maxFPS.toFixed(2)} frames/sec</strong>` },
      { n:3, desc:`Throughput S — ${label} ALOHA`,
        math:`S = ${isPure?'G · e^(−2G)':'G · e^(−G)'} = ${G} · e<sup>${isPure?(-2*G).toFixed(4):(-G).toFixed(4)}</sup><br>
              = <strong>${S.toFixed(6)} = ${pct(S)}</strong>` },
      { n:4, desc:'Successful frames/sec = S × Max frames/sec',
        math:`= ${S.toFixed(6)} × ${maxFPS.toFixed(2)}<br>
              = <strong>${framesPerSec.toFixed(2)} frames/sec</strong>` },
      { n:5, desc:'Alternative: effective data rate',
        math:`= ${framesPerSec.toFixed(2)} frames/sec × ${fsBits} bits/frame<br>
              = <strong>${fBW(effBps)}</strong>` },
    ];
    summary = `Max capacity: <strong>${maxFPS.toFixed(2)} frames/sec</strong> &nbsp;|&nbsp; Successful: <strong>${framesPerSec.toFixed(2)} frames/sec</strong> = ${pct(S)} utilisation`;
    note = `Frames/sec × frame size = effective bandwidth. Both approaches give the same answer.`;

  } else if (type === 'full_analysis') {
    const Gkp = k * p;
    const pOpt = isPure ? 1/(2*k) : 1/k;
    const PsOpt = k * pOpt * Math.pow(1-pOpt, k-1);
    const framesPerSec = S / Tp;
    title = `Full Analysis — ${label} ALOHA | All Inputs`;
    steps = [
      { n:1, desc:'Unit conversion',
        math:`Bandwidth: ${bwRaw} ${bwUnit} = <strong>${fBW(bwBps)}</strong><br>
              Frame size: ${fsRaw} ${fsUnit} = <strong>${fFS(fsBits)}</strong>` },
      { n:2, desc:'Frame transmission time T_p',
        math:`T_p = ${fsBits} bits ÷ ${fBW(bwBps)} = <strong>${fT(Tp)}</strong>` },
      { n:3, desc:`Throughput S (${label} ALOHA formula)`,
        math:`S = ${isPure?'G·e^(−2G)':'G·e^(−G)'} = ${G} · e<sup>${isPure?(-2*G).toFixed(4):(-G).toFixed(4)}</sup> = <strong>${S.toFixed(6)} = ${pct(S)}</strong>` },
      { n:4, desc:'P(empty), P(success), P(collision)',
        math:`P(empty) = e<sup>${isPure?(-2*G).toFixed(4):(-G).toFixed(4)}</sup> = <strong>${Pempty.toFixed(6)} = ${pct(Pempty)}</strong><br>
              P(success) = S = <strong>${S.toFixed(6)} = ${pct(S)}</strong><br>
              P(collision) = 1 − ${Pempty.toFixed(4)} − ${S.toFixed(4)} = <strong>${Pcoll.toFixed(6)} = ${pct(Pcoll)}</strong><br>
              Sum = ${(Pempty+S+Pcoll).toFixed(4)} ✓` },
      { n:5, desc:'Binomial P(success) — exact for finite k',
        math:`P<sub>s</sub> = k·p·(1−p)<sup>k−1</sup> = ${k}×${p}×(${(1-p).toFixed(4)})<sup>${k-1}</sup> = <strong>${pSuccB.toFixed(6)} = ${pct(pSuccB)}</strong>` },
      { n:6, desc:'Offered load cross-check G vs k·p',
        math:`G (input) = ${G} &nbsp;&nbsp; k×p = ${k}×${p} = ${Gkp.toFixed(4)}<br>
              ${Math.abs(Gkp-G)>0.01
                ? `<span style="color:var(--amber)">⚠ Differ by ${Math.abs(Gkp-G).toFixed(4)} — inputs may be inconsistent</span>`
                : '<span style="color:var(--green)">✓ Consistent</span>'}` },
      { n:7, desc:'Optimal p per station',
        math:`p* = ${isPure?'1/(2k)':'1/k'} = ${isPure?`1/(2×${k})`:`1/${k}`} = <strong>${pOpt.toFixed(4)}</strong><br>
              Max P(success) at p* = <strong>${PsOpt.toFixed(6)} = ${pct(PsOpt)}</strong>` },
      { n:8, desc:'Effective throughput',
        math:`= S × BW = ${S.toFixed(6)} × ${fBW(bwBps)} = <strong>${fBW(effBps)}</strong><br>
              = ${framesPerSec.toFixed(2)} frames/sec × ${fsBits} bits = <strong>${fBW(effBps)}</strong> ✓` },
    ];
    summary = `S = <strong>${pct(S)}</strong> &nbsp;|&nbsp; P(coll) = <strong>${pct(Pcoll)}</strong> &nbsp;|&nbsp; Eff. BW = <strong>${fBW(effBps)}</strong> &nbsp;|&nbsp; T_p = <strong>${fT(Tp)}</strong>`;
    note = `Poisson model uses G; Binomial uses k and p directly. For large k, both converge. Cross-check: G ≈ k×p.`;
  }

  // Render output
  const out = document.getElementById('sol-out');
  out.style.display = 'block';
  out.innerHTML = `
    <div class="ss-output-title">
      <span class="ss-output-badge">${label.toUpperCase()} ALOHA</span>
      <span class="ss-output-badge" style="color:var(--cyan);background:rgba(103,232,249,0.08);border-color:rgba(103,232,249,0.25)">${title}</span>
    </div>
    ${steps.map(s => `
      <div class="ss-step">
        <div class="ss-step-head">
          <span class="ss-step-num">${s.n}</span>
          <span class="ss-step-desc">${s.desc}</span>
        </div>
        <div class="ss-step-math">${s.math}</div>
      </div>
    `).join('')}
    <div class="ss-summary"><strong style="color:var(--green)">✓ Answer</strong><br>${summary}</div>
    ${note ? `<div class="ss-note"><strong style="color:var(--amber)">Note:</strong> ${note}</div>` : ''}
  `;
  out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ─── OLD SOLVER (kept for master panel compatibility) ─── */
function calcSolver() {
  const proto  = document.getElementById('sol-proto').value;
  const G      = parseFloat(document.getElementById('sol-G').value) || 0.5;
  const k      = parseInt(document.getElementById('sol-k').value)   || 5;
  const p      = parseFloat(document.getElementById('sol-p').value) || 0.2;

  // ── bandwidth with unit conversion ──
  const bwRaw    = parseFloat(document.getElementById('sol-bw').value) || 200;
  const bwUnit   = document.getElementById('sol-bw-unit').value;
  const bwUnitMul = { bps:1, kbps:1e3, Mbps:1e6, Gbps:1e9 }[bwUnit];
  const bwBps    = bwRaw * bwUnitMul;           // always in bps
  const bwKbps   = bwBps / 1e3;                 // for display

  // ── frame size with unit conversion ──
  const fsRaw    = parseFloat(document.getElementById('sol-frame').value) || 1000;
  const fsUnit   = document.getElementById('sol-frame-unit').value;
  const fsUnitMul= { bits:1, bytes:8, KB:8192, MB:8388608 }[fsUnit];
  const fsBits   = fsRaw * fsUnitMul;           // always in bits

  const isPure  = proto === 'pure';
  const S       = isPure ? G*Math.exp(-2*G) : G*Math.exp(-G);
  const Pempty  = isPure ? Math.exp(-2*G)   : Math.exp(-G);
  const Pcoll   = Math.max(0, 1-Pempty-S);
  const pSuccB  = k*p*Math.pow(1-p, k-1);
  const Gkp     = k*p;
  const Tp      = fsBits / bwBps;              // seconds
  const effBps  = S * bwBps;
  const label   = isPure ? 'Pure' : 'Slotted';
  const expVal  = isPure ? Math.exp(-2*G) : Math.exp(-G);

  // ── unit-aware display helpers ──
  const fmtBW = bps => {
    if (bps >= 1e9) return `${(bps/1e9).toFixed(4)} Gbps`;
    if (bps >= 1e6) return `${(bps/1e6).toFixed(4)} Mbps`;
    if (bps >= 1e3) return `${(bps/1e3).toFixed(4)} kbps`;
    return `${bps.toFixed(4)} bps`;
  };
  const fmtFS = bits => {
    if (bits >= 8388608) return `${(bits/8388608).toFixed(4)} MB (${bits.toLocaleString()} bits)`;
    if (bits >= 8192) return `${(bits/8192).toFixed(4)} KB (${bits.toLocaleString()} bits)`;
    if (bits % 8 === 0) return `${bits} bits (${bits/8} bytes)`;
    return `${bits} bits`;
  };
  const fmtTime = s => {
    if (s < 1e-6) return `${(s*1e9).toFixed(4)} ns`;
    if (s < 1e-3) return `${(s*1e6).toFixed(4)} µs`;
    if (s < 1)    return `${(s*1e3).toFixed(4)} ms`;
    return `${s.toFixed(4)} s`;
  };

  const showSteps = document.getElementById('tog-steps') ? document.getElementById('tog-steps').checked : true;

  const steps = [
    {
      n:1, desc:`<strong>Unit Conversion</strong> — Normalise inputs`,
      math:`Bandwidth: ${bwRaw} ${bwUnit} → <strong>${fmtBW(bwBps)}</strong> = ${bwBps.toExponential(4)} bps<br>
            Frame size: ${fsRaw} ${fsUnit} → <strong>${fmtFS(fsBits)}</strong>`
    },
    {
      n:2, desc:`<strong>Throughput S</strong> — Apply ${label} ALOHA formula`,
      math:`Formula: S = ${isPure?'G · e^(−2G)':'G · e^(−G)'}<br>
            e^(${isPure?'−2×':'−'}${G}) = e^(${isPure?-2*G:-G}) = <strong>${expVal.toFixed(6)}</strong><br>
            S = ${G} × ${expVal.toFixed(6)} = <strong>${S.toFixed(6)} &nbsp;(${(S*100).toFixed(4)}%)</strong>`
    },
    {
      n:3, desc:`<strong>P(empty ${isPure?'period':'slot'})</strong> — No station transmits in vulnerable window`,
      math:`P(empty) = e^(${isPure?'−2G':'−G'}) = e^(${isPure?-2*G:-G})<br>
            = <strong>${Pempty.toFixed(6)} &nbsp;(${(Pempty*100).toFixed(4)}%)</strong><br>
            <span style="color:var(--dim);font-size:11px">Vulnerable period = ${isPure?'2×T_p (both directions)':'T_p (slot-aligned)'}</span>`
    },
    {
      n:4, desc:`<strong>P(collision)</strong> — Remainder after empty + success`,
      math:`P(coll) = 1 − P(empty) − P(success)<br>
            = 1 − ${Pempty.toFixed(6)} − ${S.toFixed(6)}<br>
            = <strong>${Pcoll.toFixed(6)} &nbsp;(${(Pcoll*100).toFixed(4)}%)</strong><br>
            Verify: ${Pempty.toFixed(4)} + ${S.toFixed(4)} + ${Pcoll.toFixed(4)} = ${(Pempty+S+Pcoll).toFixed(4)} ≈ 1 ✓`
    },
    {
      n:5, desc:`<strong>P(success) Binomial</strong> — Exactly 1 of ${k} stations transmits`,
      math:`Formula: P_s = k · p · (1−p)^(k−1)<br>
            (1−p)^(k−1) = (1−${p})^(${k}−1) = (${1-p})^${k-1} = <strong>${Math.pow(1-p,k-1).toFixed(6)}</strong><br>
            P_s = ${k} × ${p} × ${Math.pow(1-p,k-1).toFixed(6)} = <strong>${pSuccB.toFixed(6)} &nbsp;(${(pSuccB*100).toFixed(4)}%)</strong>`
    },
    {
      n:6, desc:`<strong>Offered load cross-check</strong> — G vs k·p consistency`,
      math:`G_input = ${G} &nbsp;&nbsp; G_kp = k × p = ${k} × ${p} = <strong>${Gkp.toFixed(4)}</strong><br>
            ${Math.abs(Gkp-G)>0.01?`<span style="color:var(--amber)">⚠ Differ by ${Math.abs(Gkp-G).toFixed(4)} — inputs may be inconsistent</span>`:'<span style="color:var(--green)">✓ Consistent</span>'}`
    },
    {
      n:7, desc:`<strong>Frame transmission time T_p</strong>`,
      math:`T_p = Frame Size / Bandwidth<br>
            = ${fsBits} bits ÷ ${bwBps.toExponential(4)} bps<br>
            = <strong>${fmtTime(Tp)}</strong> = ${Tp.toFixed(8)} s`
    },
    {
      n:8, desc:`<strong>Effective throughput</strong> — Actual data rate achieved`,
      math:`Eff = S × Bandwidth<br>
            = ${S.toFixed(6)} × ${fmtBW(bwBps)}<br>
            = <strong>${fmtBW(effBps)}</strong> &nbsp;(${(S*100).toFixed(3)}% of ${fmtBW(bwBps)} capacity)<br>
            Effective frames/sec = ${S.toFixed(6)} / ${fmtTime(Tp)} = <strong>${(S/Tp).toFixed(2)} frames/sec</strong>`
    }
  ];

  const out = document.getElementById('sol-out');
  out.style.display = 'block';
  out.innerHTML = `
    <span class="sol-out-title">Step-by-step — ${label} ALOHA | G=${G}, k=${k}, p=${p}, BW=${bwRaw} ${bwUnit}, Frame=${fsRaw} ${fsUnit}</span>
    ${showSteps ? steps.map(s=>`
      <div class="sr" style="flex-direction:column;align-items:flex-start;gap:4px;padding:10px 0">
        <div style="display:flex;gap:10px;align-items:center">
          <span style="width:22px;height:22px;border-radius:50%;background:var(--bg4);border:1px solid var(--border2);
            font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--blue);
            display:flex;align-items:center;justify-content:center">${s.n}</span>
          <span class="sk" style="color:var(--text)">${s.desc}</span>
        </div>
        <div style="margin-left:32px;font-family:var(--font-mono);font-size:12px;color:var(--cyan);
          line-height:1.8;background:var(--bg4);padding:8px 12px;border-radius:5px;
          border-left:2px solid var(--blue);width:100%">${s.math}</div>
      </div>
    `).join('') : '<div style="color:var(--dim);padding:10px 0;font-size:12px;font-family:var(--font-mono)">[Steps hidden — toggle in Master Control]</div>'}
    <div style="margin-top:12px;padding:12px;background:var(--bg4);border:1px solid var(--border2);border-radius:6px;font-family:var(--font-mono);font-size:12px;">
      <div><strong>Poisson Throughput (S)</strong> = ${S.toFixed(6)}</div>
      <div><strong>Binomial Success (Pₛ)</strong> = ${pSuccB.toFixed(6)}</div>
      <div><strong>Difference</strong> ≈ ${Math.abs(pSuccB-S).toFixed(6)}</div>
    </div>
    <div style="margin-top:10px;padding:10px;background:rgba(255,255,255,0.03);border-left:3px solid var(--amber);border-radius:6px;font-size:12px;color:var(--text2);">
      <strong style="color:var(--amber)">Note:</strong> S = G·e^(−G) uses Poisson assumption (infinite users / large k), while k·p·(1−p)^(k−1) is exact binomial for finite k stations.
    </div>
    <div style="margin-top:12px;padding:12px 16px;background:rgba(52,211,153,0.07);border:1px solid rgba(52,211,153,0.25);border-radius:6px;">
      <strong style="color:var(--green)">✓ Summary</strong><br>
      S = <strong>${(S*100).toFixed(4)}%</strong> &nbsp;|&nbsp;
      P(empty) = <strong>${(Pempty*100).toFixed(4)}%</strong> &nbsp;|&nbsp;
      P(coll) = <strong>${(Pcoll*100).toFixed(4)}%</strong> &nbsp;|&nbsp;
      Eff = <strong>${fmtBW(effBps)}</strong> &nbsp;|&nbsp;
      T_p = <strong>${fmtTime(Tp)}</strong>
    </div>
  `;
}

/* ─── MASTER CONTROL PANEL ─── */
let masterOpen = false;
function openMaster()  { masterOpen=true;  document.getElementById('masterPanel').classList.add('open'); }
function closeMaster() { masterOpen=false; document.getElementById('masterPanel').classList.remove('open'); }

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'M') { e.preventDefault(); masterOpen ? closeMaster() : openMaster(); }
});

/* ─── THEME ENGINE ─── */
const THEMES = {
  dark:     { bg:'#08090b', bg2:'#0f1014', bg3:'#16171d', bg4:'#1c1d26',
              border:'rgba(255,255,255,0.06)', border2:'rgba(255,255,255,0.12)',
              amber:'#f0b429', blue:'#3b9eff', green:'#34d399', red:'#f87171',
              cyan:'#67e8f9', purple:'#a78bfa', text:'#e2e4ec', text2:'#9ba3b8', dim:'#5a6278' },
  light:    { bg:'#f5f6fa', bg2:'#ffffff', bg3:'#eef0f6', bg4:'#e4e7f0',
              border:'rgba(0,0,0,0.08)', border2:'rgba(0,0,0,0.15)',
              amber:'#d97706', blue:'#2563eb', green:'#059669', red:'#dc2626',
              cyan:'#0891b2', purple:'#7c3aed', text:'#1a1c28', text2:'#4a5068', dim:'#8892a8' },
  cyber:    { bg:'#0d001a', bg2:'#130026', bg3:'#1a0033', bg4:'#220040',
              border:'rgba(200,0,255,0.12)', border2:'rgba(200,0,255,0.25)',
              amber:'#ff0090', blue:'#c800ff', green:'#00ffcc', red:'#ff2060',
              cyan:'#ff00ff', purple:'#ff80ff', text:'#f0d0ff', text2:'#c090ee', dim:'#7040a0' },
  ocean:    { bg:'#030d18', bg2:'#061624', bg3:'#091f30', bg4:'#0d283d',
              border:'rgba(0,180,220,0.1)', border2:'rgba(0,180,220,0.2)',
              amber:'#fbbf24', blue:'#06b6d4', green:'#10b981', red:'#f87171',
              cyan:'#67e8f9', purple:'#818cf8', text:'#cce9ff', text2:'#7fb3d0', dim:'#3a6070' },
  terminal: { bg:'#000800', bg2:'#001200', bg3:'#001a00', bg4:'#002200',
              border:'rgba(0,255,0,0.08)', border2:'rgba(0,255,0,0.18)',
              amber:'#00ff88', blue:'#00ff00', green:'#88ff00', red:'#ff4400',
              cyan:'#00ffaa', purple:'#00ff66', text:'#00ff00', text2:'#00cc00', dim:'#006600' },
};

let currentThemeName = 'dark';
function setTheme(name, btn) {
  currentThemeName = name;
  const t = THEMES[name];
  if (!t) return;
  const root = document.documentElement;
  Object.entries(t).forEach(([k,v]) => root.style.setProperty('--'+k, v));
  // nav bg
  if (name==='light') {
    document.querySelector('nav').style.background='rgba(245,246,250,0.92)';
  } else {
    document.querySelector('nav').style.background='rgba(8,9,11,0.0)';
  }
  document.documentElement.dataset.theme = (name==='light')?'light':'dark';
  document.getElementById('themeBtn').textContent = name==='light'?'☾ Dark':'☀ Light';
  document.querySelectorAll('.mp-theme-btn').forEach(b=>b.classList.remove('on'));
  if(btn) btn.classList.add('on');
  drawChart();
  if (simData) { drawSimCanvas(simData); drawTimelineCanvas(simData); drawAnimFrame(animCurrentSlot); }
}

/* override toggleTheme to sync with master panel */
function toggleTheme() {
  const next = currentThemeName === 'light' ? 'dark' : 'light';
  const btn  = document.querySelector(`.mp-theme-btn[data-theme-val="${next}"]`);
  setTheme(next, btn);
}

/* ─── SECTION VISIBILITY ─── */
function toggleSection(id, cb) {
  const sec = document.getElementById(id);
  if (!sec) return;
  sec.style.display = cb.checked ? '' : 'none';
}

/* ─── FEATURE FLAGS ─── */
function toggleFeature(feat, cb) {
  if (feat==='anim')    { const el=document.querySelector('.anim-wrapper'); if(el) el.style.display=cb.checked?'':'none'; }
  if (feat==='simlog')  { const el=document.getElementById('sim-log');      if(el) el.style.display=cb.checked?'':'none'; }
  if (feat==='tptable') { const el=document.getElementById('throughput-table'); if(el) el.closest('.tbl-wrap').style.display=cb.checked?'':'none'; }
  if (feat==='peaks')   { window._showPeaks = cb.checked; drawChart(); }
  // steps handled inside calcSolver via tog-steps checkbox
}

/* peak marker toggle support */
window._showPeaks = true;

/* ─── DEFAULT UNIT ─── */
function setDefaultUnit(radio) {
  const sel = document.getElementById('sol-bw-unit');
  if (sel) sel.value = radio.value;
}

/* ─── RESET ALL ─── */
function resetAll() {
  document.getElementById('s-sta').value = 4;
  document.getElementById('s-g').value   = 5;
  document.getElementById('s-sl').value  = 24;
  updVals(); runSim();
}

/* ─── SCROLL FADE ─── */
function initScrollFade() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  updVals();
  drawChart();
  buildThroughputTable();
  initScrollFade();
  runSim();
  window.addEventListener('resize', () => {
    drawChart();
    if (simData) { drawSimCanvas(simData); drawTimelineCanvas(simData); }
  });
});
