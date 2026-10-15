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

// ---------------- meta (localStorage) -------------
const META_KEY = 'checkoutChaos.meta.v1';
let META;
function loadMeta() { try { META = JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { META = {}; }
  META = Object.assign({ keys: 0, totalKills: 0, bestTime: 0, runs: 0, wins: 0, unlocked: { recep: true, house: true }, shop: { hp: 0, dmg: 0, reroll: 0 }, sel: 'recep' }, META); }
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(META)); } catch (e) { } }

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

function newRun(charId) {
  const ch = D.characters.find(c => c.id === charId);
  const b = ch.bonus || {};
  G = { state: 'play', t: DBG.t, kills: 0, keys: 0, lvl: 1, xp: 0, xpNext: 5, char: ch, weapons: [], passives: [], cds: {}, boss: null, bossSpawned: false,
    nextElite: D.timeline.firstElite, nextConga: D.timeline.congaFrom, spawnAcc: 0, rerolls: META.shop.reroll, choices: null, pulse: 0, congaId: 0, unlockedNow: [], shake: 0,
    players: [{ id: 0, inputSlot: 0, charId: ch.id, anim: 0, input: { mx: 0, my: 0 }, x: 0, y: 0, hp: 0, maxHp: 120 + 10 * META.shop.hp, speed: 95 * (b.speed || 1), regen: b.regen || 0, armor: 0, pickup: 40 * (b.pickup || 1),
      dmg: (b.dmg || 1) * (1 + 0.05 * META.shop.dmg) * DBG.dmg, cd: 1, xpMul: 1, fx: 1, fy: 0, inv: 0, kbx: 0, kby: 0 }] };
  Object.defineProperty(G, 'p', { get() { return this.players[0]; } });
  G.p.hp = G.p.maxHp;
  ENE.items.forEach(o => o.alive = false); PROJ.items.forEach(o => o.alive = false); PICK.items.forEach(o => o.alive = false); FX.items.forEach(o => o.alive = false);
  addWeapon(ch.weapon); screen = 'play'; META.runs++; saveMeta();
  if (DBG.t >= D.timeline.bossAt) G.nextElite = DBG.t + 999;
}
function addWeapon(id) { const w = G.weapons.find(w => w.id === id); if (w) w.lvl = Math.min(5, w.lvl + 1); else G.weapons.push({ id, lvl: 1, a: 0 }); }
function addPassive(id) { let p = G.passives.find(p => p.id === id); if (p) p.lvl = Math.min(5, p.lvl + 1); else G.passives.push(p = { id, lvl: 1 }); recalcPassives(); }
function recalcPassives() { const ch = G.char.bonus || {}; const lv = id => (G.passives.find(p => p.id === id) || { lvl: 0 }).lvl;
  G.p.cd = Math.pow(0.92, lv('cafe')); G.p.armor = lv('uniforme'); G.p.xpMul = 1 + 0.12 * lv('propina'); G.p.speed = 95 * (ch.speed || 1) * (1 + 0.08 * lv('zapatos')); }
const PLAYER_R = 9;

// ---------------- spawning -------------
function spawnEnemy(type, x, y, extra) {
  const e = ENE.get(); if (!e) return null; const d = D.enemies[type]; const s = 1 + G.t / 240;
  Object.assign(e, { type, x, y, hp: d.hp * (d.behavior === 'boss' ? 1 : s), maxHp: d.hp * (d.behavior === 'boss' ? 1 : s), spd: d.speed * rnd(0.9, 1.1), r: d.size, d, vx: 0, vy: 0, hits: {}, flash: 0, leader: null, kb: 0, kbx: 0, kby: 0, tA: 0, tB: 0, life: 99 });
  if (extra) Object.assign(e, extra); return e;
}
function edgePos(margin = 30) { const a = Math.random() * Math.PI * 2, R = Math.hypot(W, H) / 2 + margin; return { x: G.p.x + Math.cos(a) * R, y: G.p.y + Math.sin(a) * R }; }
function spawning(dt) {
  const t = G.t, TL = D.timeline; if (G.victory) return; if (ENE.count() >= TL.maxEnemies) return;
  let rate = 1.2 + t / 50; if (t >= 240) rate *= 2; if (t >= 480) rate *= 1.4; if (G.boss) rate *= 0.4;
  G.spawnAcc += rate * dt;
  while (G.spawnAcc >= 1) { G.spawnAcc--;
    const pool = ['apurado']; if (t >= 120) pool.push('valija'); if (t >= 240) pool.push('queja', 'apurado');
    if (t >= 480) pool.push('valija', 'queja');
    const type = pool[Math.floor(Math.random() * pool.length)], p = edgePos();
    if (type === 'queja') { const a = Math.atan2(G.p.y - p.y, G.p.x - p.x) + rnd(-0.2, 0.2); const e = spawnEnemy('queja', p.x, p.y); if (e) { e.vx = Math.cos(a); e.vy = Math.sin(a); e.life = 12; } }
    else spawnEnemy(type, p.x, p.y);
  }
  if (t >= G.nextElite && t < TL.bossAt) { const p = edgePos(); spawnEnemy('karen', p.x, p.y); G.nextElite = t < TL.eliteRegularFrom ? TL.eliteRegularFrom : G.nextElite + TL.eliteEvery; if (G.nextElite <= t) G.nextElite = t + TL.eliteEvery; }
  if (t >= G.nextConga && t < TL.bossAt + 10) { G.nextConga += TL.congaEvery; const p = edgePos(); let prev = null; G.congaId++;
    for (let i = 0; i < Math.min(TL.congaMax || 4, TL.congaSize + Math.floor((t - 360) / 120)); i++) { const e = spawnEnemy('despedida', p.x, p.y, { leader: prev, congaIdx: i }); if (e) prev = e; } }
  if (!G.bossSpawned && t >= TL.bossAt) { G.bossSpawned = true; const p = edgePos(10); G.boss = spawnEnemy('inspeccion', p.x, p.y); sfx('boss'); G.banner = { s: '¡LLEGÓ LA INSPECCIÓN!', t: 3 }; }
}

