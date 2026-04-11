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
  peaks.forEach(pt => {
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
  const proto = document.getElementById('sol-proto').value;
  const G     = parseFloat(document.getElementById('sol-G').value) || 0.5;
  const k     = parseInt(document.getElementById('sol-k').value)   || 5;
  const p     = parseFloat(document.getElementById('sol-p').value) || 0.2;
  const bw    = parseFloat(document.getElementById('sol-bw').value)    || 200;
  const fsize = parseFloat(document.getElementById('sol-frame').value) || 1000;

  const isPure  = proto === 'pure';
  const S       = isPure ? G*Math.exp(-2*G) : G*Math.exp(-G);
  const Pempty  = isPure ? Math.exp(-2*G)   : Math.exp(-G);
  const Pcoll   = Math.max(0, 1-Pempty-S);
  const pSuccB  = k*p*Math.pow(1-p, k-1);
  const Gkp     = k*p;
  const Tp      = fsize/(bw*1000);
  const effKbps = S*bw;
  const diff    = Math.abs(pSuccB-S);
  const label   = isPure ? 'Pure' : 'Slotted';
  const expVal  = isPure ? Math.exp(-2*G) : Math.exp(-G);

  const steps = [
    {
      n:1, desc:`<strong>Throughput S</strong> — Apply ${label} ALOHA formula`,
      math:`S = ${isPure?'G·e^(−2G)':'G·e^(−G)'} = ${G} × ${expVal.toFixed(5)}<br>
            <strong>= ${S.toFixed(5)} &nbsp;(${(S*100).toFixed(3)}%)</strong>`
    },
    {
      n:2, desc:`<strong>P(empty ${isPure?'period':'slot'})</strong> — No station transmits`,
      math:`P(empty) = e^(${isPure?'−2G':'−G'}) = ${Pempty.toFixed(5)}<br>
            <strong>(${(Pempty*100).toFixed(3)}%)</strong>`
    },
    {
      n:3, desc:`<strong>P(collision)</strong> — At least two transmit simultaneously`,
      math:`P(coll) = 1 − ${Pempty.toFixed(5)} − ${S.toFixed(5)}<br>
            <strong>= ${Pcoll.toFixed(5)} &nbsp;(${(Pcoll*100).toFixed(3)}%)</strong>`
    },
    {
      n:4, desc:`<strong>P(success) Binomial</strong> — Exactly 1 of ${k} stations transmits`,
      math:`P_s = k·p·(1−p)^(k−1) = ${k}×${p}×${Math.pow(1-p,k-1).toFixed(6)}<br>
            <strong>= ${pSuccB.toFixed(5)} &nbsp;(${(pSuccB*100).toFixed(3)}%)</strong>`
    },
    {
      n:5, desc:`<strong>Offered load from k·p</strong>`,
      math:`G_kp = ${k}×${p} = <strong>${Gkp.toFixed(4)}</strong>
            ${Math.abs(Gkp-G)>0.01?`<span style="color:var(--amber)"> ⚠ differs from input G=${G}</span>`:'✓ consistent'}`
    },
    {
      n:6, desc:`<strong>Frame time T<sub>p</sub></strong>`,
      math:`T_p = ${fsize} / ${bw*1000} = <strong>${(Tp*1000).toFixed(4)} ms</strong>`
    },
    {
      n:7, desc:`<strong>Effective throughput</strong>`,
      math:`Eff = ${S.toFixed(5)} × ${bw} kbps = <strong>${effKbps.toFixed(4)} kbps</strong> (${(S*100).toFixed(2)}% of capacity)`
    }
  ];

  const out = document.getElementById('sol-out');
  out.style.display = 'block';
  out.innerHTML = `
    <span class="sol-out-title">Step-by-step — ${label} ALOHA | G=${G}, k=${k}, p=${p}</span>
    ${steps.map(s=>`
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
    `).join('')}
    <div style="margin-top:12px;padding:12px;background:var(--bg4);border:1px solid var(--border2);border-radius:6px;font-family:var(--font-mono);font-size:12px;">
      <div><strong>Poisson Throughput (S)</strong> = ${S.toFixed(5)}</div>
      <div><strong>Binomial Success (Pₛ)</strong> = ${pSuccB.toFixed(5)}</div>
      <div><strong>Difference</strong> ≈ ${diff.toFixed(5)}</div>
    </div>
    <div style="margin-top:10px;padding:10px;background:rgba(255,255,255,0.03);border-left:3px solid var(--amber);border-radius:6px;font-size:12px;color:var(--text2);">
      <strong style="color:var(--amber)">Note:</strong> S = G·e^(−G) uses Poisson (infinite users), while k·p·(1−p)^(k−1) uses finite stations.
    </div>
    <div style="margin-top:12px;padding:12px 16px;background:rgba(52,211,153,0.07);border:1px solid rgba(52,211,153,0.25);border-radius:6px;">
      <strong style="color:var(--green)">✓ Summary</strong><br>
      S = <strong>${(S*100).toFixed(3)}%</strong> &nbsp;|&nbsp;
      P(empty) = <strong>${(Pempty*100).toFixed(3)}%</strong> &nbsp;|&nbsp;
      P(coll) = <strong>${(Pcoll*100).toFixed(3)}%</strong> &nbsp;|&nbsp;
      Eff = <strong>${effKbps.toFixed(3)} kbps</strong>
    </div>
  `;
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