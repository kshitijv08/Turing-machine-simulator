/* ================================================================
   tm.js  —  Turing Machine simulation logic
   Mirrors the C code structure:
     - Transition struct  → plain JS objects  { cs, read, ns, write, move }
     - initTape()         → fills tape array with blank
     - runMachine()       → the main while-loop (called step by step)
     - loadPreset()       → hardcoded transition tables (like switch-case in C)
     - applyManual()      → reads the manual editor rows
   ================================================================ */

/* ── constants (same as C #defines) ───────────────────────────────── */
const TAPE_LEN   = 120;
const TAPE_START = 50;   // where input is placed on the tape
const STEP_LIMIT = 1000;

/* ── machine state ─────────────────────────────────────────────────── */
let tape        = [];
let head        = 0;
let state       = 0;
let step        = 0;
let transitions = [];
let blank       = '_';
let startSt     = 0;
let acceptSt    = 0;
let rejectSt    = 0;
let writtenCells = new Set();

/* ── animation / control state ─────────────────────────────────────── */
let running       = false;
let paused        = false;
let timer         = null;
let speed         = 600;
let lastFiringRow = -1;
let tapeBuilt     = false;

/* ================================================================
   PRESET DEFINITIONS
   Same 5 presets as the C switch-case, same transition tables.
   ================================================================ */
const PRESETS = [

  /* 0 — aⁿbⁿcⁿ */
  {
    name: "aⁿbⁿcⁿ Acceptor",
    blank: '_', start: 0, accept: 5, reject: 6,
    example: "aabbcc",
    transitions: [
      {cs:0, read:'a', ns:1, write:'X', move:'R'},
      {cs:1, read:'a', ns:1, write:'a', move:'R'},
      {cs:1, read:'Y', ns:1, write:'Y', move:'R'},
      {cs:1, read:'b', ns:2, write:'Y', move:'R'},
      {cs:2, read:'b', ns:2, write:'b', move:'R'},
      {cs:2, read:'Z', ns:2, write:'Z', move:'R'},
      {cs:2, read:'c', ns:3, write:'Z', move:'L'},
      {cs:3, read:'b', ns:3, write:'b', move:'L'},
      {cs:3, read:'Z', ns:3, write:'Z', move:'L'},
      {cs:3, read:'Y', ns:3, write:'Y', move:'L'},
      {cs:3, read:'a', ns:3, write:'a', move:'L'},
      {cs:3, read:'X', ns:0, write:'X', move:'R'},
      {cs:0, read:'Y', ns:4, write:'Y', move:'R'},
      {cs:4, read:'Y', ns:4, write:'Y', move:'R'},
      {cs:4, read:'Z', ns:4, write:'Z', move:'R'},
      {cs:4, read:'_', ns:5, write:'_', move:'R'},
    ]
  },

  /* 1 — Palindrome {a,b} */
  {
    name: "Palindrome {a,b}",
    blank: '_', start: 0, accept: 6, reject: 7,
    example: "abba",
    transitions: [
      {cs:0, read:'a', ns:1, write:'_', move:'R'},
      {cs:0, read:'b', ns:2, write:'_', move:'R'},
      {cs:0, read:'_', ns:6, write:'_', move:'R'},
      {cs:1, read:'a', ns:1, write:'a', move:'R'},
      {cs:1, read:'b', ns:1, write:'b', move:'R'},
      {cs:1, read:'_', ns:3, write:'_', move:'L'},
      {cs:2, read:'a', ns:2, write:'a', move:'R'},
      {cs:2, read:'b', ns:2, write:'b', move:'R'},
      {cs:2, read:'_', ns:4, write:'_', move:'L'},
      {cs:3, read:'a', ns:5, write:'_', move:'L'},
      {cs:3, read:'_', ns:6, write:'_', move:'R'},
      {cs:4, read:'b', ns:5, write:'_', move:'L'},
      {cs:4, read:'_', ns:6, write:'_', move:'R'},
      {cs:5, read:'a', ns:5, write:'a', move:'L'},
      {cs:5, read:'b', ns:5, write:'b', move:'L'},
      {cs:5, read:'_', ns:0, write:'_', move:'R'},
    ]
  },

  /* 2 — Unary Adder */
  {
    name: "Unary Adder",
    blank: '_', start: 0, accept: 2, reject: 3,
    example: "111+11",
    transitions: [
      {cs:0, read:'1', ns:0, write:'1', move:'R'},
      {cs:0, read:'+', ns:0, write:'1', move:'R'},
      {cs:0, read:'_', ns:1, write:'_', move:'L'},
      {cs:1, read:'1', ns:2, write:'_', move:'L'},
    ]
  },

  /* 3 — Binary Flip */
  {
    name: "Binary Flip",
    blank: '_', start: 0, accept: 1, reject: 2,
    example: "101010",
    transitions: [
      {cs:0, read:'0', ns:0, write:'1', move:'R'},
      {cs:0, read:'1', ns:0, write:'0', move:'R'},
      {cs:0, read:'_', ns:1, write:'_', move:'R'},
    ]
  }
];

