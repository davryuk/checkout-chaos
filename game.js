// Check-Out Chaos — MVP (pure canvas, no build step)
(() => {
'use strict';
const Q = new URLSearchParams(location.search);
const DBG = { speed: +Q.get('speed') || 1, t: +Q.get('t') || 0, god: Q.get('god') === '1', dmg: +Q.get('dmg') || 1 };
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let D = null, W = 640, H = 360, SC = 2;

// ---------------- data load (fetch JSON, fallback to embedded JS) -------------
async function loadData() {
  if (location.protocol === 'file:' && window.GAME_DATA_FALLBACK) return window.GAME_DATA_FALLBACK;
  try { const r = await fetch('data.json', { cache: 'no-store' }); if (!r.ok) throw 0; return await r.json(); }
  catch (e) { return window.GAME_DATA_FALLBACK; }
}

// ---------------- resize -------------
function resize() {
  const w = innerWidth, h = innerHeight;
  SC = Math.max(1, Math.floor(Math.min(w / 400, h / 300)));
  if (Math.min(w, h) < 500) SC = Math.max(1, Math.floor(Math.min(w, h) / 260));
  W = Math.ceil(w / SC); H = Math.ceil(h / SC);
  cv.width = W * SC; cv.height = H * SC; cv.style.width = w + 'px'; cv.style.height = h + 'px';
}
addEventListener('resize', resize);

// ---------------- sprites (code-generated 32x32 pixel art) -------------
const SPR = {};
function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn((x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }, g); return c; }
function human(p, o) {
  const skin = o.skin || '#f1c49b';
  p(10, 29, 12, 2, 'rgba(0,0,0,.35)');                     // shadow
  p(11, 4, 10, 4, o.hair); if (o.bigHair) { p(8, 2, 16, 6, o.hair); p(8, 8, 3, 6, o.hair); p(21, 8, 3, 6, o.hair); }
  p(11, 7, 10, 7, skin); p(13, 9, 2, 2, '#1a1a1a'); p(17, 9, 2, 2, '#1a1a1a');
  if (o.angry) { p(12, 8, 3, 1, '#1a1a1a'); p(17, 8, 3, 1, '#1a1a1a'); p(14, 12, 4, 1, '#7a1010'); }
  const bw = o.wide ? 16 : 12, bx = 16 - bw / 2;
  p(bx, 14, bw, 10, o.uniform); p(bx - 2, 15, 2, 7, o.uniform); p(bx + bw, 15, 2, 7, o.uniform);
  p(bx - 2, 22, 2, 2, skin); p(bx + bw, 22, 2, 2, skin);
  if (o.accent) { p(15, 14, 2, 8, o.accent); }
  if (o.apron) { p(bx + 2, 17, bw - 4, 7, o.apron); }
  if (o.pattern) { p(bx + 1, 15, 2, 2, o.pattern); p(bx + bw - 4, 18, 2, 2, o.pattern); p(bx + 4, 21, 2, 2, o.pattern); }
  if (o.sash) { for (let i = 0; i < 8; i++) p(bx + i * (bw / 8), 14 + i, 2, 2, o.sash); }
  p(12, 24, 3, 5, o.pants || '#2a2a3a'); p(17, 24, 3, 5, o.pants || '#2a2a3a');
  p(11, 28, 4, 2, '#111'); p(17, 28, 4, 2, '#111');
  if (o.hat) { p(10, 1, 12, 3, o.hat); if (o.chef) { p(11, -1, 10, 4, '#fff'); p(10, 0, 12, 4, '#fff'); } }
  if (o.tiara) { p(13, 2, 6, 2, '#ffe14d'); p(15, 0, 2, 2, '#ffe14d'); }
  if (o.suitcase) { p(23, 18, 8, 9, '#7a4a1e'); p(25, 16, 4, 2, '#3a2310'); p(23, 21, 8, 1, '#c99a4a'); }
  if (o.glow) { p(0, 0, 32, 1, o.glow); p(0, 31, 32, 1, o.glow); p(0, 0, 1, 32, o.glow); p(31, 0, 1, 32, o.glow); }
}
function buildSprites() {
  for (const c of D.characters) {
    const o = { hair: c.colors.hair, uniform: c.colors.uniform, accent: c.colors.accent };
    if (c.id === 'house') { o.accent = null; o.apron = '#ffffff'; }
    if (c.id === 'botones') { o.hat = '#c4262e'; }
    if (c.id === 'cocinero') { o.hat = '#fff'; o.chef = true; o.accent = null; o.apron = '#dddddd'; o.pants = '#333'; }
    if (c.id === 'recep') { o.pants = '#1b2a55'; }
    SPR['pl_' + c.id] = mk(32, 32, p => human(p, o));
  }
  SPR.e_apurado = mk(32, 32, p => human(p, { hair: '#222', uniform: '#e2483d', pants: '#344', angry: true }));
  SPR.e_valija = mk(32, 32, p => human(p, { hair: '#999', uniform: '#f2d03b', pattern: '#e25bb0', wide: true, suitcase: true, pants: '#d9c39a' }));
  SPR.e_karen = mk(32, 32, p => human(p, { hair: '#f3df6a', bigHair: true, uniform: '#8a3fd1', wide: true, angry: true, glow: '#ff3df5', pants: '#3a1f55' }));
  SPR.e_despedida = mk(32, 32, p => human(p, { hair: '#5a2d0c', uniform: '#ff7bc2', sash: '#ffffff', tiara: true, pants: '#552244' }));
  SPR.e_queja = mk(32, 32, p => { p(4, 6, 24, 16, '#111'); p(5, 7, 22, 14, '#fafafa'); p(8, 21, 6, 6, '#111'); p(9, 21, 4, 4, '#fafafa');
    p(15, 9, 3, 7, '#d92020'); p(15, 17, 3, 2, '#d92020'); p(10, 10, 2, 2, '#d92020'); p(21, 10, 2, 2, '#d92020'); });
  SPR.e_inspeccion = mk(64, 64, p => { p(16, 58, 32, 4, 'rgba(0,0,0,.4)'); p(22, 6, 20, 8, '#1d1d1d'); p(22, 12, 20, 14, '#e9bf93');
    p(26, 16, 4, 3, '#000'); p(34, 16, 4, 3, '#000'); p(24, 15, 16, 1, '#555'); p(28, 22, 8, 2, '#700');
    p(16, 26, 32, 22, '#22252e'); p(30, 26, 4, 16, '#b0001a'); p(10, 28, 6, 16, '#22252e'); p(48, 28, 6, 16, '#22252e');
    p(44, 30, 16, 20, '#8a5a2b'); p(46, 33, 12, 15, '#fff'); for (let i = 0; i < 4; i++) { p(47, 35 + i * 3, 2, 2, '#1a9c3a'); p(50, 35 + i * 3, 7, 1, '#333'); }
    p(20, 48, 9, 10, '#111'); p(35, 48, 9, 10, '#111'); p(0, 0, 64, 2, '#ff2a2a'); p(0, 62, 64, 2, '#ff2a2a'); });
  SPR.tip = mk(12, 8, p => { p(0, 0, 12, 8, '#0f5a26'); p(1, 1, 10, 6, '#3fbf5a'); p(5, 2, 2, 4, '#0f5a26'); });
  SPR.tipBig = mk(12, 8, p => { p(0, 0, 12, 8, '#5a3c0f'); p(1, 1, 10, 6, '#ffb83f'); p(5, 2, 2, 4, '#5a3c0f'); });
  SPR.key = mk(14, 8, p => { p(0, 1, 6, 6, '#a07800'); p(1, 2, 4, 4, '#ffd23f'); p(2, 3, 2, 2, '#a07800'); p(6, 3, 8, 2, '#ffd23f'); p(11, 5, 2, 2, '#ffd23f'); p(8, 5, 2, 2, '#ffd23f'); });
  SPR.carrito = mk(16, 16, p => { p(1, 3, 14, 8, '#cfd6dc'); p(2, 4, 12, 6, '#7ec8e3'); p(4, 5, 3, 3, '#fff'); p(9, 5, 3, 3, '#ffd'); p(14, 0, 2, 4, '#555'); p(2, 12, 3, 3, '#222'); p(11, 12, 3, 3, '#222'); });
  SPR.valija = mk(16, 14, p => { p(0, 3, 16, 11, '#7a4a1e'); p(1, 4, 14, 9, '#a8662b'); p(5, 0, 6, 3, '#3a2310'); p(0, 8, 16, 1, '#e0b060'); });
  SPR.sarten = mk(16, 16, p => { p(1, 1, 10, 10, '#222'); p(2, 2, 8, 8, '#555'); p(4, 4, 3, 2, '#ffe14d'); p(10, 10, 6, 3, '#6b3b1a'); });
  SPR.tarjeta = mk(10, 7, p => { p(0, 0, 10, 7, '#fff'); p(0, 1, 10, 2, '#2b5fd9'); p(6, 4, 3, 2, '#f2c230'); });
  SPR.checklist = mk(10, 12, p => { p(0, 0, 10, 12, '#8a5a2b'); p(1, 1, 8, 10, '#fff'); p(2, 3, 2, 2, '#d92020'); p(5, 3, 3, 1, '#333'); p(2, 7, 2, 2, '#d92020'); p(5, 7, 3, 1, '#333'); });
  SPR.timbre = mk(16, 16, p => { p(4, 4, 8, 6, '#f2c230'); p(2, 10, 12, 2, '#f2c230'); p(1, 12, 14, 2, '#555'); p(7, 1, 2, 3, '#555'); });
  SPR.spray = mk(16, 16, p => { p(5, 4, 6, 11, '#3fb4d9'); p(6, 1, 4, 3, '#eee'); p(10, 2, 4, 1, '#eee'); p(6, 8, 4, 3, '#fff'); });
  const pas = { cafe: ['#6b3b1a', '#fff'], uniforme: ['#2b5fd9', '#ddd'], propina: ['#3fbf5a', '#0f5a26'], zapatos: ['#7a4a1e', '#eee'] };
  for (const k in pas) SPR['ic_' + k] = mk(16, 16, p => { p(1, 1, 14, 14, pas[k][1]); p(3, 3, 10, 10, pas[k][0]); if (k === 'cafe') p(13, 6, 2, 4, '#fff'); if (k === 'zapatos') p(3, 11, 12, 2, '#222'); });
  // lobby tile 64x64: checker marble + carpet stripe + occasional plant
  SPR.tile = mk(64, 64, p => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) p(x * 16, y * 16, 16, 16, (x + y) % 2 ? '#3b2f45' : '#463852');
    p(0, 0, 64, 1, '#2a2132'); p(0, 0, 1, 64, '#2a2132'); p(30, 0, 4, 64, '#6a1f2b'); p(31, 0, 2, 64, '#8c2a39'); p(0, 30, 64, 4, '#6a1f2b'); p(0, 31, 64, 2, '#8c2a39'); });
  SPR.plant = mk(32, 32, p => { p(10, 22, 12, 9, '#a0522d'); p(11, 23, 10, 2, '#c07040'); p(8, 8, 6, 14, '#2f7a3a'); p(18, 6, 6, 16, '#2f7a3a'); p(13, 3, 6, 19, '#3f9a4a'); });
}

// ---------------- audio (WebAudio synth) -------------
const AU = { ctx: null, master: null, mus: null, on: true };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.5; AU.master.connect(AU.ctx.destination);
  AU.mus = AU.ctx.createGain(); AU.mus.gain.value = 0.18; AU.mus.connect(AU.master);
  startMusic();
}
function tone(f, d, type = 'square', vol = 0.15, slide = 0, dest) {
  if (!AU.ctx || !AU.on) return; const t = AU.ctx.currentTime, o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(dest || AU.master); o.start(t); o.stop(t + d + 0.02);
}
const sfxLast = {};
function sfx(n) {
  const now = performance.now(); if (sfxLast[n] && now - sfxLast[n] < 45) return; sfxLast[n] = now;
  switch (n) {
    case 'bell': tone(1320, 0.25, 'triangle', 0.12); tone(1980, 0.2, 'sine', 0.06); break;
    case 'hit': tone(220, 0.05, 'square', 0.04, -100); break;
    case 'die': tone(400, 0.08, 'square', 0.05, -250); break;
    case 'tip': tone(880 + Math.random() * 200, 0.05, 'sine', 0.05); break;
    case 'key': tone(1200, 0.08, 'square', 0.07); setTimeout(() => tone(1600, 0.1, 'square', 0.07), 70); break;
    case 'hurt': tone(120, 0.15, 'sawtooth', 0.12, -60); break;
    case 'lvl': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.08), i * 70)); break;
    case 'shoot': tone(700, 0.05, 'triangle', 0.04, 300); break;
    case 'boss': [196, 185, 175, 165].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sawtooth', 0.12), i * 250)); break;
    case 'win': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'square', 0.09), i * 120)); break;
    case 'lose': [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.1), i * 200)); break;
  }
}
function startMusic() {
  // bossa-ish lobby loop: bass + chord stabs, scheduled ahead
  const bass = [110, 0, 165, 0, 123, 0, 185, 0, 98, 0, 147, 0, 131, 0, 196, 0];
  const mel = [440, 0, 523, 494, 0, 440, 392, 0, 440, 0, 587, 523, 0, 494, 440, 0];
  let step = 0, next = AU.ctx.currentTime + 0.1; const spb = 0.16;
  setInterval(() => {
    if (!AU.ctx) return;
    while (next < AU.ctx.currentTime + 0.4) {
      const fast = G && G.boss ? 1.25 : 1;
      const b = bass[step % 16], m = mel[(step >> 0) % 16];
      if (b) note(b * fast, next, 0.28, 'triangle', 0.5);
      if (m && step % 32 >= 16) note(m * fast, next, 0.12, 'square', 0.18);
      if (step % 4 === 2) note(2400, next, 0.03, 'square', 0.05);
      step++; next += spb;
    }
  }, 100);
}
function note(f, t, d, type, v) { const o = AU.ctx.createOscillator(), g = AU.ctx.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(AU.mus); o.start(t); o.stop(t + d + 0.02); }