// ---------------- weapons -------------
function nearestEnemy(maxD = 1e9) { let best = null, bd = maxD * maxD; for (const e of ENE.items) if (e.alive) { const d = dist2(e, G.p); if (d < bd) { bd = d; best = e; } } return best; }
function fireProj(o) { const p = PROJ.get(); if (!p) return null; Object.assign(p, { team: 0, pierce: 99, hits: {}, ang: 0, spin: 0, state: 0, t: 0, life: 3, r: 6, w: null }, o); return p; }
function weaponsUpdate(dt) {
  for (const w of G.weapons) {
    const S = D.weapons[w.id], L = w.lvl - 1; w.cd = (w.cd || 0) - dt;
    const ready = () => { if (w.cd <= 0) { w.cd = (S.cd ? S.cd[L] : 1) * G.p.cd; return true; } return false; };
    switch (w.id) {
      case 'timbre': if (ready()) { G.pulse++; const f = FX.get(); if (f) Object.assign(f, { kind: 'ring', x: G.p.x, y: G.p.y, t: 0, dur: 0.35, r: S.radius[L] * (G.char.bonus.pickup ? 1 : 1) });
          const R = S.radius[L]; for (const e of ENE.items) if (e.alive && dist2(e, G.p) < (R + e.r) ** 2) damage(e, S.dmg[L], 'timbre', 120); sfx('bell'); } break;
      case 'carrito': if (ready()) for (let i = 0; i < S.count[L]; i++) { const a = Math.random() * Math.PI * 2; fireProj({ w: 'carrito', spr: 'carrito', x: G.p.x, y: G.p.y, vx: Math.cos(a) * S.speed[L], vy: Math.sin(a) * S.speed[L], dmg: S.dmg[L], life: S.life[L], r: 8, hitCd: 0.5, bounce: true }); } break;
      case 'valija': if (ready()) { const n = nearestEnemy(300); const base = n ? Math.atan2(n.y - G.p.y, n.x - G.p.x) : Math.atan2(G.p.fy, G.p.fx);
          for (let i = 0; i < S.count[L]; i++) { const a = base + (i - (S.count[L] - 1) / 2) * 0.5; fireProj({ w: 'valija', spr: 'valija', x: G.p.x, y: G.p.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, dmg: S.dmg[L], life: 4, r: 8, hitCd: 0.4, boomer: S.range[L], spin: 12 }); } sfx('shoot'); } break;
      case 'sarten': { w.a += S.spin[L] * dt; const n = S.count[L];
        for (let i = 0; i < n; i++) { const a = w.a + i * Math.PI * 2 / n, x = G.p.x + Math.cos(a) * S.radius[L], y = G.p.y + Math.sin(a) * S.radius[L];
          w['pos' + i] = { x, y, a };
          for (const e of ENE.items) if (e.alive && (e.x - x) ** 2 + (e.y - y) ** 2 < (e.r + 8) ** 2) { const k = 'sarten' + i; if (!(e.hits[k] > G.t)) { e.hits[k] = G.t + 0.45; damage(e, S.dmg[L], null, 140, x, y); } } } } break;
      case 'spray': { const ang = Math.atan2(G.p.fy, G.p.fx), R = S.range[L], half = S.angle[L];
        w.ang = ang; for (const e of ENE.items) if (e.alive) { const dx = e.x - G.p.x, dy = e.y - G.p.y, d = Math.hypot(dx, dy); if (d < R + e.r) { let da = Math.atan2(dy, dx) - ang; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) < half) damage(e, S.dps[L] * dt / G.p.cd * 1, null, 0); } }
        if (Math.random() < 0.6) { const f = FX.get(); if (f) { const a = ang + rnd(-half, half), sp = rnd(R * 1.4, R * 2.2); Object.assign(f, { kind: 'mist', x: G.p.x + G.p.fx * 8, y: G.p.y + G.p.fy * 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dur: 0.45 }); } } } break;
      case 'tarjeta': if (ready()) { const cands = ENE.items.filter(e => e.alive).sort((a, b) => dist2(a, G.p) - dist2(b, G.p));
          for (let i = 0; i < S.count[L]; i++) { const tgt = cands[i % Math.max(1, cands.length)]; const a = tgt ? Math.atan2(tgt.y - G.p.y, tgt.x - G.p.x) : Math.random() * 6.28;
            fireProj({ w: 'tarjeta', spr: 'tarjeta', x: G.p.x, y: G.p.y, vx: Math.cos(a) * S.speed[L], vy: Math.sin(a) * S.speed[L], dmg: S.dmg[L], life: 1.4, r: 5, pierce: 1, ang: a }); } if (cands.length) sfx('shoot'); } break;
    }
  }
}
function damage(e, amt, key, kb = 0, sx, sy) {
  if (!e.alive) return; if (key) { if (e.hits[key] === G.pulse) return; e.hits[key] = G.pulse; }
  amt *= G.p.dmg; e.hp -= amt; e.flash = 0.08;
  if (kb && e.d.behavior !== 'boss') { const ox = sx ?? G.p.x, oy = sy ?? G.p.y, dx = e.x - ox, dy = e.y - oy, d = Math.hypot(dx, dy) || 1; e.kb = 0.12; e.kbx = dx / d * kb; e.kby = dy / d * kb; }
  if (amt >= 1 && Math.random() < 0.35) { const f = FX.get(); if (f) Object.assign(f, { kind: 'num', x: e.x + rnd(-4, 4), y: e.y - e.r, t: 0, dur: 0.5, v: Math.round(amt) }); }
  sfx('hit'); if (e.hp <= 0) kill(e);
}
function kill(e) {
  e.alive = false; G.kills++; sfx('die');
  const f = FX.get(); if (f) Object.assign(f, { kind: 'poof', x: e.x, y: e.y, t: 0, dur: 0.3 });
  const d = e.d; if (d.xp) drop(d.xp >= 5 ? 'tipBig' : 'tip', e.x, e.y, d.xp);
  const k = d.keys || (Math.random() < 0.012 ? 1 : 0); for (let i = 0; i < k; i++) drop('key', e.x + rnd(-14, 14), e.y + rnd(-14, 14), 1);
  if (d.onDeath === 'queja3') for (let i = 0; i < 3; i++) { const a = Math.atan2(G.p.y - e.y, G.p.x - e.x) + (i - 1) * 0.5; const q = spawnEnemy('queja', e.x, e.y); if (q) { q.vx = Math.cos(a); q.vy = Math.sin(a); q.life = 10; } }
  if (d.behavior === 'boss') { G.boss = null; G.victory = true; setTimeout(() => endRun(true), 1200); G.banner = { s: '¡INSPECCIÓN APROBADA!', t: 3 }; sfx('win');
    for (const o of ENE.items) if (o.alive && o !== e) { o.alive = false; } }
}
function drop(kind, x, y, v) { const p = PICK.get(); if (p) Object.assign(p, { kind, x, y, v, mag: false }); }

