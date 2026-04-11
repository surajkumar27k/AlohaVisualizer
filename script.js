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