// ---------------- meta (localStorage, v2 with v1 migration; v1 key is never deleted) -------------
const META_KEY_V1 = 'checkoutChaos.meta.v1', META_KEY = 'checkoutChaos.meta.v2';
let META;
function metaDefaults() { return { v: 3, keys: 0, totalKills: 0, bestTime: 0, runs: 0, wins: 0, unlocked: { recep: true, house: true, botones: true, cocinero: true }, shop: { hp: 0, dmg: 0, reroll: 0, banish: 0 }, sel: 'recep', book: { revealed: {}, fused: {} },
  ach: {}, costumes: {}, costumeSel: {}, stats: { karens: 0, winsAs: {}, lifetimeKeys: 0 }, migratedFromV1: false }; }
function loadMeta() {
  let m = null; try { m = JSON.parse(localStorage.getItem(META_KEY)); } catch (e) { }
  if (!m) { let old = null; try { old = JSON.parse(localStorage.getItem(META_KEY_V1)); } catch (e) { }
    m = metaDefaults();
    if (old) { Object.assign(m, { keys: old.keys || 0, totalKills: old.totalKills || 0, bestTime: old.bestTime || 0, runs: old.runs || 0, wins: 0, sel: old.sel || 'recep' });
      m.unlocked = Object.assign(m.unlocked, old.unlocked || {}); m.shop = Object.assign(m.shop, old.shop || {}); m.migratedFromV1 = true;
      m.pendingRetro = { bestTime: old.bestTime || 0, v1wins: old.wins || 0, botones: !!(old.unlocked || {}).botones }; } }
  const d = metaDefaults(); META = Object.assign(d, m); META.stats = Object.assign(metaDefaults().stats, m.stats || {}); META.shop = Object.assign(metaDefaults().shop, m.shop || {}); META.book = Object.assign(metaDefaults().book, m.book || {}); if ((m.v || 1) < 3) META.migratedFromV2 = true; META.v = 3;
  if (META.pendingRetro) { const r = META.pendingRetro; delete META.pendingRetro;   // v1 win = beat La Inspección (old final boss)
    if (r.bestTime >= 60) grantAch('primer_turno', true); if (r.bestTime >= 300 || r.botones) grantAch('media_jornada', true);
    if (r.v1wins > 0) grantAch('inspeccion', true); if (META.totalKills >= 500) grantAch('matanza', true); }
  for (const c of D.characters) if (!c.unlock) META.unlocked[c.id] = true;
  saveMeta(); }
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(META)); } catch (e) { } }
let achToast = [];
function grantAch(id, silent) {
  if (META.ach[id]) return; const a = D.achievements.find(a => a.id === id); if (!a) return; META.ach[id] = Date.now(); const r = a.reward;
  if (r.keys) { META.keys += r.keys; META.stats.lifetimeKeys += r.keys; } if (r.unlock) META.unlocked[r.unlock] = true; if (r.costume) META.costumes[r.costume] = true;
  saveMeta(); if (!silent) { achToast.push({ s: '🏆 ' + a.name, sub: rewardText(r), t: 3.5 }); sfx('lvl'); } }
function rewardText(r) { const o = []; if (r.keys) o.push('+' + r.keys + ' llaves'); if (r.unlock) o.push('desbloquea ' + D.characters.find(c => c.id === r.unlock).name); if (r.costume) o.push('traje ' + D.costumes[r.costume].name); return o.join(' · '); }