// ---------------- enemies update -------------
function enemiesUpdate(dt) {
  const P = G.p;
  for (const e of ENE.items) { if (!e.alive) continue; e.flash -= dt;
    const d = e.d; let tx = P.x, ty = P.y;
    if (e.kb > 0) { e.kb -= dt; e.x += e.kbx * dt; e.y += e.kby * dt; }
    else if (d.behavior === 'line') { e.x += e.vx * e.spd * dt; e.y += e.vy * e.spd * dt; e.life -= dt; if (e.life <= 0) { e.alive = false; continue; } }
    else { if (d.behavior === 'conga' && e.leader) { if (e.leader.alive && e.leader.type === 'despedida') { tx = e.leader.x - (e.leader.vx || 0) * 14; ty = e.leader.y - (e.leader.vy || 0) * 14; } else e.leader = null; }
      const dx = tx - e.x, dy = ty - e.y, dd = Math.hypot(dx, dy) || 1;
      let sp = e.spd; if (d.behavior === 'conga' && e.leader && dd < 14) sp = 0;
      e.vx = dx / dd; e.vy = dy / dd; e.x += e.vx * sp * dt; e.y += e.vy * sp * dt;
      if (d.behavior === 'boss') bossAI(e, dt); }
    // despawn if too far (not elites/boss) — respawn closer
    if (!d.elite && d.behavior !== 'boss' && d.behavior !== 'line' && dist2(e, P) > (W + H) ** 2) { const p = edgePos(); e.x = p.x; e.y = p.y; }
    // contact
    const rr = e.r + PLAYER_R - 3;
    if (dist2(e, P) < rr * rr) { hurt(d.dmg * (1 + G.t / 600)); if (d.push) { const dx = P.x - e.x, dy = P.y - e.y, dd = Math.hypot(dx, dy) || 1; P.kbx = dx / dd * d.push; P.kby = dy / dd * d.push; } }
  }
  // cheap separation for nearby crowd
  const arr = ENE.items; for (let i = 0; i < arr.length; i += 1) { const a = arr[i]; if (!a.alive || a.d.behavior === 'line') continue; const b = arr[(i * 7 + Math.floor(G.t * 60)) % arr.length];
    if (b !== a && b.alive && b.d.behavior !== 'line') { const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy, m = a.r + b.r; if (d2 < m * m && d2 > 0.01) { const d = Math.sqrt(d2), push = (m - d) / 2; a.x += dx / d * push; a.y += dy / d * push; b.x -= dx / d * push; b.y -= dy / d * push; } } }
}
function bossAI(e, dt) {
  e.tA += dt; e.tB += dt;
  if (e.tA > 2.4) { e.tA = 0; const base = Math.atan2(G.p.y - e.y, G.p.x - e.x); for (let i = -4; i <= 4; i++) { const a = base + i * 0.18; fireProj({ team: 1, spr: 'checklist', x: e.x, y: e.y, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130, dmg: 12, life: 4, r: 5 }); } sfx('shoot'); }
  if (e.tB > 7) { e.tB = 0; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; spawnEnemy(i % 2 ? 'apurado' : 'valija', e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40); } G.banner = { s: 'La Inspección convoca huéspedes', t: 1.5 }; }
}
function hurt(amt) { const P = G.p; if (P.inv > 0 || DBG.god || G.victory) return; P.hp -= Math.max(1, amt - P.armor); P.inv = 0.6; G.shake = 0.15; sfx('hurt'); if (P.hp <= 0) { P.hp = 0; endRun(false); } }