/* ================================================================
   PRESET LOADER  —  mirrors C loadPreset(choice)
   ================================================================ */
function loadPreset(idx) {
  document.querySelectorAll('.preset-btn')
          .forEach((b, i) => b.classList.toggle('active', i === idx));

  const p     = PRESETS[idx];
  blank       = p.blank;
  transitions = p.transitions;
  startSt     = p.start;
  acceptSt    = p.accept;
  rejectSt    = p.reject;

  document.getElementById('blankSym').value = blank;
  document.getElementById('inputStr').value  = p.example;

  updateChips();
  renderTransTable();
  resetSim();
}

/* ================================================================
   MANUAL TM  —  mirrors C manualMode()
   ================================================================ */
let manualOpen = false;

function toggleManual() {
  manualOpen = !manualOpen;
  document.getElementById('manualSection').style.display = manualOpen ? 'block' : 'none';
  document.getElementById('manualToggle').textContent    = manualOpen ? '− collapse' : '+ expand';
  if (manualOpen && document.getElementById('transEditor').children.length === 0)
    addTransRow();
}

function addTransRow() {
  const editor = document.getElementById('transEditor');
  const row    = document.createElement('div');
  row.className = 't-row';
  row.innerHTML = `
    <input type="number" placeholder="cs" min="0" value="0"/>
    <input type="text"   placeholder="r"  maxlength="1" value=""/>
    <input type="number" placeholder="ns" min="0" value="0"/>
    <input type="text"   placeholder="w"  maxlength="1" value=""/>
    <select><option value="R">R</option><option value="L">L</option></select>
    <button class="del-btn" onclick="this.parentElement.remove()">×</button>
  `;
  editor.appendChild(row);
}

function applyManual() {
  const rows = document.querySelectorAll('#transEditor .t-row');
  if (rows.length === 0) { alert('Add at least one transition row.'); return; }

  const parsed = [];
  for (const row of rows) {
    const inputs = row.querySelectorAll('input, select');
    const cs    = parseInt(inputs[0].value);
    const read  = inputs[1].value.trim();
    const ns    = parseInt(inputs[2].value);
    const write = inputs[3].value.trim();
    const move  = inputs[4].value;

    if (isNaN(cs) || isNaN(ns) || read === '' || write === '') {
      alert('Fill in all fields in every transition row.'); return;
    }
    parsed.push({ cs, read, ns, write, move });
  }

  blank       = document.getElementById('blankSym').value || '_';
  startSt     = parseInt(document.getElementById('mStart').value)  || 0;
  acceptSt    = parseInt(document.getElementById('mAccept').value) || 0;
  rejectSt    = parseInt(document.getElementById('mReject').value) || 0;
  transitions = parsed;

  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

  updateChips();
  renderTransTable();
  resetSim();
  log(`Manual TM loaded — ${transitions.length} transitions`, 'info');
}