// ---------------- input -------------
const keys = {}; const JOY = { active: false, id: null, sx: 0, sy: 0, x: 0, y: 0 };
let clickQ = [];
addEventListener('keydown', e => { keys[e.code] = true; audioInit(); onKey(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
function toWorld(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
cv.addEventListener('pointerdown', e => { audioInit(); const p = toWorld(e);
  if (G && G.state === 'play' && !hitBtn(p)) { JOY.active = true; JOY.id = e.pointerId; JOY.sx = JOY.x = p.x; JOY.sy = JOY.y = p.y; cv.setPointerCapture(e.pointerId); }
  else clickQ.push(p); });
cv.addEventListener('pointermove', e => { if (JOY.active && e.pointerId === JOY.id) { const p = toWorld(e); JOY.x = p.x; JOY.y = p.y; } });
const endJoy = e => { if (e.pointerId === JOY.id) JOY.active = false; };
cv.addEventListener('pointerup', endJoy); cv.addEventListener('pointercancel', endJoy);

let buttons = [];
function btn(x, y, w, h, label, fn, opt = {}) { buttons.push({ x, y, w, h, fn });
  ctx.fillStyle = opt.disabled ? '#3a3340' : (opt.hl ? '#f2c230' : '#2b5fd9'); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#000'; ctx.fillRect(x, y + h - 2, w, 2);
  txt(label, x + w / 2, y + h / 2 + 3, opt.size || 8, opt.hl ? '#000' : (opt.disabled ? '#888' : '#fff'), 'center'); }
function hitBtn(p) { return buttons.some(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h); }
function processClicks() { const q = clickQ; clickQ = []; for (const p of q) for (const b of buttons) if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.fn(); break; } }
function txt(s, x, y, size = 8, col = '#fff', align = 'left') { ctx.font = `bold ${size}px monospace`; ctx.textAlign = align;
  ctx.fillStyle = '#000'; ctx.fillText(s, x + 1, y + 1); ctx.fillStyle = col; ctx.fillText(s, x, y); }

// ---------------- pools -------------
function Pool(n, make) { this.items = Array.from({ length: n }, make); this.items.forEach(o => o.alive = false); }
Pool.prototype.get = function () { for (const o of this.items) if (!o.alive) { o.alive = true; return o; } return null; };
Pool.prototype.count = function () { let c = 0; for (const o of this.items) if (o.alive) c++; return c; };
let ENE, PROJ, PICK, FX;

// ---------------- game state -------------
let G = null; let screen = 'menu';
const rnd = (a, b) => a + Math.random() * (b - a);
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const TLd = () => D.timeline;

function newRun(charId) {
  const ch = D.characters.find(c => c.id === charId); const b = ch.bonus || {};
  G = { state: 'play', t: DBG.t, kills: 0, karens: 0, keys: 0, lvl: 1, xp: 0, xpNext: 5, char: ch, weapons: [], passives: [], boss: null, mini: null, inspSpawned: false, duenoSpawned: false,
    nextElite: TLd().firstElite, nextConga: TLd().congaFrom, spawnAcc: 0, rerolls: D.run.rerolls + META.shop.reroll, banishLeft: D.run.banish + (META.shop.banish || 0), banished: {}, banishMode: false, choices: null, chestsOpened: 0, mastered: [], pulse: 0, unlockedNow: [], achNow: [], shake: 0,
    evolved: [], ate: {}, minHpFrac: 1, revived: false, trailT: 0, duenoT: null, killed: {}, magnetT: 0, committed: false,
    players: [{ id: 0, inputSlot: 0, charId: ch.id, costume: META.costumeSel[ch.id] || null, anim: 0, input: { mx: 0, my: 0 }, x: 0, y: 0, hp: 0,
      baseMaxHp: 120 + 10 * META.shop.hp + (b.hp || 0), maxHp: 120 + 10 * META.shop.hp + (b.hp || 0), baseRegen: b.regen || 0, basePickup: 40 * (b.pickup || 1), baseDmg: (b.dmg || 1) * (1 + 0.05 * META.shop.dmg) * DBG.dmg, speed: 95, regen: b.regen || 0, armor: 0, pickup: 40 * (b.pickup || 1), heal: b.heal || 1, keyMul: b.keys || 1,
      dmg: (b.dmg || 1) * (1 + 0.05 * META.shop.dmg) * DBG.dmg, cd: 1, xpMul: 1, fx: 1, fy: 0, inv: 0, kbx: 0, kby: 0 }] };
  Object.defineProperty(G, 'p', { get() { return this.players[0]; } });
  G.p.hp = G.p.maxHp; recalcPassives();
  for (const P of [ENE, PROJ, PICK, FX]) P.items.forEach(o => o.alive = false);
  addWeapon(ch.weapon); screen = 'play'; META.runs++; saveMeta();
  if (DBG.t) { const T = TLd(); while (G.nextElite < DBG.t) G.nextElite += G.nextElite >= T.highSeason ? T.eliteEveryHS : T.eliteEvery; while (G.nextConga < DBG.t) G.nextConga += T.congaEvery;
    if (DBG.t > T.inspAt + 1) G.inspSpawned = true; }
}
function addWeapon(id) { const LR = D.levelRules; let w = G.weapons.find(w => w.id === id); if (w) w.lvl = Math.min(LR.maxLevel, w.lvl + 1); else G.weapons.push(w = { id, lvl: 1, a: 0, cd: 0 });
  const S = D.weapons[id]; if (G.players) recalcPassives();
  if (w.lvl >= LR.evoLevel && S.evo && !w.evo) { w.evo = true; G.evolved.push(id); if (!META.book.revealed[id + ':w']) { META.book.revealed[id + ':w'] = 1; saveMeta(); } G.banner = { s: '¡EVOLUCIÓN: ' + S.evo.name.toUpperCase() + '!', t: 3 }; sfx('win'); }
  if (w.lvl === LR.maxLevel && !G.mastered.includes(id)) { G.mastered.push(id); G.banner = { s: '★ MAESTRÍA: ' + (w.evo ? S.evo.name : S.name), t: 2.5 }; } }
function addPassive(id) { let p = G.passives.find(p => p.id === id); if (p) p.lvl = Math.min(D.passives[id].maxLevel || 5, p.lvl + 1); else G.passives.push(p = { id, lvl: 1 });
  if (p.lvl >= 5 && !META.book.revealed[id + ':p']) { META.book.revealed[id + ':p'] = 1; saveMeta(); } recalcPassives(); }
function passiveSum(stat) { let s = 0; for (const p of G.passives) { const per = D.passives[p.id].per; if (per[stat] != null) s += per[stat] * p.lvl; } return s; }
function recalcPassives() { const ch = G.char.bonus || {};
  const ll = G.passives.find(p => p.id === 'llavero'); const extraCount = ll ? D.passives.llavero.per.countAt.filter(l => ll.lvl >= l).length : 0;
  for (const P of G.players) { const maxed = G.weapons.filter(w => w.lvl >= 5).length;
    P.cd = Math.max(0.3, (ch.cd || 1) * (1 + passiveSum('cd'))) / (1 + (ch.cdPerMaxed || 0) * maxed); P.armor = (ch.armor || 0) + passiveSum('armor');
    P.xpMul = (ch.xp || 1) * (1 + passiveSum('xp')); P.speed = 95 * (ch.speed || 1) * (1 + passiveSum('speed'));
    P.area = 1 + passiveSum('area'); P.dur = 1 + passiveSum('duration'); P.extraCount = extraCount; P.luck = passiveSum('luck'); P.dmg = P.baseDmg * (1 + passiveSum('dmg'));
    P.pickup = P.basePickup * (1 + passiveSum('pickup')); P.chestExtra = passiveSum('chestExtra'); P.lifesteal = passiveSum('lifesteal'); P.eliteDmg = 1 + passiveSum('eliteDmg'); P.projSpeed = 1 + passiveSum('projSpeed');
    P.regen = P.baseRegen + passiveSum('regen'); const nm = P.baseMaxHp * (1 + passiveSum('maxHp')); if (P.maxHp && nm > P.maxHp) P.hp += nm - P.maxHp; P.maxHp = nm; } }
function applyMods(o, m) { for (const k in m) { const v = m[k];
  if (k.endsWith('+')) { const b = k.slice(0, -1); o[b] = (o[b] || 0) + v; } else if (k === 'countSet') o.count = v; else if (k === 'cdSet') o.cd = v;
  else if (typeof v === 'number' && typeof o[k] === 'number') o[k] *= v; else o[k] = v; } }
function WS(w) { const B = D.weapons[w.id], LR = D.levelRules, L = Math.min(w.lvl, 5) - 1, o = {}; for (const k in B) if (Array.isArray(B[k])) o[k] = B[k][Math.min(L, B[k].length - 1)];
  if (w.lvl >= 2 && B.effA) applyMods(o, B.effA); if (w.lvl >= 4 && B.effB) applyMods(o, B.effB); if (w.evo) applyMods(o, B.evo.mods);
  if (w.lvl >= 6) applyMods(o, LR.lvl6); if (w.lvl >= 7) { if (o.count != null) o.count += 1; else for (const k of ['radius', 'range']) if (o[k]) o[k] *= LR.lvl7.areaIfNoCount; }
  if (w.lvl >= 8) { o.cd = (o.cd || 1) * LR.lvl8.cd; o.glow = 1; }
  const P = G.p; if (P) { for (const k of ['radius', 'range', 'explode', 'auraR']) if (o[k]) o[k] *= P.area; for (const k of ['life', 'fireDur']) if (o[k]) o[k] *= P.dur;
    if (o.count != null) o.count += P.extraCount; if (o.speed) o.speed *= P.projSpeed; }
  return o; }
const PLAYER_R = 9;

// ---------------- spawning -------------
function spawnEnemy(type, x, y, extra) {
  const e = ENE.get(); if (!e) return null; const d = D.enemies[type], T = TLd(); const boss = d.behavior === 'boss' || d.behavior === 'dueno';
  let hpm = boss ? 1 : 1 + G.t / 240, spm = 1; if (!boss && G.t >= T.highSeason) { hpm *= T.hsHp; spm *= T.hsSpeed; }
  Object.assign(e, { stunT: 0, slowT: 0, slowF: 0, burnT: 0, burnDps: 0, type, x, y, hp: d.hp * hpm, maxHp: d.hp * hpm, spd: d.speed * spm * rnd(0.9, 1.1), r: d.size, d, vx: 0, vy: 0, hits: {}, flash: 0, leader: null, kb: 0, kbx: 0, kby: 0, tA: 0, tB: 0, tC: 0, life: 99, st: 'move', stT: 0, spiral: 0, atkT: 0, ph: Math.random() * 6 });
  if (extra) Object.assign(e, extra); return e;
}
function edgePos(margin = 30) { const a = Math.random() * Math.PI * 2, R = Math.hypot(W, H) / 2 + margin; return { x: G.p.x + Math.cos(a) * R, y: G.p.y + Math.sin(a) * R }; }
function phaseName() { const T = TLd(), t = G.t; if (G.boss && G.boss.alive) return 'JEFE FINAL'; if (t >= T.breathFrom && t < T.breathTo) return 'RESPIRO'; if (t >= T.highSeason) return 'TEMPORADA ALTA'; return ''; }
function spawning(dt) {
  const t = G.t, T = TLd(); if (G.victory) return;
  if (!G.inspSpawned && t >= T.inspAt) { G.inspSpawned = true; const p = edgePos(10); G.mini = spawnEnemy('inspeccion', p.x, p.y); sfx('boss'); G.banner = { s: '¡LLEGÓ LA INSPECCIÓN! · TEMPORADA ALTA', t: 3 }; }
  if (!G.duenoSpawned && t >= T.dueAt) { G.duenoSpawned = true; const p = edgePos(10); G.boss = spawnEnemy('dueno', p.x, p.y); G.duenoT = t; sfx('boss'); G.banner = { s: '¡EL DUEÑO DEL HOTEL!', t: 3 }; }
  if (t >= T.breathFrom && t < T.breathTo) return;          // 15s breathing room
  if (ENE.count() >= T.maxEnemies) return;
  let rate = 1.2 + Math.min(t, 600) / 50; if (t >= 240) rate *= 2; if (t >= 480) rate *= 1.4; if (G.boss || G.mini) rate *= 0.5;
  G.spawnAcc += rate * dt;
  while (G.spawnAcc >= 1) { G.spawnAcc--;
    const pool = ['apurado']; if (t >= 120) pool.push('valija'); if (t >= 240) pool.push('queja', 'apurado'); if (t >= 480) pool.push('valija', 'queja'); if (t >= T.lateFrom) pool.push('mucama', 'mucama');
    const type = pool[Math.floor(Math.random() * pool.length)], p = edgePos();
    if (type === 'queja') { const a = Math.atan2(G.p.y - p.y, G.p.x - p.x) + rnd(-0.2, 0.2); const e = spawnEnemy('queja', p.x, p.y); if (e) { e.vx = Math.cos(a); e.vy = Math.sin(a); e.life = 12; } }
    else spawnEnemy(type, p.x, p.y);
  }
  if (t >= G.nextElite && t < T.dueAt) { const n = t >= T.lateFrom ? 2 : 1; const p = edgePos(); for (let i = 0; i < n; i++) spawnEnemy('karen', p.x + i * 30, p.y);
    if (G.nextElite < T.eliteRegularFrom && t < T.eliteRegularFrom) G.nextElite = T.eliteRegularFrom; else G.nextElite += t >= T.highSeason ? T.eliteEveryHS : T.eliteEvery; if (G.nextElite <= t) G.nextElite = t + 1; }
  if (t >= G.nextConga && t < T.dueAt + 30) { G.nextConga += t >= T.lateFrom ? T.congaEveryLate : T.congaEvery; const p = edgePos(); let prev = null;
    for (let i = 0; i < Math.min(T.congaMax, T.congaSize + Math.floor((t - 360) / 120)); i++) { const e = spawnEnemy('despedida', p.x, p.y, { leader: prev }); if (e) prev = e; } }
}

// ---------------- weapons -------------
function nearestEnemy(maxD = 1e9, from = G.p) { let best = null, bd = maxD * maxD; for (const e of ENE.items) if (e.alive) { const d = dist2(e, from); if (d < bd) { bd = d; best = e; } } return best; }
function fireProj(o) { const p = PROJ.get(); if (!p) return null; Object.assign(p, { team: 0, pierce: 99, hits: {}, ang: 0, spin: 0, t: 0, life: 3, r: 6, w: null, boomer: 0, bounce: false, homing: false, lob: null, rotTo: false }, o); return p; }
function coneHit(P, ang, R, half, dps, dt) { for (const e of ENE.items) if (e.alive) { const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy); if (d < R + e.r) { let da = Math.atan2(dy, dx) - ang; da = Math.atan2(Math.sin(da), Math.cos(da)); if (half >= Math.PI || Math.abs(da) < half) damage(e, dps * dt / P.cd, null, 0); } } }
let CURS = null;   // stats of the weapon currently dealing damage (status effects, heal-on-kill, elite bonus)
function explodeAt(x, y, R, dmg, S, chain) { const f = FX.get(); if (f) Object.assign(f, { kind: 'xpl', x, y, t: 0, dur: 0.3, r: R, vx: 0 }); const prev = CURS; CURS = S;
  for (const e of ENE.items) if (e.alive && (e.x - x) ** 2 + (e.y - y) ** 2 < (R + e.r) ** 2) damage(e, dmg, null, 60, x, y);
  if (chain && S && S.chain) { const n = nearestEnemy(90, { x: x + 1, y }); if (n) setTimeout(() => { if (G && G.state !== 'over') explodeAt(n.x, n.y, R, dmg * 0.8, S, chain - 1); }, 120); } CURS = prev; }
function weaponsUpdate(dt) {
  const P = G.p;
  for (const w of G.weapons) {
    const S = WS(w), B = D.weapons[w.id]; CURS = S; w.cd -= dt; w.anim = (w.anim || 0) + dt;
    const ready = () => { if (w.cd <= 0) { w.cd = (S.cd || 1) * P.cd; return true; } return false; };
    if (S.auraR) { for (const e of ENE.items) if (e.alive && dist2(e, P) < (S.auraR + e.r) ** 2) damage(e, S.auraDps * dt, null, 0); }
    const ring = () => { G.pulse++; const f = FX.get(); if (f) Object.assign(f, { kind: 'ring', x: P.x, y: P.y, t: 0, dur: 0.35, r: S.radius, evo: w.evo, spr: w.evo && w.id === 'silbato' ? 'fx_alarma_onda' : (B.sprFx || null), vx: 0 });
      for (const e of ENE.items) if (e.alive && dist2(e, P) < (S.radius + e.r) ** 2) damage(e, S.dmg, 'ring' + w.id, S.kb || 120); sfx('bell'); };
    switch (B.type) {
      case 'timbre': if (ready()) { ring(); w.extra = (S.pulses || 1) - 1; w.et = 0.25; } else if (w.extra > 0) { w.et -= dt; if (w.et <= 0) { w.extra--; w.et = 0.25; ring(); } } break;
      case 'carrito': if (ready()) for (let i = 0; i < S.count; i++) { const a = Math.random() * Math.PI * 2; const spr = B.sprBase ? (w.evo && G.fusedTray ? 'proj_bandeja_dorada' : B.sprBase) : (w.evo ? 'evo_carrito' : 'carrito');
          fireProj({ w: w.id, S, spr, x: P.x, y: P.y, vx: Math.cos(a) * S.speed, vy: Math.sin(a) * S.speed, dmg: S.dmg, life: S.life, r: w.evo ? 12 : 8, hitCd: 0.5, bounce: true, foodOnHit: S.foodOnHit || 0, spin: B.sprBase ? 10 : 0 }); } break;
      case 'valija': if (ready()) { const n = nearestEnemy(300); const base = n ? Math.atan2(n.y - P.y, n.x - P.x) : Math.atan2(P.fy, P.fx); const sp = 260 * (S.speedMul || 1) * P.projSpeed;
          for (let i = 0; i < S.count; i++) { const a = base + (i - (S.count - 1) / 2) * 0.5; fireProj({ w: w.id, S, spr: w.evo ? 'evo_valija' : 'valija', x: P.x, y: P.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, bspd: sp, dmg: S.dmg, life: 4, r: w.evo ? 12 : 8, hitCd: 0.4, boomer: S.range, spin: 12 }); } sfx('shoot'); } break;
      case 'sarten': { w.a += S.spin * dt; const n = S.count; w.pos = [];
        for (let i = 0; i < n; i++) { const a = w.a + i * Math.PI * 2 / n, x = P.x + Math.cos(a) * S.radius, y = P.y + Math.sin(a) * S.radius; w.pos.push({ x, y, a });
          for (const e of ENE.items) if (e.alive && (e.x - x) ** 2 + (e.y - y) ** 2 < (e.r + 8) ** 2) { const k = 'sarten' + i; if (!(e.hits[k] > G.t)) { e.hits[k] = G.t + 0.45; damage(e, S.dmg, null, 140, x, y); } } }
        if (S.puddle) { w.pt = (w.pt || 0) - dt; if (w.pt <= 0 && w.pos.length) { w.pt = 0.9; const q = w.pos[Math.floor(Math.random() * w.pos.length)]; const f = FX.get(); if (f) Object.assign(f, { kind: 'puddle', S, x: q.x, y: q.y, t: 0, dur: 2.5 * P.dur, dps: S.dmg * 1.2, vx: 0 }); } } } break;
      case 'spray': { const ang = Math.atan2(P.fy, P.fx), half = S.angle360 ? Math.PI : S.angle; w.ang = ang; coneHit(P, ang, S.range, half, S.dps, dt);
        if (Math.random() < 0.6) { const f = FX.get(); if (f) { const a = ang + rnd(-half, half), sp = rnd(S.range * 1.4, S.range * 2.2); Object.assign(f, { kind: w.evo ? 'cloud' : 'mist', x: P.x + Math.cos(a) * 8, y: P.y + Math.sin(a) * 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dur: 0.45 }); } } } break;
      case 'beam': { w.a += S.spin * dt; w.ang = w.a; coneHit(P, w.a, S.range, Math.min(Math.PI, S.angle), S.dps, dt); } break;
      case 'tarjeta': if (ready()) { const cands = ENE.items.filter(e => e.alive).sort((a, b) => dist2(a, P) - dist2(b, P));
          for (let i = 0; i < S.count; i++) { const tgt = cands[i % Math.max(1, cands.length)]; const a = tgt ? Math.atan2(tgt.y - P.y, tgt.x - P.x) : Math.random() * 6.28;
            fireProj({ w: w.id, S, spr: w.evo ? 'evo_llave' : 'tarjeta', x: P.x, y: P.y, vx: Math.cos(a) * S.speed, vy: Math.sin(a) * S.speed, dmg: S.dmg, life: 1.4, r: w.evo ? 8 : 5, pierce: S.pierce || 1, ang: a }); } if (cands.length) sfx('shoot'); } break;
      case 'fan': if (ready()) { const base = Math.atan2(P.fy, P.fx); const spread = S.returns ? (Math.PI * 2) / S.count : 0.22; for (let i = 0; i < S.count; i++) { const a = base + (i - (S.count - 1) / 2) * spread;
          fireProj({ w: w.id, S, spr: 'cuchillo', x: P.x, y: P.y, vx: Math.cos(a) * S.speed, vy: Math.sin(a) * S.speed, bspd: S.speed, dmg: S.dmg, life: S.returns ? 2.5 : 0.9, r: 5, pierce: S.returns ? 99 : (S.pierce || 2), hitCd: 0.4, ang: a, rotTo: true, boomer: S.returns ? 120 : 0 }); } sfx('shoot'); } break;
      case 'homing': if (ready()) { for (let i = 0; i < S.count; i++) { const a = Math.random() * 6.28; fireProj({ w: w.id, S, spr: B.sprBase || B.spr || 'memo', x: P.x, y: P.y, vx: Math.cos(a) * S.speed, vy: Math.sin(a) * S.speed, spd: S.speed, dmg: S.dmg, life: B.sprBase ? 5 : 3, r: 6, pierce: 1, homing: true, explode: S.explode || 0 }); } sfx('shoot'); } break;
      case 'lob': if (ready()) { const tools = ['proj_herr_martillo', 'proj_herr_destornillador', 'proj_herr_llave']; for (let i = 0; i < S.count; i++) { const n = nearestEnemy(260); const tx = n ? n.x + rnd(-30, 30) : P.x + rnd(-120, 120), ty = n ? n.y + rnd(-30, 30) : P.y + rnd(-120, 120);
          const spr = w.evo && w.id === 'llave_inglesa' ? tools[i % 3] : (B.spr || 'wrench');
          fireProj({ w: w.id, S, spr, fire: !!B.fire, fireDur: S.fireDur || 3, fireR: S.fireR || 1, evoFire: w.evo && B.fire, x: P.x, y: P.y, vx: (tx - P.x) / 0.6, vy: (ty - P.y) / 0.6, dmg: S.dmg, life: 0.6, r: 0, pierce: 0, spin: 14, lob: { R: S.radius, x0: P.x, y0: P.y } }); } } break;
      case 'strike': if (ready()) { const vis = ENE.items.filter(e => e.alive && (B.near ? dist2(e, P) < 130 * 130 : Math.abs(e.x - P.x) < W / 2 && Math.abs(e.y - P.y) < H / 2));
          for (let i = 0; i < S.count; i++) { const e = vis[Math.floor(Math.random() * vis.length)]; const x = e ? e.x : P.x + rnd(-100, 100), y = e ? e.y : P.y + rnd(-70, 70);
            const f = FX.get(); if (f) Object.assign(f, { kind: 'strike', S, spr: B.sprBase ? B.sprBase : (w.evo ? 'proj_billete_dorado' : 'billete'), ice: !!B.sprBase, x, y, t: 0, dur: 0.45, R: S.radius, dmg: S.dmg, done: false, tip: S.tipOnStrike, vx: 0 }); } }
        if (S.nova) { w.nt = (w.nt || 0) - dt; if (w.nt <= 0) { w.nt = S.nova.every; const f = FX.get(); if (f) Object.assign(f, { kind: 'nova', x: P.x, y: P.y, t: 0, dur: 0.6, r: S.nova.R * P.area, vx: 0 });
          for (const e of ENE.items) if (e.alive && dist2(e, P) < (S.nova.R * P.area) ** 2) { e.stunT = Math.max(e.stunT, S.nova.freeze); damage(e, S.dmg, null, 0); } } } break;
      case 'arc': if (ready()) { const ang = Math.atan2(P.fy, P.fx), half = S.arcFull ? Math.PI : (S.angle || 1.3), dirs = S.arcDouble ? [ang, ang + Math.PI] : [ang];
          for (const a0 of dirs) { const f = FX.get(); if (f) Object.assign(f, { kind: 'arc', spr: w.id === 'plumero' ? 'fx_arco_plumero' : (S.arcFull ? 'fx_porton_golpe' : 'arco_baston'), full: !!S.arcFull, x: P.x, y: P.y, ang: a0, t: 0, dur: 0.25, r: S.range, vx: 0 });
            for (const e of ENE.items) if (e.alive) { const dx = e.x - P.x, dy = e.y - P.y; if (dx * dx + dy * dy < (S.range + e.r) ** 2) { let da = Math.atan2(dy, dx) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) < half) damage(e, S.dmg, null, S.kb || 160); } } } sfx('hit'); } break;
      case 'whip': if (ready()) { const ang = Math.atan2(P.fy, P.fx), dirs = S.cross ? [0, Math.PI / 2, Math.PI, -Math.PI / 2].map(a => ang + a) : [ang];
          for (const a0 of dirs) { const f = FX.get(); if (f) Object.assign(f, { kind: 'whip', x: P.x, y: P.y, ang: a0, t: 0, dur: 0.22, r: S.range, vx: 0 }); const cx = Math.cos(a0), cy = Math.sin(a0);
            for (const e of ENE.items) if (e.alive) { const dx = e.x - P.x, dy = e.y - P.y, along = dx * cx + dy * cy, perp = Math.abs(-dx * cy + dy * cx); if (along > 0 && along < S.range + e.r && perp < 9 + e.r) damage(e, S.dmg, null, 90); } } sfx('hit'); } break;
      case 'drone': { w.a += 1.3 * dt; w.pos = []; const n = S.count; for (let i = 0; i < n; i++) { const a = w.a + i * Math.PI * 2 / n; w.pos.push({ x: P.x + Math.cos(a) * S.radius, y: P.y + Math.sin(a) * S.radius * 0.7, a }); }
        if (ready()) for (const q of w.pos) { const t = nearestEnemy(260, q); if (!t) continue; const a = Math.atan2(t.y - q.y, t.x - q.x), sp = 280 * P.projSpeed;
          fireProj({ w: w.id, S, spr: S.missile ? 'proj_misil' : 'proj_dron_disparo', x: q.x, y: q.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: S.dmg, life: 1.2, r: 4, pierce: 1, ang: a, rotTo: true, explode: S.missile ? 22 * P.area : 0 }); } } break;
      case 'car': if (ready()) { const base = Math.atan2(P.fy, P.fx); for (let i = 0; i < S.count; i++) { const a = base + (i - (S.count - 1) / 2) * 0.35;
          fireProj({ w: w.id, S, spr: w.evo ? 'proj_limusina' : 'auto', x: P.x - Math.cos(a) * 30, y: P.y - Math.sin(a) * 30, vx: Math.cos(a) * S.speed, vy: Math.sin(a) * S.speed, dmg: S.dmg, life: S.life || 2.2, r: w.evo ? 16 : 13, pierce: S.pierce || 99, hitCd: 1, ang: a, rotTo: true, oil: !!S.oilTrail }); } sfx('shoot'); } break;
    }
  }
  CURS = null;
}
function damage(e, amt, key, kb = 0, sx, sy) {
  if (!e.alive) return; if (key) { if (e.hits[key] === G.pulse) return; e.hits[key] = G.pulse; }
  const P = G.p, S = CURS, big = e.d.behavior === 'boss' || e.d.behavior === 'dueno';
  amt *= P.dmg; if (e.d.elite || big) amt *= P.eliteDmg * (S && S.eliteDmg ? S.eliteDmg : 1);
  let crit = false; if (P.luck > 0 && Math.random() < P.luck) { amt *= D.run.critMul; crit = true; }
  e.hp -= amt; e.flash = 0.08;
  if (S) { if (S.slow) { e.slowT = 1.5; e.slowF = Math.max(e.slowF, S.slow); } if (S.stun && !big) e.stunT = Math.max(e.stunT, S.stun); if (S.freeze && !big) e.stunT = Math.max(e.stunT, S.freeze); if (S.burn) { e.burnT = 2 * P.dur; e.burnDps = Math.max(e.burnDps, S.burn); } }
  if (kb && !big && e.st !== 'dash') { const ox = sx ?? P.x, oy = sy ?? P.y, dx = e.x - ox, dy = e.y - oy, d = Math.hypot(dx, dy) || 1; e.kb = 0.12; e.kbx = dx / d * kb * (e.d.elite ? 0.4 : 1); e.kby = dy / d * kb * (e.d.elite ? 0.4 : 1); }
  if (amt >= 1 && (crit || Math.random() < 0.3)) { const f = FX.get(); if (f) Object.assign(f, { kind: 'num', x: e.x + rnd(-4, 4), y: e.y - e.r - 10, t: 0, dur: 0.5, v: Math.round(amt) + (crit ? '!' : ''), col: crit ? '#ffd23f' : null, vx: 0 }); }
  sfx('hit'); if (e.hp <= 0) { if (S && S.healOnKill) P.hp = Math.min(P.maxHp, P.hp + S.healOnKill); kill(e); }
}
function foodCount() { let c = 0; for (const k of PICK.items) if (k.alive && k.food) c++; return c; }
function dropFood(e) { const F = D.food, d = e.d; const big = d.behavior === 'boss' || d.behavior === 'dueno';
  const cat = big ? 'boss' : d.elite ? 'elite' : e.type === 'despedida' ? 'despedida' : 'normal';
  if (Math.random() >= F.chance[cat] * (1 + (G.p.luck || 0) * 2)) return; if (!big && foodCount() >= F.maxOnScreen) return;
  let id = 'buffet'; if (!big) { const wts = F.weights[cat === 'elite' ? 'elite' : 'normal'], tot = wts.reduce((a, b) => a + b, 0); let r = Math.random() * tot; id = F.order[0];
    for (let i = 0; i < wts.length; i++) { if ((r -= wts[i]) < 0) { id = F.order[i]; break; } } }
  const p = PICK.get(); if (p) Object.assign(p, { kind: 'food_' + id, food: id, x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), v: 0, mag: false, life: F.despawn }); }