// ---------------- projectiles / pickups -------------
function projUpdate(dt) {
  for (const p of PROJ.items) { if (!p.alive) continue; p.t += dt; p.life -= dt; if (p.life <= 0) { p.alive = false; continue; }
    if (p.boomer) { const back = p.t > p.boomer / 260; if (back) { const dx = G.p.x - p.x, dy = G.p.y - p.y, d = Math.hypot(dx, dy) || 1; p.vx = dx / d * 300; p.vy = dy / d * 300; if (d < 10) { p.alive = false; continue; } } }
    p.x += p.vx * dt; p.y += p.vy * dt; p.ang += p.spin * dt;
    if (p.bounce) { const L = G.p.x - W / 2, R = G.p.x + W / 2, T = G.p.y - H / 2, B = G.p.y + H / 2;
      if (p.x < L + 6) { p.x = L + 6; p.vx = Math.abs(p.vx); } if (p.x > R - 6) { p.x = R - 6; p.vx = -Math.abs(p.vx); }
      if (p.y < T + 6) { p.y = T + 6; p.vy = Math.abs(p.vy); } if (p.y > B - 6) { p.y = B - 6; p.vy = -Math.abs(p.vy); } }
    if (p.team === 1) { if (dist2(p, G.p) < (p.r + PLAYER_R) ** 2) { hurt(p.dmg); p.alive = false; } continue; }
    for (const e of ENE.items) { if (!e.alive) continue; if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < (e.r + p.r) ** 2) {
      const id = 'p' + PROJ.items.indexOf(p); if (e.hits[id] > G.t) continue; e.hits[id] = G.t + (p.hitCd || 99);
      damage(e, p.dmg, null, p.w === 'tarjeta' ? 40 : 90, p.x, p.y); p.pierce--; if (p.pierce <= 0) { p.alive = false; break; } } }
  }
}
function pickUpdate(dt) {
  const P = G.p;
  for (const k of PICK.items) { if (!k.alive) continue; const d2 = dist2(k, P);
    if (d2 < P.pickup * P.pickup) k.mag = true;
    if (k.mag) { const dx = P.x - k.x, dy = P.y - k.y, d = Math.hypot(dx, dy) || 1; k.x += dx / d * 260 * dt; k.y += dy / d * 260 * dt;
      if (d < 10) { k.alive = false; if (k.kind === 'key') { G.keys += k.v; sfx('key'); } else { G.xp += k.v * P.xpMul; sfx('tip'); } } }
    else if (d2 > (W * 1.5) ** 2) k.alive = false;
  }
  if (G.xp >= G.xpNext && G.state === 'play') levelUp();
}

// ---------------- level up -------------
function upgradePool() {
  const out = [];
  for (const id in D.weapons) { const w = G.weapons.find(w => w.id === id); if (w ? w.lvl < 5 : G.weapons.length < 4) out.push({ kind: 'w', id, lvl: w ? w.lvl + 1 : 1 }); }
  for (const id in D.passives) { const p = G.passives.find(p => p.id === id); if (p ? p.lvl < 5 : G.passives.length < 4) out.push({ kind: 'p', id, lvl: p ? p.lvl + 1 : 1 }); }
  return out;
}
function rollChoices() { const pool = upgradePool(); const c = [];
  while (c.length < 3 && pool.length) c.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  if (!c.length) c.push({ kind: 'heal' }, { kind: 'keys' }); G.choices = c; }