/* ================================================================
   TAPE — mirrors initTape() and printTape() in C
   ================================================================ */
function initTape() {
  const input = document.getElementById('inputStr').value;
  blank       = document.getElementById('blankSym').value || '_';

  tape = new Array(TAPE_LEN).fill(blank);
  for (let i = 0; i < input.length && (TAPE_START + i) < TAPE_LEN; i++)
    tape[TAPE_START + i] = input[i];

  head  = TAPE_START;
  state = startSt;
  step  = 0;
  writtenCells = new Set();

  renderTape();
  document.getElementById('stateLabel').textContent = `q${state}`;
  document.getElementById('stepNum').textContent    = '0';
  clearResult();
  clearLog();
  log(`Input: "${input}" | blank='${blank}' | accept=q${acceptSt} reject=q${rejectSt}`, 'info');
}

/* ── build tape DOM (once) ─────────────────────────────────────────── */
function buildTapeDOM() {
  const track  = document.getElementById('tapeTrack');
  const htrack = document.getElementById('headTrack');
  track.innerHTML  = '';
  htrack.innerHTML = '';
  for (let i = 0; i < TAPE_LEN; i++) {
    const c = document.createElement('div'); c.className = 'tape-cell'; c.id = `tc${i}`; track.appendChild(c);
    const h = document.createElement('div'); h.className = 'head-cell'; h.id = `th${i}`; htrack.appendChild(h);
  }
  tapeBuilt = true;
}

/* ── update tape visuals ───────────────────────────────────────────── */
function renderTape() {
  if (!tapeBuilt) buildTapeDOM();

  for (let i = 0; i < TAPE_LEN; i++) {
    const c   = document.getElementById(`tc${i}`);
    const isB = tape[i] === blank;
    c.textContent = tape[i] || blank;
    c.className   = 'tape-cell'
                  + (i === head           ? ' active'    : '')
                  + (writtenCells.has(i) && !isB ? ' written' : '')
                  + (isB                 ? ' blank-sym' : '');

    const h = document.getElementById(`th${i}`);
    h.textContent = i === head ? '▲' : '';
    h.className   = 'head-cell' + (i === head ? ' active' : '');
  }

  /* slide tape so head stays centred */
  const cellW  = 46;
  const wrapW  = document.getElementById('tapeWrap').offsetWidth || 700;
  const offset = wrapW / 2 - cellW / 2 - head * cellW;
  document.getElementById('tapeTrack').style.transform = `translateX(${offset}px)`;
  document.getElementById('headTrack').style.transform = `translateX(${offset}px)`;
}

/* ================================================================
   SINGLE STEP  —  mirrors the body of the while-loop in runMachine()
   Returns true if machine should keep running, false if halted.
   ================================================================ */
function doStep() {
  if (state === acceptSt) { halt(true);  return false; }
  if (state === rejectSt) { halt(false); return false; }

  const sym   = tape[head];
  let   found = -1;

  for (let i = 0; i < transitions.length; i++) {
    if (transitions[i].cs === state && transitions[i].read === sym) {
      found = i; break;
    }
  }

  if (found < 0) {
    log(`No transition for (q${state}, '${sym}') — REJECTED`, 'reject');
    showResult(false); stopSim(); return false;
  }

  const t = transitions[found];
  highlightRow(found);
  log(`Step ${step}: q${state} + '${sym}' → write '${t.write}', ${t.move} → q${t.ns}`);

  tape[head] = t.write;
  writtenCells.add(head);
  state      = t.ns;
  head      += (t.move === 'R') ? 1 : -1;
  if (head < 0)          head = 0;
  if (head >= TAPE_LEN)  head = TAPE_LEN - 1;
  step++;

  renderTape();
  document.getElementById('stateLabel').textContent = `q${state}`;
  document.getElementById('stepNum').textContent    = step;

  if (state === acceptSt) { setTimeout(() => halt(true),  120); return false; }
  if (state === rejectSt) { setTimeout(() => halt(false), 120); return false; }
  if (step >= STEP_LIMIT) {
    log('Step limit reached — possible infinite loop', 'reject');
    stopSim(); return false;
  }
  return true;
}