function kill(e) {
  e.alive = false; G.kills++; sfx('die'); G.killed[e.type] = (G.killed[e.type] || 0) + 1; if (e.type === 'karen') G.karens++;
  const f = FX.get(); if (f) Object.assign(f, { kind: 'poof', x: e.x, y: e.y, t: 0, dur: 0.3, vx: 0 });
  const d = e.d; const xv = d.xp * (e.type === 'despedida' ? D.run.despedidaXpMul : 1); if (xv) drop(xv >= 5 ? 'tipBig' : 'tip', e.x, e.y, xv);
  if (G.p.lifesteal && Math.random() < G.p.lifesteal) G.p.hp = Math.min(G.p.maxHp, G.p.hp + 1);
  if ((d.elite || e.type === 'inspeccion') && Math.random() < D.run.chest.eliteChance) drop('chest', e.x, e.y, 1);
  const k = d.keys || (Math.random() < 0.012 * (1 + G.p.luck * 4) ? 1 : 0); for (let i = 0; i < k; i++) drop('key', e.x + rnd(-14, 14), e.y + rnd(-14, 14), 1);
  dropFood(e);
  if (d.onDeath === 'queja3') for (let i = 0; i < 3; i++) { const a = Math.atan2(G.p.y - e.y, G.p.x - e.x) + (i - 1) * 0.5; const q = spawnEnemy('queja', e.x, e.y); if (q) { q.vx = Math.cos(a); q.vy = Math.sin(a); q.life = 10; } }
  if (e.type === 'inspeccion') { G.mini = null; G.banner = { s: '¡INSPECCIÓN APROBADA! Sigue la Temporada Alta…', t: 3 }; sfx('lvl'); }
  if (d.behavior === 'dueno') { G.duenoKillTime = G.t - (G.duenoT ?? G.t); G.boss = null; G.victory = true; G.banner = { s: '¡EL HOTEL ES TUYO!', t: 3 }; sfx('win'); for (const o of ENE.items) if (o.alive) o.alive = false; setTimeout(() => endRun(true), 1500); }
}
function drop(kind, x, y, v) { const p = PICK.get(); if (p) Object.assign(p, { kind, x, y, v, mag: false, food: null, life: 999 }); }

// ---------------- enemies -------------
function enemiesUpdate(dt) {
  const P = G.p;
  for (const e of ENE.items) { if (!e.alive) continue; e.flash -= dt; e.atkT -= dt;
    const d = e.d; let tx = P.x, ty = P.y;
    if (e.burnT > 0) { e.burnT -= dt; e.hp -= e.burnDps * dt; if (e.hp <= 0) { kill(e); continue; } }
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowF = 0; }
    const mv = e.stunT > 0 ? 0 : 1 - e.slowF; if (e.stunT > 0) e.stunT -= dt; e.mv = mv;
    if (e.kb > 0) { e.kb -= dt; e.x += e.kbx * dt; e.y += e.kby * dt; }
    else if (d.behavior === 'line') { e.x += e.vx * e.spd * mv * dt; e.y += e.vy * e.spd * mv * dt; e.life -= dt; if (e.life <= 0) { e.alive = false; continue; } }
    else if (d.behavior === 'dueno') duenoAI(e, dt);
    else { if (d.behavior === 'conga' && e.leader) { if (e.leader.alive && e.leader.type === 'despedida') { tx = e.leader.x - (e.leader.vx || 0) * 22; ty = e.leader.y - (e.leader.vy || 0) * 22; } else e.leader = null; }
      const dx = tx - e.x, dy = ty - e.y, dd = Math.hypot(dx, dy) || 1; let sp = e.spd; if (d.behavior === 'conga' && e.leader && dd < 20) sp = 0;
      e.vx = dx / dd; e.vy = dy / dd; let wx = 0, wy = 0; if (d.behavior === 'ghost') { const s = Math.sin(G.t * 3 + e.ph) * 0.8; wx = -e.vy * s; wy = e.vx * s; }
      e.x += (e.vx + wx) * sp * mv * dt; e.y += (e.vy + wy) * sp * mv * dt;
      if (d.behavior === 'boss') inspAI(e, dt); }
    const big = d.behavior === 'boss' || d.behavior === 'dueno';
    if (!d.elite && !big && d.behavior !== 'line' && dist2(e, P) > (W + H) ** 2) { const p = edgePos(); e.x = p.x; e.y = p.y; }
    const rr = e.r + PLAYER_R - 3;
    if (dist2(e, P) < rr * rr) { hurt(d.dmg * (1 + Math.min(G.t, 900) / 600)); if (d.push) { const dx = P.x - e.x, dy = P.y - e.y, dd = Math.hypot(dx, dy) || 1; P.kbx = dx / dd * d.push; P.kby = dy / dd * d.push; } }
  }
  const arr = ENE.items, off = Math.floor(G.t * 60); for (let i = 0; i < arr.length; i++) { const a = arr[i]; if (!a.alive || a.d.behavior === 'line' || a.d.behavior === 'ghost') continue; const b = arr[(i * 7 + off) % arr.length];
    if (b !== a && b.alive && b.d.behavior !== 'line' && b.d.behavior !== 'ghost') { const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy, m = a.r + b.r; if (d2 < m * m && d2 > 0.01) { const d = Math.sqrt(d2), push = (m - d) / 2; a.x += dx / d * push; a.y += dy / d * push; b.x -= dx / d * push; b.y -= dy / d * push; } } }
}
function enemyShot(e, a, spd, dmg, spr) { fireProj({ team: 1, spr, x: e.x, y: e.y - 10, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, dmg, life: 5, r: 5, spin: 6 }); }
function inspAI(e, dt) { e.tA += dt; e.tB += dt;
  if (e.tA > 2.4) { e.tA = 0; const base = Math.atan2(G.p.y - e.y, G.p.x - e.x); for (let i = -4; i <= 4; i++) enemyShot(e, base + i * 0.18, 130, 12, 'memo'); sfx('shoot'); }
  if (e.tB > 7) { e.tB = 0; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; spawnEnemy(i % 2 ? 'apurado' : 'valija', e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40); } } }