function levelUp() { G.xp -= G.xpNext; G.lvl++; G.xpNext = Math.floor(5 + G.lvl * 4 + G.lvl * G.lvl * 0.35); G.state = 'levelup'; rollChoices(); sfx('lvl'); }
function choose(i) { const c = G.choices && G.choices[i]; if (!c) return;
  if (c.kind === 'w') addWeapon(c.id); else if (c.kind === 'p') addPassive(c.id); else if (c.kind === 'heal') G.p.hp = G.p.maxHp; else G.keys += 2;
  G.choices = null; G.state = 'play'; if (G.xp >= G.xpNext) levelUp(); }
function reroll() { if (G.rerolls > 0) { G.rerolls--; rollChoices(); sfx('tip'); } }

// ---------------- unlocks / end -------------
function checkUnlocks() {
  for (const c of D.characters) { if (META.unlocked[c.id] || !c.unlock) continue;
    const ok = (c.unlock.type === 'survive' && G.t >= c.unlock.sec) || (c.unlock.type === 'kills' && META.totalKills + G.kills >= c.unlock.n);
    if (ok) { META.unlocked[c.id] = true; G.unlockedNow.push(c.name); G.banner = { s: '¡DESBLOQUEADO: ' + c.name.toUpperCase() + '!', t: 3 }; sfx('lvl'); saveMeta(); } }
}
function endRun(win) {
  if (!G || G.state === 'over') return; G.state = 'over'; G.win = win;
  META.keys += G.keys; META.totalKills += G.kills; META.bestTime = Math.max(META.bestTime, G.t); if (win) META.wins++;
  checkUnlocks(); saveMeta(); if (!win) sfx('lose');
}

// ---------------- update loop -------------
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
    P.anim += dt;
    P.inv -= dt; P.hp = Math.min(P.maxHp, P.hp + P.regen * dt);
  }
  G.shake -= dt;
  spawning(dt); weaponsUpdate(dt); projUpdate(dt); enemiesUpdate(dt); pickUpdate(dt);
  for (const f of FX.items) if (f.alive) { f.t += dt; if (f.vx) { f.x += f.vx * dt; f.y += f.vy * dt; } if (f.t >= f.dur) f.alive = false; }
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  checkUnlocks();
}

// ---------------- render -------------
function draw(spr, x, y, flip, s = 1) { const w = spr.width * s, h = spr.height * s; if (flip) { ctx.save(); ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(spr, Math.round(-w / 2), Math.round(y - h / 2), w, h); ctx.restore(); } else ctx.drawImage(spr, Math.round(x - w / 2), Math.round(y - h / 2), w, h); }
const SHEET = {};
function loadSheets() { const S = window.SPRITE_SHEETS || {}; return Promise.all(Object.keys(S).map(k => new Promise(res => { const img = new Image();
  img.onload = () => { SHEET[k] = { img, fs: S[k].fs, n: S[k].frames }; res(); }; img.onerror = () => res(); img.src = S[k].src; }))); }
// frame order: 0 idle0, 1 idle1, 2-5 walk0-3. Art faces right; flip for left.
function animFrame(moving, t) { return moving ? 2 + Math.floor(t * 8) % 4 : Math.floor(t * 2.5) % 2; }
function drawAnim(key, x, y, frame, flip, s = 1) { const sh = SHEET[key]; if (!sh) return draw(SPR[key], x, y, flip, s);
  const fs = sh.fs, w = fs * s; ctx.save(); ctx.translate(Math.round(x), Math.round(y - w / 2)); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sh.img, (frame % sh.n) * fs, 0, fs, fs, Math.round(-w / 2), 0, w, w); ctx.restore(); }