function halt(accepted) {
  log(`q${state} = ${accepted ? 'accept' : 'reject'} state — ${accepted ? 'ACCEPTED' : 'REJECTED'}`,
      accepted ? 'accept' : 'reject');
  showResult(accepted);
  stopSim();
}

/* ================================================================
   CONTROLS
   ================================================================ */
function stepOnce()  { if (step === 0) initTape(); doStep(); }

function runAuto() {
  if (step === 0) initTape();
  running = true; paused = false;
  document.getElementById('btnRun').disabled   = true;
  document.getElementById('btnPause').disabled = false;
  tick();
}

function tick() {
  if (!running || paused) return;
  const ok = doStep();
  if (ok) timer = setTimeout(tick, 1000 - speed);
}

function pauseSim() {
  paused = !paused;
  document.getElementById('btnPause').textContent = paused ? 'Resume' : 'Pause';
  if (!paused) tick();
}

function stopSim() {
  running = false; paused = false;
  clearTimeout(timer);
  document.getElementById('btnRun').disabled   = false;
  document.getElementById('btnPause').disabled = true;
  document.getElementById('btnPause').textContent = 'Pause';
}

function resetSim() {
  stopSim();
  highlightRow(-1);
  initTape();
}

function updateSpeed(v) {
  speed = parseInt(v);
  const map = { 50:'crawl', 200:'slow', 400:'normal', 600:'fast', 800:'turbo', 950:'max' };
  const k   = Object.keys(map).reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
  document.getElementById('speedLabel').textContent = map[k] || 'fast';
}

/* ================================================================
   UI HELPERS
   ================================================================ */
function renderTransTable() {
  document.getElementById('transTbody').innerHTML =
    transitions.map((t, i) => `
      <tr id="tr${i}">
        <td>${i+1}</td><td>q${t.cs}</td><td>${t.read}</td>
        <td>q${t.ns}</td><td>${t.write}</td><td>${t.move}</td>
      </tr>`).join('');
}

function highlightRow(idx) {
  if (lastFiringRow >= 0) {
    const prev = document.getElementById(`tr${lastFiringRow}`);
    if (prev) prev.classList.remove('firing');
  }
  if (idx >= 0) {
    const row = document.getElementById(`tr${idx}`);
    if (row) { row.classList.add('firing'); row.scrollIntoView({ block: 'nearest' }); }
  }
  lastFiringRow = idx;
}

function updateChips() {
  document.getElementById('chipStart').textContent  = `start: q${startSt}`;
  document.getElementById('chipAccept').textContent = `accept: q${acceptSt}`;
  document.getElementById('chipReject').textContent = `reject: q${rejectSt}`;
}

function log(msg, type = 'step') {
  const p = document.getElementById('logPanel');
  const d = document.createElement('div');
  d.className   = `log-entry ${type}`;
  d.textContent = msg;
  p.appendChild(d);
  p.scrollTop = p.scrollHeight;
}
function clearLog()    { document.getElementById('logPanel').innerHTML = ''; }
function clearResult() {
  const b = document.getElementById('resultBanner');
  b.className   = 'result-banner';
  b.textContent = '';
}
function showResult(ok) {
  const inp = document.getElementById('inputStr').value;
  const b   = document.getElementById('resultBanner');
  b.className   = 'result-banner ' + (ok ? 'accept' : 'reject');
  b.textContent = ok
    ? `✓ ACCEPTED — "${inp}" is in the language`
    : `✗ REJECTED — "${inp}" is not in the language`;
}

/* ── boot ──────────────────────────────────────────────────────────── */
loadPreset(0);