function duenoAI(e, dt) {
  const C = TLd().dueno, P = G.p, f = e.hp / e.maxHp; e.phase = f > C.phase2 ? 1 : f > C.phase3 ? 2 : 3;
  const chase = k => { const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1; e.vx = dx / d; e.vy = dy / d; e.x += e.vx * e.spd * k * dt; e.y += e.vy * e.spd * k * dt; };
  if (e.phase < 3) { chase(1); e.tA += dt; const every = e.phase === 1 ? C.spiralEvery : C.spiralEvery2;
    while (e.tA > every) { e.tA -= every; e.spiral += 0.37; const arms = e.phase === 1 ? 1 : 2; for (let k = 0; k < arms; k++) enemyShot(e, e.spiral + k * Math.PI, C.bulletSpeed, C.bulletDmg, 'billete'); e.atkT = 0.3; }
    if (e.phase === 2) { e.tB += dt; if (e.tB > C.summonEvery || !e.summoned) { e.tB = 0; e.summoned = true; for (let i = 0; i < C.summonCount; i++) { const a = i * Math.PI / 2; spawnEnemy('abogado', e.x + Math.cos(a) * 60, e.y + Math.sin(a) * 60); } G.banner = { s: '¡Llamó a sus abogados!', t: 1.5 }; } } }
  else { e.stT -= dt; if (!e.p3) { e.p3 = true; e.st = 'rest'; e.stT = 0.5; G.banner = { s: '¡EL DUEÑO ESTÁ FURIOSO!', t: 2 }; }
    if (e.st === 'rest') { chase(0.6); if (e.stT <= 0) { e.st = 'tele'; e.stT = C.telegraph; const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1; e.dx = dx / d; e.dy = dy / d; sfx('hurt'); } }
    else if (e.st === 'tele') { if (e.stT <= 0) { e.st = 'dash'; e.stT = C.dashTime; } }
    else if (e.st === 'dash') { e.vx = e.dx; e.vy = e.dy; e.x += e.dx * C.dashSpeed * dt; e.y += e.dy * C.dashSpeed * dt; if (e.stT <= 0) { e.st = 'rest'; e.stT = C.rest; } } }
}
function hurt(amt) { const P = G.p; if (P.inv > 0 || DBG.god || G.victory) return; P.hp -= Math.max(1, amt - P.armor); P.inv = 0.6; G.shake = 0.15; sfx('hurt');
  const rv = G.char.bonus.revive; if (P.hp <= 0 && rv && !G.revived) { G.revived = true; P.hp = P.maxHp * rv; P.inv = 2; G.banner = { s: '¡RESCATE! Revivís al ' + Math.round(rv * 100) + '%', t: 2.5 }; sfx('lvl'); }
  G.minHpFrac = Math.min(G.minHpFrac, Math.max(0, P.hp) / P.maxHp); if (P.hp <= 0) { P.hp = 0; endRun(false); } }

// ---------------- projectiles / pickups / fx -------------
function projUpdate(dt) {
  const P = G.p;
  for (const p of PROJ.items) { if (!p.alive) continue; p.t += dt; p.life -= dt;
    CURS = p.S || null;
    if (p.oil) { p.oilT = (p.oilT || 0) - dt; if (p.oilT <= 0) { p.oilT = 0.3; const f = FX.get(); if (f) Object.assign(f, { kind: 'puddle', S: p.S, x: p.x, y: p.y, t: 0, dur: 2 * G.p.dur, dps: p.dmg * 0.5, vx: 0 }); } }
    if (p.lob) { if (p.life <= 0) { p.alive = false; const f = FX.get(); if (f) Object.assign(f, { kind: 'boom', x: p.x, y: p.y, t: 0, dur: 0.3, r: p.lob.R, vx: 0 });
        for (const e of ENE.items) if (e.alive && dist2(e, p) < (p.lob.R + e.r) ** 2) damage(e, p.dmg, null, 80, p.x, p.y);
        if (p.fire) { const g2 = FX.get(); if (g2) Object.assign(g2, { kind: 'fire', S: p.S, big: p.evoFire, x: p.x, y: p.y, t: 0, dur: p.fireDur, dps: p.dmg * 0.8, R: p.lob.R * 0.8 * p.fireR, vx: 0 }); } continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.ang += p.spin * dt; continue; }
    if (p.life <= 0) { p.alive = false; continue; }
    if (p.boomer) { if (p.t > p.boomer / 260) { const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy) || 1; p.vx = dx / d * (p.bspd || 300) * 1.15; p.vy = dy / d * (p.bspd || 300) * 1.15; if (d < 10) { p.alive = false; continue; } } }
    if (p.homing) { const n = nearestEnemy(250, p); if (n) { const a = Math.atan2(n.y - p.y, n.x - p.x), c = Math.atan2(p.vy, p.vx); let da = Math.atan2(Math.sin(a - c), Math.cos(a - c)); const na = c + Math.max(-5 * dt, Math.min(5 * dt, da)); p.vx = Math.cos(na) * p.spd; p.vy = Math.sin(na) * p.spd; } }
    p.x += p.vx * dt; p.y += p.vy * dt; p.ang = p.rotTo || p.homing ? Math.atan2(p.vy, p.vx) : p.ang + p.spin * dt;
    if (p.bounce) { const L = P.x - W / 2, R = P.x + W / 2, T = P.y - H / 2, B = P.y + H / 2;
      if (p.x < L + 6) { p.x = L + 6; p.vx = Math.abs(p.vx); } if (p.x > R - 6) { p.x = R - 6; p.vx = -Math.abs(p.vx); }
      if (p.y < T + 6) { p.y = T + 6; p.vy = Math.abs(p.vy); } if (p.y > B - 6) { p.y = B - 6; p.vy = -Math.abs(p.vy); } }
    if (p.team === 1) { if (dist2(p, P) < (p.r + PLAYER_R) ** 2) { hurt(p.dmg); p.alive = false; } else if (dist2(p, P) > (W * 1.2) ** 2) p.alive = false; continue; }
    for (const e of ENE.items) { if (!e.alive) continue; if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < (e.r + p.r) ** 2) {
      const id = 'p' + PROJ.items.indexOf(p); if (e.hits[id] > G.t) continue; e.hits[id] = G.t + (p.hitCd || 99);
      damage(e, p.dmg, null, p.w === 'tarjeta' ? 40 : 90, p.x, p.y); if (p.explode) explodeAt(p.x, p.y, p.explode, p.dmg * 0.6, p.S, p.S && p.S.chain ? 3 : 0);
      if (p.foodOnHit && Math.random() < p.foodOnHit && foodCount() < D.food.maxOnScreen) { const q = PICK.get(); if (q) Object.assign(q, { kind: 'food_caramelo', food: 'caramelo', x: p.x, y: p.y, v: 0, mag: false, life: D.food.despawn }); } p.pierce--; if (p.pierce <= 0) { p.alive = false; break; } } }
  }
}
function fxUpdate(dt) { for (const f of FX.items) if (f.alive) { f.t += dt; CURS = f.S || null; if (f.vx) { f.x += f.vx * dt; f.y += f.vy * dt; }
  if (f.kind === 'fire') for (const e of ENE.items) if (e.alive && dist2(e, f) < (f.R + e.r) ** 2) damage(e, f.dps * dt, null, 0);
  if (f.kind === 'puddle') for (const e of ENE.items) if (e.alive && dist2(e, f) < (16 + e.r) ** 2) damage(e, f.dps * dt, null, 0);
  if (f.kind === 'strike' && !f.done && f.t >= 0.35) { f.done = true; for (const e of ENE.items) if (e.alive && dist2(e, f) < (f.R + e.r) ** 2) damage(e, f.dmg, null, 60, f.x, f.y); if (f.tip) drop('tip', f.x, f.y, 1); sfx('hit'); }
  if (f.t >= f.dur) f.alive = false; } CURS = null; }
function eat(P, id) { const it = D.food.items[id]; P.hp = Math.min(P.maxHp, P.hp + P.maxHp * it.heal * P.heal); G.ate[id] = (G.ate[id] || 0) + 1; sfx('key');
  if (it.magnet) G.magnetT = it.magnet; const f = FX.get(); if (f) Object.assign(f, { kind: 'num', x: P.x, y: P.y - 20, t: 0, dur: 0.8, v: '+' + Math.round(P.maxHp * it.heal * P.heal) + ' ' + it.name, col: '#3fdc5a', vx: 0 }); }
function pickUpdate(dt) {
  const P = G.p; G.magnetT -= dt;
  for (const k of PICK.items) { if (!k.alive) continue; if (k.food) { k.life -= dt; if (k.life <= 0) { k.alive = false; continue; } }
    const d2 = dist2(k, P); if (d2 < P.pickup * P.pickup || (G.magnetT > 0 && !k.food)) k.mag = true;
    if (k.mag) { const dx = P.x - k.x, dy = P.y - k.y, d = Math.hypot(dx, dy) || 1; k.x += dx / d * (G.magnetT > 0 ? 420 : 260) * dt; k.y += dy / d * (G.magnetT > 0 ? 420 : 260) * dt;
      if (d < 10) { k.alive = false; if (k.food) eat(P, k.food); else if (k.kind === 'key') { G.keys += k.v; sfx('key'); } else if (k.kind === 'chest') openChest(); else { G.xp += k.v * P.xpMul * (G.t >= D.run.xpLateFrom ? D.run.xpLateMul : 1); sfx('tip'); } } }
    else if (d2 > (W * 1.5) ** 2) k.alive = false;
  }
  if (G.xp >= G.xpNext && G.state === 'play') levelUp();
}

// ---------------- level up -------------
function weaponAvailable(id) { const r = D.weapons[id].requiresChar; return !r || META.unlocked[r] || G.char.id === r; }
function slotsOpen() { return D.run.slotsStart + D.run.slotOpenLevels.filter(l => G.lvl >= l).length; }
function upgradePool() { const out = [], sl = slotsOpen(), LR = D.levelRules;
  for (const id in D.weapons) { if (!weaponAvailable(id) || G.banished['w:' + id]) continue; const w = G.weapons.find(w => w.id === id); if (w ? w.lvl < LR.maxLevel : G.weapons.length < sl) out.push({ kind: 'w', id, lvl: w ? w.lvl + 1 : 1 }); }
  for (const id in D.passives) { const P = D.passives[id]; if (G.banished['p:' + id] || (!P.core && G.lvl < D.run.nonCorePassiveFromLevel)) continue; const p = G.passives.find(p => p.id === id); if (p ? p.lvl < (P.maxLevel || 5) : G.passives.length < sl) out.push({ kind: 'p', id, lvl: p ? p.lvl + 1 : 1 }); }
  return out; }
function nChoices() { return G.char.id === 'gerente' ? D.run.choicesGerente : D.run.choices; }
function rollChoices() { const pool = upgradePool(); const c = []; while (c.length < nChoices() && pool.length) c.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  if (!c.length) c.push({ kind: 'heal' }, { kind: 'keys' }); G.choices = c; }
function levelUp() { G.xp -= G.xpNext; G.lvl++; G.xpNext = Math.floor(5 + G.lvl * 4 + G.lvl * G.lvl * 0.35); G.state = 'levelup'; G.banishMode = false; rollChoices(); sfx('lvl');
  if (D.run.slotOpenLevels.includes(G.lvl)) G.banner = { s: '¡NUEVO SLOT! (' + slotsOpen() + '+' + slotsOpen() + ')', t: 2.5 }; }
function applyChoice(c) { if (c.kind === 'w') addWeapon(c.id); else if (c.kind === 'p') addPassive(c.id); else if (c.kind === 'heal') G.p.hp = G.p.maxHp; else G.keys += 2; }
function choose(i) { const c = G.choices && G.choices[i]; if (!c) return;
  if (G.banishMode) { if (c.kind === 'w' || c.kind === 'p') { G.banished[c.kind + ':' + c.id] = 1; G.banishLeft--; G.banishMode = false; const pool = upgradePool().filter(o => !G.choices.some(x => x.kind === o.kind && x.id === o.id));
      if (pool.length) G.choices[i] = pool[Math.floor(Math.random() * pool.length)]; else G.choices.splice(i, 1); if (!G.choices.length) rollChoices(); sfx('hurt'); } return; }
  applyChoice(c); G.choices = null; G.state = 'play'; if (G.xp >= G.xpNext) levelUp(); }