function fmt(t) { t = Math.max(0, t); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0'); }
function renderWorld() {
  const P = G.p; let cx = Math.round(P.x - W / 2), cy = Math.round(P.y - H / 2);
  if (G.shake > 0) { cx += Math.round(rnd(-2, 2)); cy += Math.round(rnd(-2, 2)); }
  // tiled infinite lobby
  const ox = -(((cx % 64) + 64) % 64), oy = -(((cy % 64) + 64) % 64);
  for (let y = oy; y < H; y += 64) for (let x = ox; x < W; x += 64) { ctx.drawImage(SPR.tile, x, y);
    const tx = Math.floor((x + cx) / 64), ty = Math.floor((y + cy) / 64); if (((tx * 73856093) ^ (ty * 19349663)) % 11 === 0) ctx.drawImage(SPR.plant, x + 2, y + 2); }
  ctx.save(); ctx.translate(-cx, -cy);
  for (const k of PICK.items) if (k.alive) draw(SPR[k.kind], k.x, k.y + Math.sin(G.t * 5 + k.x) * 1.5);
  for (const f of FX.items) if (f.alive && f.kind === 'ring') { const k = f.t / f.dur; ctx.strokeStyle = `rgba(242,194,48,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(G.p.x, G.p.y, f.r * (0.3 + 0.7 * k), 0, 7); ctx.stroke(); }
  // spray cone
  const sp = G.weapons.find(w => w.id === 'spray'); if (sp) { const S = D.weapons.spray, L = sp.lvl - 1; ctx.fillStyle = 'rgba(120,220,255,.14)'; ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.arc(P.x, P.y, S.range[L], sp.ang - S.angle[L], sp.ang + S.angle[L]); ctx.fill(); }
  const list = ENE.items.filter(e => e.alive).sort((a, b) => a.y - b.y);
  for (const e of list) { const spr = SPR['e_' + e.type]; const bob = e.d.behavior === 'line' ? Math.sin(G.t * 10 + e.x) * 2 : (Math.floor(G.t * 8 + e.x) % 2);
    drawAnim('e_' + e.type, e.x, e.y - 6 + (e.d.behavior === 'line' ? bob : 0), animFrame(e.d.behavior !== 'boss' || e.spd > 0, G.t + (e.x % 7) * 0.13), e.vx < 0);
    if (e.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; drawAnim('e_' + e.type, e.x, e.y - 6, animFrame(true, G.t + (e.x % 7) * 0.13), e.vx < 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    if (e.d.elite) { ctx.fillStyle = '#300'; ctx.fillRect(e.x - 14, e.y - 26, 28, 3); ctx.fillStyle = '#ff3df5'; ctx.fillRect(e.x - 14, e.y - 26, 28 * Math.max(0, e.hp / e.maxHp), 3); } }
  // player
  for (const Q of G.players) { const blink = Q.inv > 0 && Math.floor(Q.inv * 20) % 2; if (!blink) drawAnim('pl_' + Q.charId, Q.x, Q.y - 6, animFrame(Q.moving, Q.anim), Q.fx < 0); }
  ctx.fillStyle = '#300'; ctx.fillRect(P.x - 12, P.y + 12, 24, 3); ctx.fillStyle = '#3fdc5a'; ctx.fillRect(P.x - 12, P.y + 12, 24 * P.hp / P.maxHp, 3);
  for (const w of G.weapons) if (w.id === 'sarten') for (let i = 0; i < D.weapons.sarten.count[w.lvl - 1]; i++) { const q = w['pos' + i]; if (q) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a * 2); ctx.drawImage(SPR.sarten, -8, -8); ctx.restore(); } }
  for (const p of PROJ.items) if (p.alive) { const s = SPR[p.spr]; ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.rotate(p.ang || 0); ctx.drawImage(s, -s.width / 2, -s.height / 2); ctx.restore(); }
  for (const f of FX.items) if (f.alive) { const k = f.t / f.dur;
    if (f.kind === 'poof') { ctx.fillStyle = `rgba(255,255,255,${1 - k})`; for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.fillRect(f.x + Math.cos(a) * 12 * k - 1, f.y + Math.sin(a) * 12 * k - 1, 3, 3); } }
    if (f.kind === 'mist') { ctx.fillStyle = `rgba(170,235,255,${0.7 * (1 - k)})`; ctx.fillRect(f.x - 2, f.y - 2, 4, 4); }
    if (f.kind === 'num') { ctx.globalAlpha = 1 - k; txt(String(f.v), f.x, f.y - k * 10, 7, '#fff', 'center'); ctx.globalAlpha = 1; } }
  ctx.restore();
  // joystick
  if (JOY.active) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(JOY.sx, JOY.sy, 30, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; const dx = JOY.x - JOY.sx, dy = JOY.y - JOY.sy, d = Math.min(30, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); ctx.beginPath(); ctx.arc(JOY.sx + Math.cos(a) * d, JOY.sy + Math.sin(a) * d, 12, 0, 7); ctx.fill(); }
}
function renderHUD() {
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, 6); ctx.fillStyle = '#3fbf5a'; ctx.fillRect(0, 0, W * Math.min(1, G.xp / G.xpNext), 6);
  txt('NV ' + G.lvl, 4, 16, 8); txt(fmt(G.t), W / 2, 20, 14, G.t >= 540 ? '#ff6060' : '#fff', 'center');
  txt('☠ ' + G.kills, 4, 28, 8, '#ddd'); txt('🔑 ' + G.keys, 4, 40, 8, '#ffd23f');
  let x = 4; for (const w of G.weapons) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x, H - 22, 18, 18); const s = SPR[w.id]; ctx.drawImage(s, x + 1, H - 21, 16, 16 * s.height / s.width); txt(String(w.lvl), x + 14, H - 6, 6, '#ffd23f'); x += 20; }
  x += 6; for (const p of G.passives) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x, H - 22, 18, 18); ctx.drawImage(SPR['ic_' + p.id], x + 1, H - 21); txt(String(p.lvl), x + 14, H - 6, 6, '#ffd23f'); x += 20; }
  if (G.boss && G.boss.alive) { const bw = Math.min(260, W - 40); ctx.fillStyle = '#300'; ctx.fillRect(W / 2 - bw / 2, 26, bw, 6); ctx.fillStyle = '#ff2a2a'; ctx.fillRect(W / 2 - bw / 2, 26, bw * G.boss.hp / G.boss.maxHp, 6); txt('LA INSPECCIÓN', W / 2, 42, 7, '#ff8080', 'center'); }
  if (G.banner) txt(G.banner.s, W / 2, H / 3, 12, '#ffd23f', 'center');
  btn(W - 26, 10, 20, 20, 'II', () => togglePause(), { size: 9 });
}
function overlay(a = 0.7) { ctx.fillStyle = `rgba(10,6,16,${a})`; ctx.fillRect(0, 0, W, H); }
function upLabel(c) { if (c.kind === 'heal') return ['Botiquín', 'Cura toda la vida', null]; if (c.kind === 'keys') return ['Llavero', '+2 llaves', 'key'];
  const S = c.kind === 'w' ? D.weapons[c.id] : D.passives[c.id]; return [S.name + (c.lvl > 1 ? ' Nv' + c.lvl : ' (NUEVO)'), S.desc, c.kind === 'w' ? c.id : 'ic_' + c.id]; }
function renderLevelUp() { overlay(); txt('¡SUBISTE DE NIVEL!', W / 2, 40, 14, '#ffd23f', 'center');
  const cw = Math.min(170, (W - 40) / 3), ch = 90, y = H / 2 - 50;
  G.choices.forEach((c, i) => { const x = W / 2 + (i - (G.choices.length - 1) / 2) * (cw + 8) - cw / 2; const [n, d, ic] = upLabel(c);
    buttons.push({ x, y, w: cw, h: ch, fn: () => choose(i) });
    ctx.fillStyle = '#2a2140'; ctx.fillRect(x, y, cw, ch); ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, cw - 1, ch - 1);
    if (ic) draw(SPR[ic], x + cw / 2, y + 22, false, 2); txt(n, x + cw / 2, y + 50, 7, '#fff', 'center'); txt(d, x + cw / 2, y + 64, 6, '#bbb', 'center'); txt('[' + (i + 1) + ']', x + cw / 2, y + 82, 7, '#f2c230', 'center'); });
  btn(W / 2 - 50, y + ch + 14, 100, 18, 'Reroll (' + G.rerolls + ') [R]', reroll, { disabled: G.rerolls <= 0 }); }
function renderPause() { overlay(); txt('PAUSA', W / 2, H / 2 - 30, 16, '#fff', 'center'); btn(W / 2 - 50, H / 2 - 10, 100, 20, 'Seguir [Esc]', togglePause);
  btn(W / 2 - 50, H / 2 + 16, 100, 20, 'Abandonar', () => { G.state = 'play'; endRun(false); }); btn(W / 2 - 50, H / 2 + 42, 100, 20, 'Sonido: ' + (AU.on ? 'ON' : 'OFF'), () => { AU.on = !AU.on; if (AU.mus) AU.mus.gain.value = AU.on ? 0.18 : 0; }); }
function renderSummary() { overlay(0.8); txt(G.win ? '¡TURNO SUPERADO!' : 'TE DIERON DE BAJA', W / 2, 50, 16, G.win ? '#3fdc5a' : '#ff6060', 'center');
  txt('Tiempo: ' + fmt(G.t), W / 2, 80, 10, '#fff', 'center'); txt('Kills: ' + G.kills, W / 2, 96, 10, '#fff', 'center'); txt('Llaves ganadas: ' + G.keys + '  (total ' + META.keys + ')', W / 2, 112, 10, '#ffd23f', 'center');
  txt('Nivel ' + G.lvl + ' · ' + G.char.name, W / 2, 128, 8, '#bbb', 'center');
  if (G.unlockedNow.length) txt('Desbloqueado: ' + G.unlockedNow.join(', '), W / 2, 148, 10, '#ff7bc2', 'center');
  btn(W / 2 - 110, 166, 105, 22, 'Otra run [Enter]', () => newRun(G.char.id), { hl: true }); btn(W / 2 + 5, 166, 105, 22, 'Menú [M]', () => { screen = 'menu'; G = null; }); }
function shopPrice(s) { const lv = META.shop[s.id]; return lv < s.price.length ? s.price[lv] : null; }
function renderMenu() {
  ctx.fillStyle = '#1a1224'; ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) { ctx.globalAlpha = 0.25; ctx.drawImage(SPR.tile, x, y); ctx.globalAlpha = 1; }
  txt('CHECK-OUT CHAOS', W / 2, 30, 18, '#f2c230', 'center'); txt('Sobreviví el peor turno del hotel', W / 2, 44, 7, '#ccc', 'center');
  txt('🔑 ' + META.keys + '   ☠ total ' + META.totalKills + '   mejor ' + fmt(META.bestTime), W / 2, 58, 7, '#ffd23f', 'center');
  const n = D.characters.length, cw = Math.min(110, (W - 30) / n - 6), y = 68, chh = 112;
  D.characters.forEach((c, i) => { const x = W / 2 + (i - (n - 1) / 2) * (cw + 6) - cw / 2, un = META.unlocked[c.id], sel = META.sel === c.id;
    buttons.push({ x, y, w: cw, h: chh, fn: () => { if (un) META.sel = c.id; else if (META.keys >= c.price) { META.keys -= c.price; META.unlocked[c.id] = true; META.sel = c.id; sfx('key'); } saveMeta(); } });
    ctx.fillStyle = sel ? '#3a2f5a' : '#241c33'; ctx.fillRect(x, y, cw, chh); ctx.strokeStyle = sel ? '#f2c230' : '#554'; ctx.strokeRect(x + .5, y + .5, cw - 1, chh - 1);
    ctx.globalAlpha = un ? 1 : 0.35; drawAnim('pl_' + c.id, x + cw / 2, y + 30, animFrame(sel, performance.now() / 1000), false, 2); ctx.globalAlpha = 1;
    txt(c.name, x + cw / 2, y + 66, 7, '#fff', 'center'); txt(D.weapons[c.weapon].name, x + cw / 2, y + 78, 6, '#f2c230', 'center'); txt(c.bonusText, x + cw / 2, y + 89, 5, '#bbb', 'center');
    if (!un) { txt('🔒 ' + c.unlock.text, x + cw / 2, y + 100, 5, '#ff7bc2', 'center'); txt('o ' + c.price + ' 🔑', x + cw / 2, y + 108, 6, META.keys >= c.price ? '#3fdc5a' : '#888', 'center'); }
    txt('[' + (i + 1) + ']', x + 8, y + 10, 6, '#888'); });
  const sy = y + chh + 8; let sx = W / 2 - 3 * 64 / 2 - 4;
  for (const s of D.shop) { const pr = shopPrice(s); btn(sx, sy, 62, 18, pr == null ? s.name + ' MAX' : s.name + ' ' + pr + '🔑', () => { if (pr != null && META.keys >= pr) { META.keys -= pr; META.shop[s.id]++; saveMeta(); sfx('key'); } }, { size: 5, disabled: pr == null || META.keys < pr }); sx += 66; }
  btn(W / 2 - 60, sy + 26, 120, 24, 'JUGAR [Enter]', startSelected, { hl: true, size: 10 });
  txt('WASD/Flechas o arrastrá para moverte · Esc/P pausa', W / 2, Math.min(H - 6, sy + 64), 6, '#999', 'center');
}
function startSelected() { if (!META.unlocked[META.sel]) META.sel = 'recep'; newRun(META.sel); }
function togglePause() { if (!G) return; if (G.state === 'play') G.state = 'pause'; else if (G.state === 'pause') G.state = 'play'; }
function onKey(c) {
  if (screen === 'menu') { if (c === 'Enter' || c === 'Space') startSelected(); const i = +c.replace('Digit', '') - 1; const ch = D && D.characters[i]; if (ch && META.unlocked[ch.id]) { META.sel = ch.id; saveMeta(); } return; }
  if (!G) return;
  if (c === 'Escape' || c === 'KeyP') togglePause();
  if (G.state === 'levelup') { if (c === 'Digit1') choose(0); if (c === 'Digit2') choose(1); if (c === 'Digit3') choose(2); if (c === 'KeyR') reroll(); }
  if (G.state === 'over') { if (c === 'Enter' || c === 'Space') newRun(G.char.id); if (c === 'KeyM') { screen = 'menu'; G = null; } }
}

let last = 0;
function frame(ts) {
  const raw = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  // debug speed: substeps to keep collisions sane
  const steps = Math.max(1, Math.round(DBG.speed)); for (let i = 0; i < steps; i++) update(raw * DBG.speed / steps);
  processClicks(); buttons = [];
  ctx.setTransform(SC, 0, 0, SC, 0, 0); ctx.imageSmoothingEnabled = false;
  if (screen === 'menu') renderMenu();
  else { renderWorld(); renderHUD(); if (G.state === 'levelup') renderLevelUp(); else if (G.state === 'pause') renderPause(); else if (G.state === 'over') renderSummary(); }
  if (DBG.speed !== 1 || DBG.t || DBG.god || DBG.dmg !== 1) txt('DEBUG x' + DBG.speed + (DBG.god ? ' god' : '') + (DBG.dmg !== 1 ? ' dmg' + DBG.dmg : ''), W - 4, H - 4, 6, '#f55', 'right');
  requestAnimationFrame(frame);
}

(async function boot() {
  resize(); D = await loadData(); loadMeta(); buildSprites(); await loadSheets();
  ENE = new Pool(D.timeline.maxEnemies + 40, () => ({})); PROJ = new Pool(300, () => ({})); PICK = new Pool(700, () => ({})); FX = new Pool(400, () => ({}));
  // test/debug hook
  window.CC = { get G() { return G; }, get screen() { return screen; }, get META() { return META; }, enemies: () => ENE.count(), sheets: () => Object.keys(SHEET), choose, newRun, DBG };
  requestAnimationFrame(frame);
})();
})();