function reroll() { if (G.rerolls > 0) { G.rerolls--; rollChoices(); sfx('tip'); } }
function toggleBanish() { if (G.banishLeft > 0) G.banishMode = !G.banishMode; }
function openChest() { const n = Math.random() < D.run.chest.tripleChance + (G.p.chestExtra || 0) ? 3 : 1, got = []; G.chestsOpened++;
  for (let i = 0; i < n; i++) { const pool = upgradePool(); if (!pool.length) { G.keys += 3; got.push('+3 llaves'); continue; } const owned = pool.filter(o => o.kind === 'w' && o.lvl > 1); const list = owned.length && Math.random() < 0.6 ? owned : pool; const c = list[Math.floor(Math.random() * list.length)];
    applyChoice(c); got.push(upLabel(c)[0]); }
  G.banner = { s: '🎁 Cofre' + (n === 3 ? ' x3' : '') + ': ' + got.join(', ').slice(0, 60), t: 3 }; sfx('win'); }

// ---------------- achievements / end -------------
function achMet(c) { const runK = G.committed ? 0 : G.kills, runKar = G.committed ? 0 : G.karens;
  if (c.surviveSec) return G.t >= c.surviveSec; if (c.kill) return (G.killed[c.kill] || 0) > 0; if (c.win) return !!G.win; if (c.totalKills) return META.totalKills + runK >= c.totalKills;
  if (c.runKills) return G.kills >= c.runKills; if (c.evolveAny) return G.evolved.length > 0; if (c.evolve) return G.evolved.includes(c.evolve); if (c.eat) return (G.ate[c.eat] || 0) > 0;
  if (c.karens) return META.stats.karens + runKar >= c.karens; if (c.winAs) return !!G.win && G.char.id === c.winAs; if (c.fullBuild) return G.weapons.length >= 4 && G.passives.length >= 4;
  if (c.wins) return META.wins >= c.wins;
  if (c.evolveCount) return G.evolved.length >= c.evolveCount; if (c.winMinHp) return !!G.win && G.minHpFrac >= c.winMinHp; if (c.winNoFood) return !!G.win && !Object.keys(G.ate).length;
  if (c.duenoUnder) return G.duenoKillTime != null && G.duenoKillTime < c.duenoUnder; if (c.winKills) return !!G.win && G.kills >= c.winKills;
  if (c.allUnlocked) return D.characters.filter(ch => ch.unlock).every(ch => META.unlocked[ch.id]); return false; }
function checkAch() { for (const a of D.achievements) if (!META.ach[a.id] && achMet(a.cond)) { const had = { ...META.unlocked }; grantAch(a.id); G.achNow.push(a.name);
  if (a.reward.unlock && !had[a.reward.unlock]) G.unlockedNow.push(D.characters.find(c => c.id === a.reward.unlock).name); } }
function endRun(win) {
  if (!G || G.state === 'over') return; G.state = 'over'; G.win = win;
  const kg = Math.round(G.keys * G.p.keyMul); G.keysFinal = kg; META.keys += kg; META.stats.lifetimeKeys += kg; META.totalKills += G.kills; META.stats.karens += G.karens; META.bestTime = Math.max(META.bestTime, G.t);
  if (win) { META.wins++; META.stats.winsAs[G.char.id] = (META.stats.winsAs[G.char.id] || 0) + 1; } G.committed = true;
  checkAch(); saveMeta(); if (!win) sfx('lose');
}

// ---------------- update -------------
// Input as data: each player reads a slot. Slot 0 = keyboard + touch joystick. Future co-op: add slots (gamepad/second keyboard set).
function readInput(slot) {
  let mx = 0, my = 0; if (slot !== 0) return { mx, my };
  if (keys.KeyA || keys.ArrowLeft) mx--; if (keys.KeyD || keys.ArrowRight) mx++; if (keys.KeyW || keys.ArrowUp) my--; if (keys.KeyS || keys.ArrowDown) my++;
  if (JOY.active) { const dx = JOY.x - JOY.sx, dy = JOY.y - JOY.sy, d = Math.hypot(dx, dy); if (d > 3) { const m = Math.min(1, d / 30); mx = dx / d * m; my = dy / d * m; } }
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; } return { mx, my };
}
function update(dt) {
  if (screen !== 'play' || G.state !== 'play') return;
  G.t += dt;
  for (const P of G.players) {
    const { mx, my } = P.input = readInput(P.inputSlot); const ml = Math.hypot(mx, my);
    if (ml > 0.01) { P.fx = mx / ml; P.fy = my / ml; P.moving = true; } else P.moving = false;
    P.x += (mx * P.speed + P.kbx) * dt; P.y += (my * P.speed + P.kby) * dt; P.kbx *= Math.pow(0.001, dt); P.kby *= Math.pow(0.001, dt);
    P.anim += dt; P.inv -= dt; const bb = G.char.bonus; let rg = P.regen; if (bb.regenPctStill) rg += P.maxHp * (P.moving ? bb.regenPctMoving : bb.regenPctStill); P.hp = Math.min(P.maxHp, P.hp + rg * dt);
    if (bb.trail && P.moving) { G.trailT -= dt; if (G.trailT <= 0) { G.trailT = bb.trail.every; const f = FX.get(); if (f) Object.assign(f, { kind: 'fire', trail: true, x: P.x, y: P.y + 6, t: 0, dur: bb.trail.dur, dps: bb.trail.dps, R: bb.trail.r, vx: 0 }); } }
  }
  G.shake -= dt;
  spawning(dt); weaponsUpdate(dt); projUpdate(dt); enemiesUpdate(dt); pickUpdate(dt); fxUpdate(dt);
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  if (G.state === 'play') checkAch();
}

// ---------------- render helpers -------------
function draw(spr, x, y, flip, s = 1) { const w = spr.width * s, h = spr.height * s; if (flip) { ctx.save(); ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(spr, Math.round(-w / 2), Math.round(y - h / 2), w, h); ctx.restore(); } else ctx.drawImage(spr, Math.round(x - w / 2), Math.round(y - h / 2), w, h); }
const SHEET = {};
function loadSheets() { const S = window.SPRITE_SHEETS || {}; return Promise.all(Object.keys(S).map(k => new Promise(res => { const img = new Image();
  img.onload = () => { SHEET[k] = { img, fs: S[k].fs, fw: S[k].fw || S[k].fs, n: S[k].frames, ax: S[k].anchor[0], ay: S[k].anchor[1] }; res(); }; img.onerror = () => res(); img.src = S[k].src; }))); }
function buildExtraSprites() {
  SPR.chest = mk(16, 14, p => { p(0, 3, 16, 11, '#7a4a1e'); p(1, 4, 14, 9, '#c99a4a'); p(0, 3, 16, 3, '#ffd23f'); p(7, 6, 2, 4, '#ffd23f'); });
  SPR.wrench = mk(16, 16, p => { p(2, 2, 5, 5, '#9aa4ad'); p(3, 3, 2, 2, '#1a1020'); p(6, 6, 3, 3, '#9aa4ad'); p(8, 8, 3, 3, '#9aa4ad'); p(10, 10, 4, 4, '#6b737a'); });
  SPR.linterna = mk(16, 16, p => { p(2, 6, 8, 5, '#333'); p(10, 5, 4, 7, '#c9a227'); p(14, 6, 2, 5, '#fff7b0'); });
  for (const k of ['billete', 'cuchillo', 'memo', 'botella', 'piedra_caliente']) if (!SPR[k]) SPR[k] = SPR.tarjeta;
}
// frame order (humans): 0 idle0, 1 idle1, 2-5 walk0-3. Art faces right; flip for left.
function animFrame(moving, t) { return moving ? 2 + Math.floor(t * 8) % 4 : Math.floor(t * 2.5) % 2; }
// draw anchored by FOOT point (art/README "Foot anchor"); code-gen fallback is centered 13px above the feet
function drawAnim(key, x, footY, frame, flip, s = 1) { const sh = SHEET[key]; if (!sh) { const sp = SPR[key] || SPR.pl_recep; return draw(sp, x, footY - (sp.height / 2 - 3) * s, flip, s); }
  ctx.save(); ctx.translate(Math.round(x), Math.round(footY)); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sh.img, (frame % sh.n) * sh.fw, 0, sh.fw, sh.fs, -sh.ax * s, -sh.ay * s, sh.fw * s, sh.fs * s); ctx.restore(); }
// centered sprite (projectiles/fx/food), optional rotation, animated at ~8fps
function drawSpr(key, x, y, ang = 0, t = 0, s = 1) { const sh = SHEET[key]; ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (ang) ctx.rotate(ang);
  if (sh) ctx.drawImage(sh.img, (Math.floor(t * 8) % sh.n) * sh.fw, 0, sh.fw, sh.fs, -sh.ax * s, -sh.ay * s, sh.fw * s, sh.fs * s);
  else { const sp = SPR[key]; if (sp) ctx.drawImage(sp, -sp.width * s / 2, -sp.height * s / 2, sp.width * s, sp.height * s); } ctx.restore(); }
const ICON = { llave_inglesa: 'wrench', linterna: 'linterna', cuchillos: 'cuchillo', memo: 'memo', billetes: 'billete', botella: 'botella', silbato: 'onda_silbato', piedras: 'piedra_caliente', baston: 'arco_baston', auto: 'auto' };
function weaponIcon(w) { const B = D.weapons[w.id]; return w.evo ? B.evo.spr : (ICON[w.id] || w.id); }
function drawIcon(key, x, y, size) { const sh = SHEET[key]; const sw = sh ? sh.fw : (SPR[key] || SPR.tip).width, shh = sh ? sh.fs : (SPR[key] || SPR.tip).height; const s = size / Math.max(sw, shh);
  if (sh) ctx.drawImage(sh.img, 0, 0, sh.fw, sh.fs, x + (size - sw * s) / 2, y + (size - shh * s) / 2, sw * s, shh * s); else if (SPR[key]) ctx.drawImage(SPR[key], x + (size - sw * s) / 2, y + (size - shh * s) / 2, sw * s, shh * s); }
function playerKey(charId, cos) { return cos && SHEET['cos_' + cos] ? 'cos_' + cos : 'pl_' + charId; }
function fmt(t) { t = Math.max(0, t); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0'); }
function footOf(e) { const b = e.d.behavior; return b === 'boss' || b === 'dueno' ? e.y + e.r * 0.8 : b === 'line' || b === 'ghost' ? e.y + e.r + 4 : e.y + e.r * 0.8; }

function renderWorld() {
  const P = G.p; let cx = Math.round(P.x - W / 2), cy = Math.round(P.y - H / 2);
  if (G.shake > 0) { cx += Math.round(rnd(-2, 2)); cy += Math.round(rnd(-2, 2)); }
  const ox = -(((cx % 64) + 64) % 64), oy = -(((cy % 64) + 64) % 64);
  for (let y = oy; y < H; y += 64) for (let x = ox; x < W; x += 64) { ctx.drawImage(SPR.tile, x, y);
    const tx = Math.floor((x + cx) / 64), ty = Math.floor((y + cy) / 64); if (((tx * 73856093) ^ (ty * 19349663)) % 11 === 0) ctx.drawImage(SPR.plant, x + 2, y + 2); }
  if (G.t >= TLd().highSeason && !(G.boss && G.boss.alive)) { ctx.fillStyle = 'rgba(255,120,40,.07)'; ctx.fillRect(0, 0, W, H); }
  ctx.save(); ctx.translate(-cx, -cy);
  for (const f of FX.items) if (f.alive && f.kind === 'puddle') { ctx.globalAlpha = 1 - f.t / f.dur * 0.6; drawSpr('charco', f.x, f.y, 0, f.t); ctx.globalAlpha = 1; }
  for (const f of FX.items) if (f.alive && f.kind === 'fire' && f.trail) { ctx.fillStyle = `rgba(255,215,64,${0.35 * (1 - f.t / f.dur)})`; ctx.fillRect(f.x - 4, f.y - 2, 8, 4); }
  for (const f of FX.items) if (f.alive && f.kind === 'fire' && !f.trail) { const sh = SHEET.llama_piso; if (sh) { ctx.globalAlpha = Math.min(1, (f.dur - f.t) * 2); const fk = f.big && SHEET.fx_barra_libre_fuego ? 'fx_barra_libre_fuego' : 'llama_piso'; for (let i = 0; i < 3; i++) drawAnim(fk, f.x + (i - 1) * f.R * 0.6, f.y + 6, Math.floor((f.t + i * 0.3) * 8), false); ctx.globalAlpha = 1; } else { ctx.fillStyle = 'rgba(255,120,0,.4)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.R, 0, 7); ctx.fill(); } }
  for (const k of PICK.items) if (k.alive) { const blink = k.food && k.life < 4 && Math.floor(k.life * 6) % 2; if (blink) continue;
    if (k.food) drawSpr(k.kind, k.x, k.y + Math.sin(G.t * 4 + k.x) * 1.5); else draw(SPR[k.kind], k.x, k.y + Math.sin(G.t * 5 + k.x) * 1.5); }
  for (const f of FX.items) if (f.alive && f.kind === 'ring') { const k = f.t / f.dur, R = f.r * (0.3 + 0.7 * k);
    if (f.spr && SHEET[f.spr]) { ctx.globalAlpha = 1 - k; drawSpr(f.spr, P.x, P.y, 0, k * 0.24, R / 16); ctx.globalAlpha = 1; }
    else { ctx.strokeStyle = f.evo ? `rgba(255,240,140,${1 - k})` : `rgba(242,194,48,${1 - k})`; ctx.lineWidth = f.evo ? 5 : 3; ctx.beginPath(); ctx.arc(P.x, P.y, R, 0, 7); ctx.stroke(); if (f.evo) { ctx.globalAlpha = 1 - k; drawSpr('evo_campana', P.x, P.y - 26, 0, 0); ctx.globalAlpha = 1; } } }
  for (const w of G.weapons) { const B = D.weapons[w.id], S = WS(w);
    if (B.type === 'spray') { const half = S.angle360 ? Math.PI : S.angle; ctx.fillStyle = w.evo ? 'rgba(120,255,140,.12)' : 'rgba(120,220,255,.14)'; ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.arc(P.x, P.y, S.range, w.ang - half, w.ang + half); ctx.fill(); }
    if (B.type === 'beam') { ctx.fillStyle = 'rgba(255,247,176,.22)'; ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.arc(P.x, P.y, S.range, w.ang - S.angle, w.ang + S.angle); ctx.fill(); } }
  // Dueño telegraph
  const bo = G.boss; if (bo && bo.alive && bo.st === 'tele') { ctx.strokeStyle = `rgba(255,30,30,${0.4 + 0.4 * Math.sin(G.t * 30)})`; ctx.lineWidth = bo.r * 1.4; ctx.beginPath(); ctx.moveTo(bo.x, bo.y); ctx.lineTo(bo.x + bo.dx * 300, bo.y + bo.dy * 300); ctx.stroke(); txt('!', bo.x, bo.y - 70, 16, '#ff3030', 'center'); }
  const list = ENE.items.filter(e => e.alive).sort((a, b) => a.y - b.y);
  for (const e of list) { const key = 'e_' + e.type, fy = footOf(e); let fr = animFrame(true, G.t + e.ph);
    if (e.type === 'dueno') fr = e.st === 'dash' || e.st === 'tele' ? 5 + Math.floor(G.t * 8) % 2 : e.atkT > 0 ? 2 + Math.floor(G.t * 10) % 3 : Math.floor(G.t * 2.5) % 2;
    const flip = e.vx < 0; if (e.d.behavior === 'ghost') ctx.globalAlpha = 0.6 + 0.2 * Math.sin(G.t * 4 + e.ph);
    drawAnim(key, e.x, fy, fr, flip); ctx.globalAlpha = 1;
    if (e.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; drawAnim(key, e.x, fy, fr, flip); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    if (e.d.elite) { ctx.fillStyle = '#300'; ctx.fillRect(e.x - 14, fy - 34, 28, 3); ctx.fillStyle = '#ff3df5'; ctx.fillRect(e.x - 14, fy - 34, 28 * Math.max(0, e.hp / e.maxHp), 3); } }
  for (const Q of G.players) { const blink = Q.inv > 0 && Math.floor(Q.inv * 20) % 2; if (!blink) drawAnim(playerKey(Q.charId, Q.costume), Q.x, Q.y + 8, animFrame(Q.moving, Q.anim), Q.fx < 0);
    ctx.fillStyle = '#300'; ctx.fillRect(Q.x - 12, Q.y + 12, 24, 3); ctx.fillStyle = '#3fdc5a'; ctx.fillRect(Q.x - 12, Q.y + 12, 24 * Q.hp / Q.maxHp, 3); }
  for (const w of G.weapons) { const S = WS(w); if (S.auraR) { const key = w.id === 'piedras' ? 'fx_sauna_vapor' : 'fx_charco_hielo';
      ctx.globalAlpha = 0.35; ctx.fillStyle = w.id === 'piedras' ? 'rgba(255,160,90,.25)' : 'rgba(120,200,255,.25)'; ctx.beginPath(); ctx.arc(P.x, P.y, S.auraR, 0, 7); ctx.fill();
      for (let i = 0; i < 6; i++) { const a = G.t * 0.6 + i * 1.05; drawSpr(w.id === 'piedras' ? 'fx_sauna_vapor' : 'proj_burbuja', P.x + Math.cos(a) * S.auraR * 0.6, P.y + Math.sin(a) * S.auraR * 0.6, 0, G.t); } ctx.globalAlpha = 1; }
    if (D.weapons[w.id].type === 'drone' && w.pos) for (const q of w.pos) drawSpr('proj_dron', q.x, q.y, 0, G.t); }
  for (const w of G.weapons) if (D.weapons[w.id].type === 'sarten' && w.pos) for (const q of w.pos) { if (w.evo) drawSpr('evo_olla', q.x, q.y, q.a * 2, 0, 0.75); else { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a * 2); ctx.drawImage(SPR.sarten, -8, -8); ctx.restore(); } }
  for (const p of PROJ.items) if (p.alive) { const ar = p.lob ? Math.sin(Math.PI * p.t / 0.6) * 30 : 0; drawSpr(p.spr, p.x, p.y - ar, p.ang || 0, p.t); }
  for (const f of FX.items) if (f.alive) { const k = f.t / f.dur;
    if (f.kind === 'poof') { ctx.fillStyle = `rgba(255,255,255,${1 - k})`; for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.fillRect(f.x + Math.cos(a) * 12 * k - 1, f.y + Math.sin(a) * 12 * k - 1, 3, 3); } }
    if (f.kind === 'mist') { ctx.fillStyle = `rgba(170,235,255,${0.7 * (1 - k)})`; ctx.fillRect(f.x - 2, f.y - 2, 4, 4); }
    if (f.kind === 'cloud') { ctx.globalAlpha = 0.6 * (1 - k); drawSpr('evo_nube', f.x, f.y, 0, 0, 0.6); ctx.globalAlpha = 1; }
    if (f.kind === 'xpl') { if (SHEET.fx_despido_explosion) drawSpr(f.S && f.S.chain ? 'fx_despido_explosion' : 'fx_burbuja_explosion', f.x, f.y, 0, k * 0.37, f.r / 14); else { ctx.fillStyle = `rgba(255,220,120,${0.6 * (1 - k)})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); } }
    if (f.kind === 'nova') { ctx.strokeStyle = `rgba(160,230,255,${1 - k})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * k, 0, 7); ctx.stroke(); ctx.globalAlpha = 0.5 * (1 - k); drawSpr('fx_charco_hielo', f.x, f.y, 0, 0, f.r / 16); ctx.globalAlpha = 1; }
    if (f.kind === 'whip') { if (SHEET.fx_latigazo_toalla) { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang); const sh = SHEET.fx_latigazo_toalla, s = f.r / 48; ctx.drawImage(sh.img, (k > 0.5 ? 1 : 0) * sh.fw, 0, sh.fw, sh.fs, 0, -8 * s, sh.fw * s, sh.fs * s); ctx.restore(); } }
    if (f.kind === 'boom') { ctx.fillStyle = `rgba(255,200,80,${0.6 * (1 - k)})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.5 + k * 0.5), 0, 7); ctx.fill(); }
    if (f.kind === 'strike') { if (!f.done) { ctx.strokeStyle = 'rgba(80,255,120,.6)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.R, 0, 7); ctx.stroke(); drawSpr(f.spr || 'billete', f.x, f.y - (1 - f.t / 0.35) * 60, f.t * 8, f.t); } else { ctx.fillStyle = `rgba(80,255,120,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.R, 0, 7); ctx.fill(); } }
    if (f.kind === 'arc' && f.full) { ctx.globalAlpha = 1 - k * 0.5; drawSpr('fx_porton_golpe', f.x, f.y, 0, k * 0.24, f.r / 32); ctx.globalAlpha = 1; }
    else if (f.kind === 'arc' && f.spr === 'fx_arco_plumero' && SHEET.fx_arco_plumero) { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang); const sh = SHEET.fx_arco_plumero, s = f.r / 28; ctx.drawImage(sh.img, (k > 0.5 ? 1 : 0) * sh.fw, 0, sh.fw, sh.fs, -4 * s, -16 * s, sh.fw * s, sh.fs * s); ctx.restore(); }
    else if (f.kind === 'arc') { if (SHEET.arco_baston) { ctx.globalAlpha = 1 - k * 0.5; drawSpr('arco_baston', f.x + Math.cos(f.ang) * f.r * 0.5, f.y + Math.sin(f.ang) * f.r * 0.5, f.ang, k * 0.24, f.r / 24); ctx.globalAlpha = 1; } }
    if (f.kind === 'num') { ctx.globalAlpha = 1 - k; txt(String(f.v), f.x, f.y - k * 10, 7, f.col || '#fff', 'center'); ctx.globalAlpha = 1; } }
  ctx.restore();
  if (JOY.active) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(JOY.sx, JOY.sy, 30, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; const dx = JOY.x - JOY.sx, dy = JOY.y - JOY.sy, d = Math.min(30, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); ctx.beginPath(); ctx.arc(JOY.sx + Math.cos(a) * d, JOY.sy + Math.sin(a) * d, 12, 0, 7); ctx.fill(); }
}
function renderHUD() {
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, 6); ctx.fillStyle = '#3fbf5a'; ctx.fillRect(0, 0, W * Math.min(1, G.xp / G.xpNext), 6);
  txt('NV ' + G.lvl, 4, 16, 8); txt(fmt(G.t), W / 2, 20, 14, G.t >= TLd().highSeason ? '#ff8040' : '#fff', 'center');
  const ph = phaseName(); if (ph) txt(ph, W / 2, 30, 7, ph === 'RESPIRO' ? '#7fe0ff' : '#ff8040', 'center');
  txt('☠ ' + G.kills, 4, 28, 8, '#ddd'); txt('🔑 ' + G.keys, 4, 40, 8, '#ffd23f');
  const sl = slotsOpen(), lockLv = D.run.slotOpenLevels, bs = 16;
  for (let row = 0; row < 2; row++) { const arr = row === 0 ? G.weapons : G.passives, y = H - 4 - (2 - row) * (bs + 2);
    for (let i = 0; i < D.run.slotsMax; i++) { const x = 4 + i * (bs + 2), it = arr[i];
      if (i >= sl && !it) { const lk = 'ui_slot_candado_nv' + lockLv[i - D.run.slotsStart]; if (SHEET[lk]) drawIcon(lk, x, y, bs); else { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y, bs, bs); txt(String(lockLv[i - D.run.slotsStart]), x + bs / 2, y + 11, 5, '#888', 'center'); } continue; }
      ctx.fillStyle = it && it.evo ? 'rgba(120,80,0,.7)' : 'rgba(0,0,0,.5)'; ctx.fillRect(x, y, bs, bs); if (!it) continue;
      if (row === 0) { drawIcon(weaponIcon(it), x, y, bs); if (it.lvl >= 8) { if (SHEET.ui_maestria) drawIcon('ui_maestria', x + bs - 8, y - 2, 8); ctx.strokeStyle = '#ffd23f'; ctx.strokeRect(x + .5, y + .5, bs - 1, bs - 1); } }
      else drawIcon(D.passives[it.id].icon || ('ic_' + it.id), x, y, bs);
      txt(String(it.lvl), x + bs - 3, y + bs - 1, 5, '#ffd23f'); } }
  const bb = (G.boss && G.boss.alive) ? G.boss : (G.mini && G.mini.alive ? G.mini : null);
  if (bb) { const bw = Math.min(260, W - 40); ctx.fillStyle = '#300'; ctx.fillRect(W / 2 - bw / 2, 34, bw, 6); ctx.fillStyle = bb === G.boss ? '#d4af37' : '#ff2a2a'; ctx.fillRect(W / 2 - bw / 2, 34, bw * bb.hp / bb.maxHp, 6);
    txt(bb.d.name.toUpperCase() + (bb === G.boss ? ' · FASE ' + (bb.phase || 1) : ''), W / 2, 50, 7, '#ffb080', 'center'); }
  if (G.banner) txt(G.banner.s, W / 2, H / 3, 12, '#ffd23f', 'center');
  btn(W - 26, 10, 20, 20, 'II', () => togglePause(), { size: 9 });
}
function renderToasts(dt) { let y = 60; for (const a of achToast) { a.t -= dt; ctx.fillStyle = 'rgba(20,10,30,.85)'; ctx.fillRect(W - 170, y, 164, 26); ctx.strokeStyle = '#ffd23f'; ctx.strokeRect(W - 169.5, y + .5, 163, 25);
  txt(a.s, W - 164, y + 11, 7, '#ffd23f'); txt(a.sub, W - 164, y + 21, 5, '#ddd'); y += 30; } achToast = achToast.filter(a => a.t > 0); }
function overlay(a = 0.7) { ctx.fillStyle = `rgba(10,6,16,${a})`; ctx.fillRect(0, 0, W, H); }
function upLabel(c) { if (c.kind === 'heal') return ['Botiquín', 'Cura toda la vida', 'food_buffet']; if (c.kind === 'keys') return ['Llavero', '+2 llaves', 'key'];
  if (c.kind === 'w') { const S = D.weapons[c.id], LR = D.levelRules; if (c.lvl === LR.evoLevel && S.evo) return ['→ ' + S.evo.name, '¡EVOLUCIONA al nivel 5!', S.evo.spr];
    const owned = G.weapons.find(w => w.id === c.id), nm = owned && owned.evo ? S.evo.name : S.name, ic = owned && owned.evo ? S.evo.spr : (S.icon || c.id);
    const lvTxt = { 2: 'Efecto A', 3: '+20% daño', 4: 'Efecto B', 6: '+25% daño', 7: '+1 proyectil / +20% área', 8: 'MAESTRÍA: -20% enfriamiento' }[c.lvl];
    return [nm + (c.lvl > 1 ? ' Nv' + c.lvl : ' (NUEVA)'), c.lvl > 1 ? (lvTxt || 'Mejora') : S.desc, ic]; }
  const S = D.passives[c.id]; return [S.name + (c.lvl > 1 ? ' Nv' + c.lvl : ' (NUEVO)'), S.desc, S.icon || ('ic_' + c.id)]; }
function renderLevelUp() { overlay(); txt(G.banishMode ? 'ELEGÍ UNA OPCIÓN PARA DESCARTAR' : '¡SUBISTE DE NIVEL!', W / 2, 36, 12, G.banishMode ? '#ff6060' : '#ffd23f', 'center');
  const n = G.choices.length, cw = Math.min(140, (W - 24) / n - 6), ch = 92, y = H / 2 - 54;
  G.choices.forEach((c, i) => { const x = W / 2 + (i - (n - 1) / 2) * (cw + 6) - cw / 2; const [nm, d, ic] = upLabel(c);
    buttons.push({ x, y, w: cw, h: ch, fn: () => choose(i) });
    ctx.fillStyle = '#2a2140'; ctx.fillRect(x, y, cw, ch); ctx.strokeStyle = G.banishMode ? '#ff6060' : nm.startsWith('→') ? '#ff7bc2' : '#f2c230'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, cw - 1, ch - 1);
    drawIcon(ic, x + cw / 2 - 16, y + 6, 32); txt(nm.length > 24 ? nm.slice(0, 23) + '.' : nm, x + cw / 2, y + 50, 6, '#fff', 'center'); txt(d.length > 28 ? d.slice(0, 27) + '.' : d, x + cw / 2, y + 63, 5, '#bbb', 'center'); txt('[' + (i + 1) + ']', x + cw / 2, y + 84, 7, '#f2c230', 'center'); });
  const by = y + ch + 12;
  btn(W / 2 - 110, by, 104, 18, 'Reroll (' + G.rerolls + ') [R]', reroll, { disabled: G.rerolls <= 0 }); if (SHEET.ui_btn_reroll) drawIcon('ui_btn_reroll', W / 2 - 128, by, 18);
  btn(W / 2 + 6, by, 104, 18, 'Descartar (' + G.banishLeft + ') [X]', toggleBanish, { disabled: G.banishLeft <= 0, hl: G.banishMode }); if (SHEET.ui_btn_descarte) drawIcon('ui_btn_descarte', W / 2 + 112, by, 18);
  txt('Slots: ' + G.weapons.length + '/' + slotsOpen() + ' armas · ' + G.passives.length + '/' + slotsOpen() + ' pasivos', W / 2, by + 32, 6, '#aaa', 'center'); }
function renderPause() { overlay(); txt('PAUSA', W / 2, H / 2 - 30, 16, '#fff', 'center'); btn(W / 2 - 50, H / 2 - 10, 100, 20, 'Seguir [Esc]', togglePause);
  btn(W / 2 - 50, H / 2 + 16, 100, 20, 'Abandonar', () => { G.state = 'play'; endRun(false); }); btn(W / 2 - 50, H / 2 + 42, 100, 20, 'Sonido: ' + (AU.on ? 'ON' : 'OFF'), () => { AU.on = !AU.on; if (AU.mus) AU.mus.gain.value = AU.on ? 0.18 : 0; }); }
function renderSummary() { overlay(0.8); txt(G.win ? '¡EL HOTEL ES TUYO!' : 'TE DIERON DE BAJA', W / 2, 46, 16, G.win ? '#3fdc5a' : '#ff6060', 'center');
  txt('Tiempo: ' + fmt(G.t), W / 2, 72, 10, '#fff', 'center'); txt('Kills: ' + G.kills, W / 2, 88, 10, '#fff', 'center'); txt('Llaves ganadas: ' + G.keysFinal + '  (total ' + META.keys + ')', W / 2, 104, 10, '#ffd23f', 'center');
  txt('Nivel ' + G.lvl + ' · ' + G.char.name + (G.evolved.length ? ' · evoluciones: ' + G.evolved.length : ''), W / 2, 120, 8, '#bbb', 'center');
  if (G.achNow.length) txt('Logros: ' + G.achNow.join(', ').slice(0, 90), W / 2, 136, 7, '#ffd23f', 'center');
  if (G.unlockedNow.length) txt('Desbloqueado: ' + G.unlockedNow.join(', '), W / 2, 150, 9, '#ff7bc2', 'center');
  btn(W / 2 - 110, 166, 105, 22, 'Otra run [Enter]', () => newRun(G.char.id), { hl: true }); btn(W / 2 + 5, 166, 105, 22, 'Menú [M]', () => { screen = 'menu'; G = null; }); }
function shopPrice(s) { const lv = META.shop[s.id]; return lv < s.price.length ? s.price[lv] : null; }
function costumesOf(cid) { return Object.keys(D.costumes).filter(k => D.costumes[k].char === cid && META.costumes[k]); }
function cycleCostume() { const c = META.sel, own = [null, ...costumesOf(c)]; const i = own.indexOf(META.costumeSel[c] || null); META.costumeSel[c] = own[(i + 1) % own.length]; if (!META.costumeSel[c]) delete META.costumeSel[c]; saveMeta(); }
function renderMenu() {
  ctx.fillStyle = '#1a1224'; ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) { ctx.globalAlpha = 0.25; ctx.drawImage(SPR.tile, x, y); ctx.globalAlpha = 1; }
  txt('CHECK-OUT CHAOS', W / 2, 24, 16, '#f2c230', 'center'); txt('v2 · Sobreviví 15 minutos de Temporada Alta', W / 2, 36, 6, '#ccc', 'center');
  txt('🔑 ' + META.keys + '   ☠ ' + META.totalKills + '   mejor ' + fmt(META.bestTime) + '   🏆 ' + Object.keys(META.ach).length + '/' + D.achievements.length, W / 2, 48, 7, '#ffd23f', 'center');
  const cs = D.characters, perRow = Math.ceil(cs.length / 2), cw = Math.min(64, (W - 16) / perRow - 4), chh = 66, y0 = 54;
  cs.forEach((c, i) => { const row = Math.floor(i / perRow), col = i % perRow, n = Math.min(perRow, cs.length - row * perRow);
    const x = W / 2 + (col - (n - 1) / 2) * (cw + 4) - cw / 2, y = y0 + row * (chh + 4), un = META.unlocked[c.id], sel = META.sel === c.id;
    buttons.push({ x, y, w: cw, h: chh, fn: () => { if (un) META.sel = c.id; else if (META.keys >= c.price) { META.keys -= c.price; META.unlocked[c.id] = true; META.sel = c.id; sfx('key'); } saveMeta(); } });
    ctx.fillStyle = sel ? '#3a2f5a' : '#241c33'; ctx.fillRect(x, y, cw, chh); ctx.strokeStyle = sel ? '#f2c230' : '#554'; ctx.strokeRect(x + .5, y + .5, cw - 1, chh - 1);
    ctx.globalAlpha = un ? 1 : 0.3; drawAnim(playerKey(c.id, META.costumeSel[c.id]), x + cw / 2, y + 44, animFrame(sel, performance.now() / 1000), false, 1.25); ctx.globalAlpha = 1;
    txt(c.name.length > 12 ? c.name.slice(0, 11) + '.' : c.name, x + cw / 2, y + 54, 5, '#fff', 'center');
    if (!un) txt('🔒 ' + c.price + '🔑', x + cw / 2, y + 63, 5, META.keys >= c.price ? '#3fdc5a' : '#ff7bc2', 'center'); else txt(D.weapons[c.weapon].name.slice(0, 14), x + cw / 2, y + 63, 4, '#f2c230', 'center'); });
  const sc = D.characters.find(c => c.id === META.sel) || cs[0]; let y = y0 + 2 * (chh + 4) + 4;
  txt(sc.name + ' — ' + D.weapons[sc.weapon].name + ' (' + D.weapons[sc.weapon].desc + ') · ' + sc.bonusText, W / 2, y + 6, 6, '#fff', 'center');
  if (!META.unlocked[sc.id] && sc.unlock) txt('Desbloqueo: ' + sc.unlock.text + ' o ' + sc.price + ' llaves', W / 2, y + 15, 6, '#ff7bc2', 'center');
  y += 20; let sx = W / 2 - 3 * 66 / 2;
  for (const s of D.shop) { const pr = shopPrice(s); btn(sx, y, 62, 16, pr == null ? s.name + ' MAX' : s.name + ' ' + pr + '🔑', () => { if (pr != null && META.keys >= pr) { META.keys -= pr; META.shop[s.id]++; saveMeta(); sfx('key'); } }, { size: 5, disabled: pr == null || META.keys < pr }); sx += 66; }
  y += 20; const own = costumesOf(META.sel), cur = META.costumeSel[META.sel];
  btn(W / 2 - 128, y, 124, 16, 'Traje: ' + (cur ? D.costumes[cur].name : 'Clásico') + (own.length ? ' [T]' : ' (sin trajes)'), cycleCostume, { size: 5, disabled: !own.length });
  btn(W / 2 + 4, y, 124, 16, 'Logros ' + Object.keys(META.ach).length + '/' + D.achievements.length + ' [L]', () => { screen = 'ach'; }, { size: 6 });
  btn(W / 2 - 60, y + 22, 120, 22, 'JUGAR [Enter]', startSelected, { hl: true, size: 10 });
  txt('WASD/Flechas o arrastrá · Esc/P pausa · 1-9 elegir', W / 2, Math.min(H - 4, y + 56), 5, '#999', 'center');
}
function renderAch() { ctx.fillStyle = '#1a1224'; ctx.fillRect(0, 0, W, H); txt('LOGROS', W / 2, 22, 14, '#f2c230', 'center');
  const colW = Math.min(300, (W - 20) / 2); D.achievements.forEach((a, i) => { const col = i % 2, row = Math.floor(i / 2), x = W / 2 + (col ? 4 : -colW - 4), y = 32 + row * 34, got = !!META.ach[a.id];
    ctx.fillStyle = got ? '#2f3a26' : '#241c33'; ctx.fillRect(x, y, colW, 30); txt((got ? '✔ ' : '· ') + a.name, x + 5, y + 10, 7, got ? '#3fdc5a' : '#aaa'); txt(a.desc, x + 5, y + 19, 5, '#ccc'); txt('Premio: ' + rewardText(a.reward), x + 5, y + 27, 5, '#ffd23f'); });
  btn(W / 2 - 50, H - 24, 100, 18, 'Volver [Esc]', () => { screen = 'menu'; }); }
function startSelected() { if (!META.unlocked[META.sel]) META.sel = 'recep'; newRun(META.sel); }
function togglePause() { if (!G) return; if (G.state === 'play') G.state = 'pause'; else if (G.state === 'pause') G.state = 'play'; }
function onKey(c) {
  if (screen === 'ach') { if (c === 'Escape' || c === 'KeyL' || c === 'Enter') screen = 'menu'; return; }
  if (screen === 'menu') { if (c === 'Enter' || c === 'Space') startSelected(); if (c === 'KeyL') screen = 'ach'; if (c === 'KeyT') cycleCostume();
    const i = +c.replace('Digit', '') - 1; const ch = D && D.characters[i]; if (ch && META.unlocked[ch.id]) { META.sel = ch.id; saveMeta(); } return; }
  if (!G) return;
  if (c === 'Escape' || c === 'KeyP') togglePause();
  if (G.state === 'levelup') { const i = +c.replace('Digit', '') - 1; if (i >= 0 && i < 5) choose(i); if (c === 'KeyR') reroll(); if (c === 'KeyX') toggleBanish(); }
  if (G.state === 'over') { if (c === 'Enter' || c === 'Space') newRun(G.char.id); if (c === 'KeyM') { screen = 'menu'; G = null; } }
}

let last = 0;
function frame(ts) {
  const raw = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  const steps = Math.max(1, Math.round(DBG.speed)); for (let i = 0; i < steps; i++) update(raw * DBG.speed / steps);
  processClicks(); buttons = [];
  ctx.setTransform(SC, 0, 0, SC, 0, 0); ctx.imageSmoothingEnabled = false;
  if (screen === 'menu') renderMenu(); else if (screen === 'ach') renderAch();
  else { renderWorld(); renderHUD(); if (G.state === 'levelup') renderLevelUp(); else if (G.state === 'pause') renderPause(); else if (G.state === 'over') renderSummary(); }
  renderToasts(raw);
  if (DBG.speed !== 1 || DBG.t || DBG.god || DBG.dmg !== 1) txt('DEBUG x' + DBG.speed + (DBG.god ? ' god' : '') + (DBG.dmg !== 1 ? ' dmg' + DBG.dmg : ''), W - 4, H - 4, 6, '#f55', 'right');
  requestAnimationFrame(frame);
}

(async function boot() {
  resize(); D = await loadData(); buildSprites(); buildExtraSprites(); loadMeta(); await loadSheets();
  ENE = new Pool(D.timeline.maxEnemies + 60, () => ({})); PROJ = new Pool(500, () => ({})); PICK = new Pool(700, () => ({})); FX = new Pool(500, () => ({}));
  window.CC = { get G() { return G; }, get screen() { return screen; }, get META() { return META; }, enemies: () => ENE.count(), openChest: () => openChest(), slotsOpen: () => slotsOpen(), WS: id => WS(G.weapons.find(w => w.id === id)), sheets: () => Object.keys(SHEET), foodCount, choose, newRun, addWeapon: id => addWeapon(id), addPassive: id => addPassive(id), recalc: () => recalcPassives(), DBG };
  requestAnimationFrame(frame);
})();
})();
