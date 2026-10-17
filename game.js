// Check-Out Chaos — MVP (pure canvas, no build step)
(() => {
'use strict';
const Q = new URLSearchParams(location.search);
const DBG = { speed: +Q.get('speed') || 1, t: +Q.get('t') || 0, god: Q.get('god') === '1', dmg: +Q.get('dmg') || 1, level: Q.get('level') || null, on: Q.get('debug') === '1', rescueNow: Q.get('rescue') === 'now' };
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let D = null, W = 640, H = 360, SC = 2;
const STORE = window.STORE, PLATFORM = window.PLATFORM, track = (e, p) => { try { window.ANALYTICS && window.ANALYTICS.track(e, p); } catch (err) { } };
// ---------------- i18n: Spanish literals are the keys; STRINGS.ui.en maps them to English. Data text gets an EN overlay by path. -------------
const LANG_KEY = 'checkoutChaos.lang';
let LANG = (() => { const q = Q.get('lang'); if (q === 'es' || q === 'en') return q; const s = STORE.get(LANG_KEY); if (s === 'es' || s === 'en') return s;
  return /^es\b/i.test(navigator.language || '') ? 'es' : 'en'; })();
window.LANG = LANG;
const STR = window.STRINGS || { ui: { en: {} }, data: { en: {} } };
function tr(s) { if (LANG === 'es') return s; const v = STR.ui[LANG] && STR.ui[LANG][s]; return v == null ? s : v; }
let DATA_ES = null;
function dataTarget(path) { const p = path.split('.'); let o = D;
  for (let i = 0; i < p.length - 1; i++) { const k = p[i]; if (Array.isArray(o)) { o = /^\d+$/.test(k) ? o[+k] : o.find(x => x.id === k); } else o = o && o[k]; if (!o) return null; }
  return [o, p[p.length - 1]]; }
function applyLang() { const tbl = (STR.data && STR.data.en) || {};
  if (!DATA_ES) { DATA_ES = {}; for (const k in tbl) { const t = dataTarget(k); if (t) DATA_ES[k] = t[0][t[1]]; } }
  for (const k in DATA_ES) { const t = dataTarget(k); if (t) t[0][t[1]] = LANG === 'en' ? tbl[k] : DATA_ES[k]; }
  document.documentElement.lang = LANG; window.LANG = LANG; }
function setLang(l) { LANG = l; STORE.set(LANG_KEY, l); applyLang(); }

// ---------------- data load (fetch JSON, fallback to embedded JS) -------------
async function loadData() {
  if (location.protocol === 'file:' && window.GAME_DATA_FALLBACK) return window.GAME_DATA_FALLBACK;
  try { const r = await fetch('data.json', { cache: 'no-store' }); if (!r.ok) throw 0; return await r.json(); }
  catch (e) { return window.GAME_DATA_FALLBACK; }
}

// ---------------- resize -------------
// Fixed 16:9 logical view (640x360), letterboxed and centered. Backing store is an integer multiple (crisp nearest-neighbor);
// CSS scales it to fit. Safe-area insets are respected via CSS padding on body.
function resize() {
  MOB.on = detectMobile(); document.body.classList.toggle('mob', MOB.on); if (MOB.on) { resizeMobile(); return; } if (W !== 640) W = 640;
  const cs = getComputedStyle(document.body), padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0), padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  const w = Math.max(1, innerWidth - padX), h = Math.max(1, innerHeight - padY), fit = Math.min(w / W, h / H), dpr = window.devicePixelRatio || 1;
  SC = Math.max(1, Math.ceil(fit * dpr)); cv.width = W * SC; cv.height = H * SC;
  cv.style.width = Math.floor(W * fit) + 'px'; cv.style.height = Math.floor(H * fit) + 'px';
  document.body.classList.toggle('portrait', innerHeight > innerWidth * 1.1);
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 100)); if (window.visualViewport) visualViewport.addEventListener('resize', resize);

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
function audible() { return AU.on && !(PLATFORM && PLATFORM.muted); }
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.5; AU.master.connect(AU.ctx.destination);
  AU.mus = AU.ctx.createGain(); AU.mus.gain.value = 0.18; AU.mus.connect(AU.master);
  try { if (window.MUSIC) MUSIC.init(AU.ctx, AU.ctx.destination); } catch (e) {}
  startMusic();
}
function tone(f, d, type = 'square', vol = 0.15, slide = 0, dest) {
  if (!AU.ctx || !audible()) return; const t = AU.ctx.currentTime, o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
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
      if (window.MUSIC && MUSIC.playing()) { next = AU.ctx.currentTime + 0.1; break; } // real tracks loaded: synth stays silent
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

// ---------------- meta (STORE wrapper, v2 with v1 migration; v1 key is never deleted) -------------
const META_KEY_V1 = 'checkoutChaos.meta.v1', META_KEY_V2 = 'checkoutChaos.meta.v2', META_KEY = 'checkoutChaos.meta.v4'; // v4 = levels; v1/v2 keys are read for migration and never deleted
let META;
function metaDefaults() { return { v: 4, levelsWon: {}, levelBest: {}, rescued: {}, charUnlocks: {}, levelSel: 'lobby', keys: 0, totalKills: 0, bestTime: 0, runs: 0, wins: 0, unlocked: { recep: true, house: true, botones: true }, legacy: {}, earned: {}, earnedUnlocks: {}, shop: { hp: 0, dmg: 0, reroll: 0, banish: 0 }, sel: 'recep', book: { revealed: {}, fused: {} },
  ach: {}, costumes: {}, costumeSel: {}, stats: { karens: 0, winsAs: {}, lifetimeKeys: 0 }, migratedFromV1: false }; }
// ---------------- edition (demo vs full) -------------
function FULL() { return window.BUILD_FULL_VERSION === true || !!(D.edition && D.edition.FULL_VERSION); }
function DEMO_CHARS() { return (D.edition && D.edition.demoCharacters) || ['recep', 'house', 'botones']; }
function inDemoSet(id) { return DEMO_CHARS().includes(id); }
// owned AND allowed in this edition. Legacy = owned before the demo split (save migration) -> always playable.
function playable(id) { return !!META.unlocked[id] && (FULL() || inDemoSet(id) || !!META.legacy[id]); }
function canUnlock(id) { return FULL() || inDemoSet(id); }
// ---------------- levels (data.json levels[]) -------------
let LV = null;
function LEVELS() { return D.levels || [{ id: 'lobby', order: 1, name: 'Lobby', hpMul: 1, densityMul: 1, keyMul: 1, diff: 1, map: {}, mini: 'inspeccion', boss: 'dueno', unlockables: [], demo: true, ready: true }]; }
function levelDef(id) { return LEVELS().find(l => l.id === id) || (id === 'checkin' && D.checkin && D.checkin.level) || LEVELS()[0]; }
function levelOpen(L) { return !L.unlockReq || !!META.levelsWon[L.unlockReq]; }
function levelPlayable(L) { if (L.mode === 'checkin') return FULL() && !!(D.checkin && D.checkin.ready) && checkinUnlocked(); return L.id === 'lobby' || (FULL() && L.ready !== false && levelOpen(L)); }
function levelLockReason(L) { if (L.mode === 'checkin') return !FULL() ? 'full' : !checkinUnlocked() ? 'checkin' : ''; if (L.id === 'lobby') return ''; if (!FULL()) return 'full'; if (L.ready === false) return 'soon'; if (!levelOpen(L)) return 'win:' + L.unlockReq; return ''; }
function unlockChar(id, via) { if (!canUnlock(id) || (META.unlocked[id] && META.earnedUnlocks[id])) return false; META.unlocked[id] = true; META.earnedUnlocks[id] = 1; META.charUnlocks[id] = via; track('character_unlocked', { id, via, stage: LV ? LV.id : null }); saveMeta(); return true; }
function checkinUnlocked() { return LEVELS().length >= 5 && LEVELS().every(L => META.levelsWon[L.id]) && D.characters.every(c => META.unlocked[c.id]); }
function ET(type) { if (!LV) return type; if (type === 'inspeccion') return LV.mini || type; if (type === 'dueno') return LV.boss || type; return (LV.map && LV.map[type]) || type; }
const isBig = d => d.behavior === 'boss' || d.behavior === 'dueno' || d.behavior === 'lvboss';
function loadMeta() {
  let m = STORE.getJSON(META_KEY) || STORE.getJSON(META_KEY_V2); const existed = !!m || !!STORE.get(META_KEY_V1);
  if (!m) { let old = STORE.getJSON(META_KEY_V1);
    m = metaDefaults();
    if (old) { Object.assign(m, { keys: old.keys || 0, totalKills: old.totalKills || 0, bestTime: old.bestTime || 0, runs: old.runs || 0, wins: 0, sel: old.sel || 'recep' });
      m.unlocked = Object.assign(m.unlocked, old.unlocked || {}); m.shop = Object.assign(m.shop, old.shop || {}); m.migratedFromV1 = true;
      m.pendingRetro = { bestTime: old.bestTime || 0, v1wins: old.wins || 0, botones: !!(old.unlocked || {}).botones }; } }
  const d = metaDefaults(); META = Object.assign(d, m); META.stats = Object.assign(metaDefaults().stats, m.stats || {}); META.shop = Object.assign(metaDefaults().shop, m.shop || {}); META.book = Object.assign(metaDefaults().book, m.book || {}); if ((m.v || 1) < 3) META.migratedFromV2 = true; if ((m.v || 1) < 4) META.migratedToV4 = Date.now(); META.v = 4;
  for (const k of ['levelsWon', 'levelBest', 'rescued', 'charUnlocks']) META[k] = Object.assign({}, m[k] || {}); if (!META.levelSel) META.levelSel = 'lobby';
  if (META.wins > 0 && !META.levelsWon.lobby) META.levelsWon.lobby = META.wins; // a v1-v3 victory = Lobby won
  for (const id in META.unlocked) if (META.unlocked[id] && !META.charUnlocks[id]) META.charUnlocks[id] = inDemoSet(id) ? 'initial' : 'legacy';
  if (META.pendingRetro) { const r = META.pendingRetro; delete META.pendingRetro;   // v1 win = beat La Inspección (old final boss)
    if (r.bestTime >= 60) grantAch('primer_turno', true); if (r.bestTime >= 300 || r.botones) grantAch('media_jornada', true);
    if (r.v1wins > 0) grantAch('inspeccion', true); if (META.totalKills >= 500) grantAch('matanza', true); }
  META.legacy = META.legacy || {}; META.earned = META.earned || {};
  // earnedUnlocks = characters unlocked through play (achievements or keys). Seeded once from saves that predate it; never filled by BUILD_ALL_UNLOCKED.
  if (!META.earnedUnlocks) { META.earnedUnlocks = {}; for (const c of D.characters) if (c.unlock && META.unlocked[c.id]) META.earnedUnlocks[c.id] = 1; }
  // demo split migration (once): anything already owned stays playable forever, even in the demo. Fresh saves get nothing extra.
  if (!META.demoSplit) { META.demoSplit = 1; if (existed) for (const id in META.unlocked) if (META.unlocked[id] && !inDemoSet(id)) META.legacy[id] = 1; }
  for (const c of D.characters) if (!c.unlock && canUnlock(c.id)) META.unlocked[c.id] = true;
  if (FULL()) for (const id in META.earned) META.unlocked[id] = true;
  if (FULL() && window.BUILD_ALL_UNLOCKED === true) for (const c of D.characters) META.unlocked[c.id] = true; // desktop full build: all 14 from the start // achievement unlocks earned in the demo apply in the full version
  saveMeta(); }
function saveMeta() { STORE.setJSON(META_KEY, META); }
let achToast = [];
function grantAch(id, silent) {
  if (META.ach[id]) return; const a = D.achievements.find(a => a.id === id); if (!a) return; META.ach[id] = Date.now(); const r = a.reward; track('achievement_unlocked', { id, silent: !!silent }); if (r.unlock && !META.unlocked[r.unlock] && canUnlock(r.unlock)) track('character_unlocked', { id: r.unlock, via: 'achievement' });
  if (r.keys) { META.keys += r.keys; META.stats.lifetimeKeys += r.keys; } if (r.unlock) { META.earnedUnlocks[r.unlock] = 1; if (canUnlock(r.unlock)) META.unlocked[r.unlock] = true; else META.earned[r.unlock] = 1; } if (r.costume) META.costumes[r.costume] = true;
  saveMeta(); if (!silent) { achToast.push({ s: '🏆 ' + a.name, sub: rewardText(r), t: 3.5 }); sfx('lvl'); } }
function rewardText(r) { const o = []; if (r.keys) o.push('+' + r.keys + tr(' llaves')); if (r.unlock) o.push(tr('desbloquea ') + D.characters.find(c => c.id === r.unlock).name + (canUnlock(r.unlock) ? '' : tr(' (versión completa)'))); if (r.costume) o.push(tr('traje ') + D.costumes[r.costume].name); return o.join(' · '); }

// ---------------- input -------------
const keys = {}; const JOY = { active: false, id: null, sx: 0, sy: 0, x: 0, y: 0 };
let clickQ = [];
addEventListener('keydown', e => { keys[e.code] = true; audioInit(); onKey(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
function toWorld(e) { const r = cv.getBoundingClientRect(); if (MOB.on) { const cx = e.clientX - r.left, cy = e.clientY - r.top; return { x: (cx - MOB.gx) / MOB.gs, y: (cy - MOB.gy) / MOB.gs, cx, cy }; } return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
cv.addEventListener('pointerdown', e => { audioInit(); const p = toWorld(e); if (MOB.on) return mDown(e, p);
  if (G && G.state === 'play' && !hitBtn(p)) { JOY.active = true; JOY.id = e.pointerId; JOY.sx = JOY.x = p.x; JOY.sy = JOY.y = p.y; cv.setPointerCapture(e.pointerId); }
  else clickQ.push(p); });
cv.addEventListener('pointermove', e => { if (MOB.on) return mMove(e, toWorld(e)); if (JOY.active && e.pointerId === JOY.id) { const p = toWorld(e); JOY.x = p.x; JOY.y = p.y; } });
const endJoy = e => { if (MOB.on) mUp(e); if (e.pointerId === JOY.id) JOY.active = false; };
cv.addEventListener('pointerup', endJoy); cv.addEventListener('pointercancel', endJoy);

let buttons = [];
function btn(x, y, w, h, label, fn, opt = {}) { buttons.push({ x, y, w, h, fn, css: BTN_CSS });
  ctx.fillStyle = opt.disabled ? '#3a3340' : (opt.hl ? '#f2c230' : '#2b5fd9'); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#000'; ctx.fillRect(x, y + h - 2, w, 2);
  txt(label, x + w / 2, y + h / 2 + 3, opt.size || 8, opt.hl ? '#000' : (opt.disabled ? '#888' : '#fff'), 'center'); }
const inB = (p, b) => { const x = b.css ? p.cx : p.x, y = b.css ? p.cy : p.y; return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; };
function hitBtn(p) { return buttons.some(b => inB(p, b)); }
function processClicks() { const q = clickQ; clickQ = []; for (const p of q) for (const b of buttons) if (inB(p, b)) { b.fn(); break; } }
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
let CI_TL = null; const TLd = () => (G && G.ci) ? CI_TL : D.timeline;

function newRun(charId, levelId) {
  LV = levelDef(levelId || DBG.level || META.levelSel || 'lobby'); const dbgLv = DBG.on && DBG.level && LV.id === DBG.level && (LV.mode === 'checkin' || LV.id === DBG.level); /* QA debug only: ?debug=1&level=<id> bypasses level locks */ if (!levelPlayable(LV) && !dbgLv) LV = levelDef('lobby'); if (!dbgLv) META.levelSel = LV.id;
  if (LV.mode === 'checkin' && D.checkin && !D.checkin.guests.some(g => g.id === charId)) charId = D.checkin.guests[0].id;
  const ch = D.characters.find(c => c.id === charId) || (D.checkin && D.checkin.guests.find(c => c.id === charId)) || D.characters[0]; const b = ch.bonus || {};
  G = { state: 'play', t: DBG.t, kills: 0, karens: 0, keys: 0, lvl: 1, xp: 0, xpNext: 5, char: ch, weapons: [], passives: [], boss: null, mini: null, inspSpawned: false, duenoSpawned: false,
    nextElite: TLd().firstElite, nextConga: TLd().congaFrom, spawnAcc: 0, rerolls: D.run.rerolls + META.shop.reroll, banishLeft: D.run.banish + (META.shop.banish || 0), banished: {}, banishMode: false, choices: null, chestsOpened: 0, mastered: [], fusions: [], fusionOpts: null, trail: [], dark: 0, pulse: 0, unlockedNow: [], achNow: [], shake: 0,
    evolved: [], ate: {}, minHpFrac: 1, revived: false, trailT: 0, duenoT: null, killed: {}, magnetT: 0, committed: false, stage: null, hz: [], hzT: 1, ctrlT: 0, ctrlKind: null, ctrlImm: 0, rerollsUsed: 0, banishUsed: 0, rescue: null, rescueAt: null, rescuedNow: [], solids: [],
    players: [{ id: 0, inputSlot: 0, charId: ch.id, costume: META.costumeSel[ch.id] || null, anim: 0, input: { mx: 0, my: 0 }, x: 0, y: 0, hp: 0,
      baseMaxHp: 120 + 10 * META.shop.hp + (b.hp || 0), maxHp: 120 + 10 * META.shop.hp + (b.hp || 0), baseRegen: b.regen || 0, basePickup: 40 * (b.pickup || 1), baseDmg: (b.dmg || 1) * (1 + 0.05 * META.shop.dmg) * DBG.dmg, speed: 95, regen: b.regen || 0, armor: 0, pickup: 40 * (b.pickup || 1), heal: b.heal || 1, keyMul: b.keys || 1,
      dmg: (b.dmg || 1) * (1 + 0.05 * META.shop.dmg) * DBG.dmg, cd: 1, xpMul: 1, fx: 1, fy: 0, inv: 0, kbx: 0, kby: 0 }] };
  Object.defineProperty(G, 'p', { get() { return this.players[0]; } }); G.stage = LV.id; G.ci = LV.mode === 'checkin'; ciNames(G.ci); G.ciCallT = 0; G.ciNextElite = G.ci ? D.checkin.eliteFrom : 0;
  if (LV.rescue) { const w = LV.rescue.window || [300, 540]; G.rescueAt = DBG.rescueNow ? DBG.t + 2 : w[0] + Math.random() * (w[1] - w[0]); }
  G.p.hp = G.p.maxHp; recalcPassives();
  for (const P of [ENE, PROJ, PICK, FX]) P.items.forEach(o => o.alive = false);
  addWeapon(ch.weapon); screen = 'play'; META.runs++; saveMeta(); G.minSent = {}; track('run_start', { character: ch.id, outfit: META.costumeSel[ch.id] || 'classic', run: META.runs, stage: LV.id }); track('level_selected', { stage: LV.id });
  if (DBG.t) { const T = TLd(); while (G.nextElite < DBG.t) G.nextElite += G.nextElite >= T.highSeason ? T.eliteEveryHS : T.eliteEvery; while (G.nextConga < DBG.t) G.nextConga += T.congaEvery;
    if (DBG.t > T.inspAt + 1) G.inspSpawned = true; }
}
function addWeapon(id) { const LR = D.levelRules; let w = G.weapons.find(w => w.id === id); if (w) w.lvl = Math.min(LR.maxLevel, w.lvl + 1); else G.weapons.push(w = { id, lvl: 1, a: 0, cd: 0 });
  const S = D.weapons[id]; if (G.players) recalcPassives();
  if (w.lvl >= LR.evoLevel && S.evo && !w.evo) { w.evo = true; G.evolved.push(id); if (!META.book.revealed[id + ':w']) { META.book.revealed[id + ':w'] = 1; saveMeta(); } G.banner = { s: tr('¡EVOLUCIÓN: ') + S.evo.name.toUpperCase() + '!', t: 3 }; sfx('win'); }
  if (w.lvl === LR.maxLevel && !G.mastered.includes(id)) { G.mastered.push(id); G.banner = { s: tr('★ MAESTRÍA: ') + (w.evo ? S.evo.name : S.name), t: 2.5 }; } }
function addPassive(id) { let p = G.passives.find(p => p.id === id); if (p) p.lvl = Math.min(D.passives[id].maxLevel || 5, p.lvl + 1); else G.passives.push(p = { id, lvl: 1 });
  if (p.lvl >= 5 && !META.book.revealed[id + ':p']) { META.book.revealed[id + ':p'] = 1; saveMeta(); } recalcPassives(); }
function passiveSum(stat) { let s = 0; for (const p of G.passives) { const per = D.passives[p.id].per; if (per[stat] != null) s += per[stat] * p.lvl; } return s; }
function recalcPassives() { const ch = G.char.bonus || {};
  const ll = G.passives.find(p => p.id === 'llavero'); const extraCount = ll ? D.passives.llavero.per.countAt.filter(l => ll.lvl >= l).length : 0;
  for (const P of G.players) { const maxed = G.weapons.filter(w => w.lvl >= 5).length;
    P.cd = Math.max(0.3, (ch.cd || 1) * (1 + passiveSum('cd'))) / (1 + (ch.cdPerMaxed || 0) * maxed); P.armor = (ch.armor || 0) + passiveSum('armor');
    P.xpMul = (ch.xp || 1) * (1 + passiveSum('xp')) * (G.ci ? D.checkin.xpMul : 1); P.speed = 95 * (ch.speed || 1) * (1 + passiveSum('speed'));
    P.area = 1 + passiveSum('area') + (G.ci && ch.area || 0); P.dur = 1 + passiveSum('duration'); P.extraCount = extraCount; P.luck = passiveSum('luck'); P.dmg = P.baseDmg * (1 + passiveSum('dmg'));
    P.pickup = P.basePickup * (1 + passiveSum('pickup')); P.chestExtra = passiveSum('chestExtra'); P.lifesteal = passiveSum('lifesteal'); P.eliteDmg = 1 + passiveSum('eliteDmg'); P.projSpeed = 1 + passiveSum('projSpeed');
    P.regen = P.baseRegen + passiveSum('regen'); const nm = P.baseMaxHp * (1 + passiveSum('maxHp')); if (P.maxHp && nm > P.maxHp) P.hp += nm - P.maxHp; P.maxHp = nm; } }
function applyMods(o, m) { for (const k in m) { const v = m[k];
  if (k.endsWith('+')) { const b = k.slice(0, -1); o[b] = (o[b] || 0) + v; } else if (k === 'countSet') o.count = v; else if (k === 'cdSet') o.cd = v;
  else if (typeof v === 'number' && typeof o[k] === 'number') o[k] *= v; else o[k] = v; } }
function WS(w) { const B = D.weapons[w.id], LR = D.levelRules, L = Math.min(w.lvl, 5) - 1, o = { wid: w.id }; for (const k in B) if (Array.isArray(B[k])) o[k] = B[k][Math.min(L, B[k].length - 1)];
  if (w.lvl >= 2 && B.effA) applyMods(o, B.effA); if (w.lvl >= 4 && B.effB) applyMods(o, B.effB); if (w.evo) applyMods(o, B.evo.mods);
  if (w.lvl >= 6) applyMods(o, LR.lvl6); if (w.lvl >= 7) { if (o.count != null) o.count += 1; else for (const k of ['radius', 'range']) if (o[k]) o[k] *= LR.lvl7.areaIfNoCount; }
  if (w.lvl >= 8) { o.cd = (o.cd || 1) * LR.lvl8.cd; o.glow = 1; }
  const P = G.p; if (P) { for (const k of ['radius', 'range', 'explode', 'auraR']) if (o[k]) o[k] *= P.area; for (const k of ['life', 'fireDur']) if (o[k]) o[k] *= P.dur;
    if (o.count != null) o.count += P.extraCount; if (o.speed) o.speed *= P.projSpeed; }
  if (G && G.ci && w.id === 'billetes' && o.cd != null) o.cd = Math.max(o.cd, D.checkin.propinaCd);
  return o; }
const PLAYER_R = 9;

// ---------------- spawning -------------
function spawnEnemy(type, x, y, extra) {
  type = ET(type); const e = ENE.get(); if (!e) return null; const d = D.enemies[type], T = TLd(); const boss = isBig(d);
  let hpm = G.ci ? (boss ? 1 : G.ciHp || 1) : (boss ? 1 : 1 + G.t / 240) * (LV ? LV.hpMul || 1 : 1), spm = 1; if (!boss && G.t >= T.highSeason) { hpm *= T.hsHp; spm *= T.hsSpeed; }
  Object.assign(e, { tD: 0, stunT: 0, slowT: 0, slowF: 0, burnT: 0, burnDps: 0, type, x, y, hp: d.hp * hpm, maxHp: d.hp * hpm, spd: d.speed * spm * rnd(0.9, 1.1), r: d.size, d, vx: 0, vy: 0, hits: {}, flash: 0, leader: null, kb: 0, kbx: 0, kby: 0, tA: 0, tB: 0, tC: 0, life: 99, st: 'move', stT: 0, spiral: 0, atkT: 0, ph: Math.random() * 6 });
  if (extra) Object.assign(e, extra); return e;
}
// ---------------- Check-In Mode: the 14 staff as enemies, pressure curve x1.0 -> x1.8 (vida x densidad), max 4 control alive, final staff call (no control)
function ciControlAlive() { let n = 0; for (const e of ENE.items) if (e.alive && e.d.role === 'control') n++; return n; }
function ciStaff(role) { const ids = Object.keys(D.enemies).filter(k => D.enemies[k].role === role); return ids[Math.floor(Math.random() * ids.length)]; }
function spawningCI(dt) { const C = D.checkin, t = G.t, T = TLd(); if (G.victory) return;
  if (!G.duenoSpawned && t >= C.bossAt) { G.duenoSpawned = true; const p = edgePos(10); G.boss = spawnEnemy('dueno', p.x, p.y); G.duenoT = t; sfx('boss'); G.banner = { s: tr('¡EL HOTEL TE QUIERE ECHAR!'), t: 3 }; }
  const cur = C.curve.filter(c => t >= c.from).pop(); const dens = Math.sqrt(cur.p); G.ciHp = Math.sqrt(cur.p); if (ENE.count() >= T.maxEnemies) return;
  let roles = cur.roles, rate = (1.2 + Math.min(t, 600) / 50) * dens; if (G.boss && G.boss.alive) rate *= 0.5;
  if (G.ciCallT > 0) { G.ciCallT -= dt; roles = ['swarm', 'tank']; rate = 22; }
  G.spawnAcc += rate * dt;
  while (G.spawnAcc >= 1) { G.spawnAcc--; let role = roles[Math.floor(Math.random() * roles.length)]; if (role === 'control' && ciControlAlive() >= C.maxControl) role = 'swarm'; const p = edgePos(); spawnEnemy(ciStaff(role), p.x, p.y); }
  if (t >= G.ciNextElite && t < C.bossAt) { G.ciNextElite += cur.eliteEvery || C.eliteEvery * 2; const p = edgePos(); spawnEnemy('st_gerente', p.x, p.y); } }
function ciNames(on) { const C = D.checkin; if (!C) return; if (!CI_ORIG) { CI_ORIG = {}; for (const id in C.skills) CI_ORIG['w:' + id] = D.weapons[id].name; for (const id in C.passives) CI_ORIG['p:' + id] = D.passives[id].name; }
  const L = LANG === 'en' ? 1 : 0; for (const id in C.skills) D.weapons[id].name = on ? C.skills[id][L] : CI_ORIG['w:' + id]; for (const id in C.passives) D.passives[id].name = on ? C.passives[id][L] : CI_ORIG['p:' + id]; }
let CI_ORIG = null;
function edgePos(margin = 30) { const a = Math.random() * Math.PI * 2, R = Math.hypot(W, H) / 2 + margin; return { x: G.p.x + Math.cos(a) * R, y: G.p.y + Math.sin(a) * R }; }
function phaseName() { const T = TLd(), t = G.t; if (G.boss && G.boss.alive) return tr('JEFE FINAL'); if (t >= T.breathFrom && t < T.breathTo) return tr('RESPIRO'); if (t >= T.highSeason) return tr('TEMPORADA ALTA'); return ''; }
function spawning(dt) {
  if (G.ci) return spawningCI(dt);
  const t = G.t, T = TLd(); if (G.victory) return;
  if (!G.inspSpawned && t >= T.inspAt) { G.inspSpawned = true; const p = edgePos(10); G.mini = spawnEnemy('inspeccion', p.x, p.y); sfx('boss'); G.banner = { s: LV.id === 'lobby' ? tr('¡LLEGÓ LA INSPECCIÓN! · TEMPORADA ALTA') : '¡' + G.mini.d.name.toUpperCase() + '! · ' + tr('TEMPORADA ALTA'), t: 3 }; }
  if (!G.duenoSpawned && t >= T.dueAt) { G.duenoSpawned = true; const p = edgePos(10); G.boss = spawnEnemy('dueno', p.x, p.y); if (G.boss && G.boss.d.ai && G.boss.d.ai.fixed) { G.boss.x = G.p.x; G.boss.y = G.p.y - 110; } G.duenoT = t; sfx('boss'); G.banner = { s: LV.id === 'lobby' ? tr('¡EL DUEÑO DEL HOTEL!') : '¡' + G.boss.d.name.toUpperCase() + '!', t: 3 }; }
  if (t >= T.breathFrom && t < T.breathTo) return;          // 15s breathing room
  if (ENE.count() >= T.maxEnemies) return;
  let rate = 1.2 + Math.min(t, 600) / 50; if (t >= 240) rate *= 2; if (t >= 480) rate *= 1.4; if (G.boss || G.mini) rate *= 0.5; rate *= (LV.densityMul || 1) * (G.ruleMul || 1);
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
  if (!e.alive || e.hidden) return; if (key) { if (e.hits[key] === G.pulse) return; e.hits[key] = G.pulse; }
  const P = G.p, S = CURS, big = isBig(e.d);
  if (G.ci && S && S.wid === 'billetes' && !e.d.elite && !big) { e.lureT = 2; e.lx = e.x + (e.x - P.x); e.ly = e.y + (e.y - P.y); }
  if (G.ci && S && S.stun && big) { e.slowT = 1.5; e.slowF = Math.max(e.slowF, D.checkin.bossStunSlow); }
  if (e.d.shield) { const fx = e.vx || 0, fy = e.vy || 0, ox = (sx ?? P.x) - e.x, oy = (sy ?? P.y) - e.y, ol = Math.hypot(ox, oy) || 1; if ((fx * ox + fy * oy) / ol > e.d.shield.arc) { amt *= 1 - e.d.shield.block; e.blocked = (e.blocked || 0) + 1; } }
  amt *= P.dmg; if (e.d.elite || big) amt *= P.eliteDmg * (S && S.eliteDmg ? S.eliteDmg : 1); if (big && G.ci && G.char.bonus.bossDmg) amt *= 1 + G.char.bonus.bossDmg; /* Karen: AoE-only kit has ~1/6 the single-target DPS of Valija/Apurado */
  let crit = false; if ((S && S.crit) || (P.luck > 0 && Math.random() < P.luck)) { amt *= D.run.critMul; crit = true; }
  if (e.stunT > 0 && G.frozenMul) amt *= G.frozenMul;
  e.hp -= amt; e.flash = 0.08;
  if (S) { if (S.slow) { e.slowT = 1.5; e.slowF = Math.max(e.slowF, S.slow); } if (S.stun && !big) e.stunT = Math.max(e.stunT, S.stun); if (S.freeze && !big) e.stunT = Math.max(e.stunT, S.freeze); if (S.burn) { e.burnT = 2 * P.dur; e.burnDps = Math.max(e.burnDps, S.burn); } }
  if (kb && !big && e.st !== 'dash') { const ox = sx ?? P.x, oy = sy ?? P.y, dx = e.x - ox, dy = e.y - oy, d = Math.hypot(dx, dy) || 1; e.kb = 0.12; e.kbx = dx / d * kb * (e.d.elite ? 0.4 : 1); e.kby = dy / d * kb * (e.d.elite ? 0.4 : 1); }
  if (amt >= 1 && (crit || Math.random() < 0.3)) { const f = FX.get(); if (f) Object.assign(f, { kind: 'num', x: e.x + rnd(-4, 4), y: e.y - e.r - 10, t: 0, dur: 0.5, v: Math.round(amt) + (crit ? '!' : ''), col: crit ? '#ffd23f' : null, vx: 0 }); }
  sfx('hit'); if (e.hp <= 0) { if (S && S.healOnKill) P.hp = Math.min(P.maxHp, P.hp + S.healOnKill); if (S && S.chestOnKill && Math.random() < S.chestOnKill) drop('chest', e.x, e.y, 1); kill(e); }
}
function foodCount() { let c = 0; for (const k of PICK.items) if (k.alive && k.food) c++; return c; }
function dropFood(e) { if (G.noFood) return; const F = D.food, d = e.d; const big = isBig(d);
  const cat = big ? 'boss' : d.elite ? 'elite' : e.type === 'despedida' ? 'despedida' : 'normal';
  if (Math.random() >= F.chance[cat] * (1 + (G.p.luck || 0) * 2)) return; if (!big && foodCount() >= F.maxOnScreen) return;
  let id = 'buffet'; if (!big) { const wts = F.weights[cat === 'elite' ? 'elite' : 'normal'], tot = wts.reduce((a, b) => a + b, 0); let r = Math.random() * tot; id = F.order[0];
    for (let i = 0; i < wts.length; i++) { if ((r -= wts[i]) < 0) { id = F.order[i]; break; } } }
  const p = PICK.get(); if (p) Object.assign(p, { kind: 'food_' + id, food: id, x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), v: 0, mag: false, life: F.despawn }); }
function kill(e) {
  e.alive = false; G.kills++; sfx('die'); G.killed[e.type] = (G.killed[e.type] || 0) + 1; if (e.type === 'karen') G.karens++;
  const f = FX.get(); if (f) Object.assign(f, { kind: 'poof', x: e.x, y: e.y, t: 0, dur: 0.3, vx: 0 });
  const d = e.d; const xv = d.xp * (e.type === 'despedida' ? D.run.despedidaXpMul : 1) * (G.spaR && dist2(e, G.p) < G.spaR * G.spaR ? G.spaXp : 1); if (xv) drop(xv >= 5 ? 'tipBig' : 'tip', e.x, e.y, xv);
  if (G.p.lifesteal && Math.random() < G.p.lifesteal) G.p.hp = Math.min(G.p.maxHp, G.p.hp + 1);
  if ((d.elite || d.miniboss) && Math.random() < D.run.chest.eliteChance) drop('chest', e.x, e.y, 1);
  const k = d.keys || (Math.random() < 0.012 * (1 + G.p.luck * 4) ? 1 : 0); for (let i = 0; i < k; i++) drop('key', e.x + rnd(-14, 14), e.y + rnd(-14, 14), 1);
  dropFood(e);
  if (d.onDeath === 'queja3') for (let i = 0; i < 3; i++) { const a = Math.atan2(G.p.y - e.y, G.p.x - e.x) + (i - 1) * 0.5; const q = spawnEnemy('queja', e.x, e.y); if (q) { q.vx = Math.cos(a); q.vy = Math.sin(a); q.life = 10; } }
  if (d.miniboss) { G.mini = null; G.banner = { s: e.type === 'inspeccion' ? tr('¡INSPECCIÓN APROBADA! Sigue la Temporada Alta…') : '¡' + d.name.toUpperCase() + ' ' + tr('DERROTADO') + '!', t: 3 }; sfx('lvl'); }
  if (d.onDeath === 'explode') { const f2 = FX.get(); if (f2) Object.assign(f2, { kind: 'xpl', x: e.x, y: e.y, t: 0, dur: 0.35, r: d.explodeR, vx: 0 }); if (dist2(e, G.p) < d.explodeR ** 2) hurtBy(d.explodeDmg, 'enemy'); }
  if (d.behavior === 'dueno' || d.final) { G.duenoKillTime = G.t - (G.duenoT ?? G.t); G.boss = null; G.victory = true; G.banner = { s: LV.id === 'lobby' ? tr('¡EL HOTEL ES TUYO!') : '¡' + tr('NIVEL SUPERADO') + ': ' + LV.name.toUpperCase() + '!', t: 3 }; sfx('win'); for (const o of ENE.items) if (o.alive) o.alive = false; setTimeout(() => endRun(true), 1500); }
}
function drop(kind, x, y, v) { if (kind === 'chest' && G.noChests) return; const p = PICK.get(); if (p) Object.assign(p, { kind, x, y, v, mag: false, food: null, life: 999 }); }

// ---------------- enemies -------------
function enemiesUpdate(dt) {
  const P = G.p;
  for (const e of ENE.items) { if (!e.alive) continue; e.flash -= dt; e.atkT -= dt;
    const d = e.d; let tx = P.x, ty = P.y; if (e.lureT > 0) { e.lureT -= dt; tx = e.lx; ty = e.ly; }
    if (d.tell) { e.tT = (e.tT || 0) + dt; if (!e.ph2) e.ph2 = 'walk';   // Plomero: sinks, 1 s tell at the exit point, then reappears
      if (e.ph2 === 'walk' && e.tT > 5) { e.ph2 = 'hidden'; e.tT = 0; } else if (e.ph2 === 'hidden' && e.tT > 1.2) { e.ph2 = 'tell'; e.tT = 0; const a = Math.random() * 6.28; e.x = P.x + Math.cos(a) * 70; e.y = P.y + Math.sin(a) * 70; } else if (e.ph2 === 'tell' && e.tT >= 1) { e.ph2 = 'walk'; e.tT = 0; e.tells = (e.tells || 0) + 1; }
      e.hidden = e.ph2 !== 'walk'; if (e.hidden) continue; }
    if (e.burnT > 0) { e.burnT -= dt; e.hp -= e.burnDps * dt; if (e.hp <= 0) { kill(e); continue; } }
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowF = 0; }
    const mv = e.stunT > 0 ? 0 : 1 - e.slowF; if (e.stunT > 0) e.stunT -= dt; e.mv = mv;
    if (e.kb > 0) { e.kb -= dt; e.x += e.kbx * dt; e.y += e.kby * dt; }
    else if (d.behavior === 'line') { e.x += e.vx * e.spd * mv * dt; e.y += e.vy * e.spd * mv * dt; e.life -= dt; if (e.life <= 0) { e.alive = false; continue; } }
    else if (d.behavior === 'dueno') duenoAI(e, dt);
    else if (d.behavior === 'lvboss') lvbossAI(e, dt);
    else { if (d.behavior === 'conga' && e.leader) { if (e.leader.alive && e.leader.type === 'despedida') { tx = e.leader.x - (e.leader.vx || 0) * 22; ty = e.leader.y - (e.leader.vy || 0) * 22; } else e.leader = null; }
      const dx = tx - e.x, dy = ty - e.y, dd = Math.hypot(dx, dy) || 1; let sp = e.spd; if (d.behavior === 'conga' && e.leader && dd < 20) sp = 0;
      e.vx = dx / dd; e.vy = dy / dd; let wx = 0, wy = 0; if (d.behavior === 'ghost') { const s = Math.sin(G.t * 3 + e.ph) * 0.8; wx = -e.vy * s; wy = e.vx * s; }
      const wm = G.water && inWater(e.x, e.y) ? G.water : 1; e.x += (e.vx + wx) * sp * mv * wm * dt; e.y += (e.vy + wy) * sp * mv * wm * dt;
      if (d.shoot) { e.tS = (e.tS || 0) + dt; if (e.tS > d.shoot.every && dist2(e, P) < d.shoot.range ** 2) { e.tS = 0; const pr = enemyShot(e, Math.atan2(P.y - e.y, P.x - e.x), d.shoot.speed, d.shoot.dmg, d.shoot.spr); if (pr && d.shoot.ctrl) { pr.ctrl = d.shoot.ctrl; pr.ctrlDur = d.shoot.ctrlDur || 1; pr.vx0 = Math.cos(Math.atan2(P.y - e.y, P.x - e.x)); pr.vy0 = Math.sin(Math.atan2(P.y - e.y, P.x - e.x)); } } }
      if (d.heal) { e.tH = (e.tH || 0) + dt; if (e.tH > d.heal.every) { e.tH = 0; for (const o of ENE.items) if (o.alive && o !== e && !isBig(o.d) && dist2(o, e) < d.heal.r ** 2) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * d.heal.pct); const f3 = FX.get(); if (f3) Object.assign(f3, { kind: 'phasefx', spr: d.heal.fx, x: e.x, y: e.y - 10, t: 0, dur: 0.4, vx: 0 }); } }
      if (d.buff) { e.tH = (e.tH || 0) + dt; if (e.tH > 1) { e.tH = 0; for (const o of ENE.items) if (o.alive && !o.buffed && !o.d.elite && !isBig(o.d) && dist2(o, e) < d.buff.r ** 2) { o.buffed = true; o.spd *= d.buff.mul; } } }
      if (d.summonEvery) { e.tD += dt; if (e.tD > d.summonEvery) { e.tD = 0; for (let i = 0; i < d.summonCount; i++) { const a = i * 6.28 / d.summonCount; spawnEnemy(d.summon, e.x + Math.cos(a) * 26, e.y + Math.sin(a) * 26); } } }
      if (d.behavior === 'boss') inspAI(e, dt); }
    const big = isBig(d);
    if (G.solids.length && d.behavior !== 'line' && !big) solidsCollide(e, e.r);
    if (!d.elite && !big && d.behavior !== 'line' && dist2(e, P) > (W + H) ** 2) { const p = edgePos(); e.x = p.x; e.y = p.y; }
    const rr = e.r + PLAYER_R - 3;
    if (dist2(e, P) < rr * rr && !(G.quarR && dist2(e, P) < G.quarR * G.quarR)) { hurt(d.dmg * (1 + Math.min(G.t, 900) / 600)); if (d.onHit === 'mark') applyControl('slow', 1.5); if (d.bounce) { const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy) || 1; e.kb = 0.35; e.kbx = dx / dd * 260; e.kby = dy / dd * 260; } if (d.push) { const dx = P.x - e.x, dy = P.y - e.y, dd = Math.hypot(dx, dy) || 1; P.kbx = dx / dd * d.push; P.kby = dy / dd * d.push; } }
  }
  const arr = ENE.items, off = Math.floor(G.t * 60); for (let i = 0; i < arr.length; i++) { const a = arr[i]; if (!a.alive || a.d.behavior === 'line' || a.d.behavior === 'ghost') continue; const b = arr[(i * 7 + off) % arr.length];
    if (b !== a && b.alive && b.d.behavior !== 'line' && b.d.behavior !== 'ghost') { const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy, m = a.r + b.r; if (d2 < m * m && d2 > 0.01) { const d = Math.sqrt(d2), push = (m - d) / 2; a.x += dx / d * push; a.y += dy / d * push; b.x -= dx / d * push; b.y -= dy / d * push; } } }
}
function enemyShot(e, a, spd, dmg, spr) { return fireProj({ team: 1, spr, x: e.x, y: e.y - 10, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, dmg, life: 5, r: 5, spin: 6 }); }
function inspAI(e, dt) { e.tA += dt; e.tB += dt;
  if (e.tA > 2.4) { e.tA = 0; const base = Math.atan2(G.p.y - e.y, G.p.x - e.x); for (let i = -4; i <= 4; i++) enemyShot(e, base + i * 0.18, 130, 12, e.d.shot || 'memo'); sfx('shoot'); }
  if (e.tB > 7) { e.tB = 0; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; spawnEnemy(e.d.summon ? e.d.summon[i % 2] : (i % 2 ? 'apurado' : 'valija'), e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40); } } }
function duenoAI(e, dt) {
  const C = TLd().dueno, P = G.p, f = e.hp / e.maxHp; e.phase = f > C.phase2 ? 1 : f > C.phase3 ? 2 : 3;
  const chase = k => { const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1; e.vx = dx / d; e.vy = dy / d; e.x += e.vx * e.spd * k * dt; e.y += e.vy * e.spd * k * dt; };
  if (e.phase < 3) { chase(1); e.tA += dt; const every = e.phase === 1 ? C.spiralEvery : C.spiralEvery2;
    while (e.tA > every) { e.tA -= every; e.spiral += 0.37; const arms = e.phase === 1 ? 1 : 2; for (let k = 0; k < arms; k++) enemyShot(e, e.spiral + k * Math.PI, C.bulletSpeed, C.bulletDmg, 'billete'); e.atkT = 0.3; }
    if (e.phase === 2) { e.tB += dt; if (e.tB > C.summonEvery || !e.summoned) { e.tB = 0; e.summoned = true; for (let i = 0; i < C.summonCount; i++) { const a = i * Math.PI / 2; spawnEnemy('abogado', e.x + Math.cos(a) * 60, e.y + Math.sin(a) * 60); } G.banner = { s: tr('¡Llamó a sus abogados!'), t: 1.5 }; } } }
  else { e.stT -= dt; if (!e.p3 && e.d.ciCall) { G.ciCallT = e.d.ciCall.dur; e.sprNow = e.d.sprF3; for (const o of ENE.items) if (o.alive && o.d.role === 'control') o.alive = false; const fx = FX.get(); if (fx) Object.assign(fx, { kind: 'phasefx', spr: e.d.ciCall.fx, x: e.x, y: e.y - 20, t: 0, dur: 0.6, vx: 0 }); track('boss_phase_reached', { stage: G.stage, phase: 3, t: Math.floor(G.t) }); }
    if (!e.p3) { e.p3 = true; e.st = 'rest'; e.stT = 0.5; G.banner = { s: tr('¡EL DUEÑO ESTÁ FURIOSO!'), t: 2 }; }
    if (e.st === 'rest') { chase(0.6); if (e.stT <= 0) { e.st = 'tele'; e.stT = C.telegraph; const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1; e.dx = dx / d; e.dy = dy / d; sfx('hurt'); } }
    else if (e.st === 'tele') { if (e.stT <= 0) { e.st = 'dash'; e.stT = C.dashTime; } }
    else if (e.st === 'dash') { e.vx = e.dx; e.vy = e.dy; e.x += e.dx * C.dashSpeed * dt; e.y += e.dy * C.dashSpeed * dt; if (e.stT <= 0) { e.st = 'rest'; e.stT = C.rest; } } }
}
// blackout (visionMask): every N s for dur s; never starts while the Caldera vents; rescue zone stays lit. Conserje: blackouts survived without damage
function blackoutUpdate(dt) { const B = HZ('visionMask'); if (!B) return; if (G.boNext == null) G.boNext = B.first; const venting = G.boss && G.boss.alive && G.boss.venting;
  if (G.boT > 0) { G.boT -= dt; if (G.boT <= 0) { if (!G.boHit) { G.boClean = (G.boClean || 0) + 1; checkLevelAch(); } } }
  else if (G.t >= G.boNext) { if (venting) G.boNext = G.t + 0.5; else { G.boT = B.dur; G.boHit = false; G.boNext = G.t + B.every; G.boCount = (G.boCount || 0) + 1; } } }
function isDark(x, y) { const B = HZ('visionMask'); if (!B || !(G.boT > 0)) return false; if (inRescueZone(x, y, 0)) return false; return dist2({ x, y }, G.p) > B.radius ** 2; }
// wind (globalForce): direction changes every N s with a 1 s warning; push = frac x the character's own speed (<= 25%); none inside the rescue zone; touching edges never damages
function windVec(x, y) { const Wd = HZ('globalForce'); if (!Wd || G.windWarn > 0 || !G.windDir) return { x: 0, y: 0 }; if (inRescueZone(x, y, 0)) return { x: 0, y: 0 }; const f = Wd.frac * G.p.speed; return { x: Math.cos(G.windDir) * f, y: Math.sin(G.windDir) * f }; }
function windUpdate(dt) { const Wd = HZ('globalForce'); if (!Wd) return; if (G.windNext == null) { G.windNext = G.t; G.windDir = 0; }
  if (G.windWarn > 0) { G.windWarn -= dt; if (G.windWarn <= 0) G.windDir = G.windPend; }
  if (G.t >= G.windNext) { G.windNext = G.t + Wd.every; G.windPend = Math.floor(Math.random() * 4) * Math.PI / 2; G.windWarn = Wd.warn; G.banner = { s: tr('¡Cambia el viento!'), t: 1 }; } }
// helicopter: straight line through the player, 1.5 s warning line, then crosses; never during the final boss; no damage inside the rescue zone
function heliUpdate(dt) { const Hh = HZ('heli'); if (!Hh) return; if (G.heliNext == null) G.heliNext = Hh.first; const P = G.p; const bossOn = G.boss && G.boss.alive;
  if (!G.heli && G.t >= G.heliNext && !bossOn && G.t < TLd().dueAt - Hh.warn - Hh.cross) { const a = Math.random() * Math.PI; G.heli = { x: P.x, y: P.y, a, t: 0, warn: Hh.warn, cross: Hh.cross, hit: false }; G.heliNext = G.t + Hh.every; G.heliCount = (G.heliCount || 0) + 1; }
  const h = G.heli; if (!h) return; if (bossOn) { G.heli = null; return; } h.t += dt; if (h.t < h.warn) return; const k = (h.t - h.warn) / h.cross; if (k > 1) { G.heli = null; return; }
  const L = 420, hx = h.x + Math.cos(h.a) * L * (2 * k - 1), hy = h.y + Math.sin(h.a) * L * (2 * k - 1); h.hx = hx; h.hy = hy;
  const nx = -Math.sin(h.a), ny = Math.cos(h.a), off = (P.x - h.x) * nx + (P.y - h.y) * ny; if (!h.hit && Math.abs(off) < Hh.w && dist2(P, { x: hx, y: hy }) < 40 * 40 && !inRescueZone(P.x, P.y, 0)) { h.hit = true; hurtBy(Hh.dmg, 'helicoptero'); } }
// Fondo Buitre: one rule per phase (x1.5 enemies -> no chests -> no food, max 60 s, closes under 15% hp)
function bossRulesUpdate(dt) { const b = G.boss; G.ruleMul = 1; G.noChests = false; G.noFood = false; if (!b || !b.alive || !b.d.ai || !b.d.ai.phases) return; const PH = b.d.ai.phases, f = b.hp / b.maxHp;
  let i = 0; for (let j = 0; j < PH.length; j++) if (f <= PH[j].hp) i = j; if (b.bph !== i) { b.bph = i; b.bphT = 0; b.sprNow = PH[i].spr; const fx = FX.get(); if (fx) Object.assign(fx, { kind: 'phasefx', spr: b.d.ai.phaseFx, x: b.x, y: b.y - 20, t: 0, dur: 0.6, vx: 0 }); G.banner = { s: b.d.name.toUpperCase() + ' · ' + tr('FASE') + ' ' + (i + 1), t: 2 }; track('boss_phase_reached', { stage: G.stage, phase: i + 1, t: Math.floor(G.t) }); }
  b.bphT += dt; const ph = PH[i]; if (ph.maxSec && (b.bphT > ph.maxSec || f < ph.closeAt)) return; if (ph.rule === 'enemiesX') G.ruleMul = ph.mul; if (ph.rule === 'noChests') G.noChests = true; if (ph.rule === 'noFood') G.noFood = true; }
function checkLevelAch() { for (const u of LV.unlockables || []) if (u.how === 'ach' && u.cond.blackoutsNoDmg && (G.boClean || 0) >= u.cond.blackoutsNoDmg && unlockChar(u.char, 'ach')) { G.unlockedNow.push(D.characters.find(c => c.id === u.char).name); G.banner = { s: tr('¡Nuevo empleado!') + ' ' + D.characters.find(c => c.id === u.char).name, t: 3 }; } }
// generic level boss (data.enemies[*].ai): chase + arc/spiral shots + summons + relax zones; phase 2 under ai.phase2 hp
function lvbossAI(e, dt) { const A = e.d.ai, P = G.p, f = e.hp / e.maxHp, ph = f > (A.phase2 || 0) ? 1 : 2; e.phase = ph;
  const dx = P.x - e.x, dy = P.y - e.y, dd = Math.hypot(dx, dy) || 1; e.vx = dx / dd; e.vy = dy / dd; if (!A.fixed) { e.x += e.vx * e.spd * dt; e.y += e.vy * e.spd * dt; } e.tA += dt; e.tB += dt; e.tC += dt;
  if (A.ringEvery) { e.tR = (e.tR || 0) + dt; if (G.boT > 0 && e.tR > A.ringEvery - 0.8) e.tR = A.ringEvery - 0.8 - 1e-6; e.venting = e.tR > A.ringEvery - 0.8; /* never vents during a blackout */ if (e.tR > A.ringEvery / (ph === 2 ? 1.4 : 1)) { e.tR = 0; G.hz.push({ kind: 'ring', x: e.x, y: e.y - 20, r: 10, t: 0, warn: 0, dur: A.ringMax / A.ringSpeed, speed: A.ringSpeed, dmg: A.ringDmg, spr: A.ringFx }); sfx('shoot'); } }
  if (A.pipeEvery) { e.tP = (e.tP || 0) + dt; if (e.tP > A.pipeEvery) { e.tP = 0; for (let i = 0; i < A.pipeCount; i++) { const a = Math.random() * 6.28, r = rnd(50, 140), x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r; if (!inRescueZone(x, y)) G.hz.push({ kind: 'burner', spr: 'hz_tubo', x, y, r: 16, t: 0, warn: 1.2, dur: 2.7, dps: 12 }); } } }
  if (A.arcEvery && e.tA > A.arcEvery / ph) { e.tA = 0; const b = Math.atan2(dy, dx); for (let i = 0; i < A.arcCount; i++) enemyShot(e, b + (i - (A.arcCount - 1) / 2) * A.arcSpread, A.shotSpeed, A.shotDmg, A.shot); e.atkT = 0.4; sfx('shoot'); }
  if (A.spiralEvery && e.tA > A.spiralEvery * (ph === 2 ? 0.6 : 1)) { e.tA = 0; e.spiral += 0.41; enemyShot(e, e.spiral, A.shotSpeed, A.shotDmg, A.shot); e.atkT = 0.2; }
  if (A.summonEvery && e.tB > A.summonEvery) { e.tB = 0; for (let i = 0; i < A.summonCount; i++) { const a = i * 6.28 / A.summonCount; spawnEnemy(A.summon, e.x + Math.cos(a) * 50, e.y + Math.sin(a) * 50); } }
  if (A.relaxEvery && e.tC > A.relaxEvery / ph) { e.tC = 0; G.hz.push({ kind: 'relax', x: P.x, y: P.y, r: A.relaxR, t: 0, warn: A.relaxWarn, dur: A.relaxWarn + 0.4, stun: A.relaxStun }); } }
// control rule (niveles_balance §4): never more than 1 control on the player, then 2 s immunity
function applyControl(kind, dur) { if (!G || G.ctrlT > 0 || G.ctrlImm > 0) return false; G.ctrlT = dur; G.ctrlKind = kind; return true; }
function ctrlMul() { return G.ctrlT > 0 ? (G.ctrlKind === 'stun' ? 0 : G.ctrlKind === 'push' ? 1 : 0.6) : 1; }
function hurtBy(amt, cause) { const before = G.p.hp; hurt(amt); if (G.p.hp < before && cause !== 'enemy') track('hazard_damage', { stage: G.stage, type: cause, character: G.char.id, amount: Math.round(before - G.p.hp) }); }
// water (slowZone): deterministic pools per 256 cell; spawn cell and the rescue room are kept dry
function HZL() { return LV && LV.hazard ? [].concat(LV.hazard) : []; }
function HZ(type) { return HZL().find(h => h.type === type) || null; }
function inWater(x, y) { const H2 = HZ('slowZone'); if (!H2) return false; const c = H2.cell, cx = Math.floor(x / c), cy = Math.floor(y / c);
  if (Math.abs(cx) + Math.abs(cy) <= 1 || ((cx * 92837111) ^ (cy * 689287499)) % H2.every !== 0) return false; const R0 = G.rescue; if (R0 && Math.abs(R0.x - (cx + 0.5) * c) < c && Math.abs(R0.y - (cy + 0.5) * c) < c) return false;
  return Math.abs(x - (cx + 0.5) * c) < H2.poolW / 2 && Math.abs(y - (cy + 0.5) * c) < H2.poolH / 2; }
function inRescueZone(x, y, pad = 20) { const R0 = G.rescue; return R0 && !R0.done && dist2({ x, y }, R0) < (D.rescueRules.radius + pad) ** 2; }
function hazardsUpdate(dt) { const P = G.p, SZ = HZ('slowZone'), H2 = HZ('dmgZone'); G.water = SZ ? SZ.mul : 0;
  if (G.ctrlT > 0) { G.ctrlT -= dt; if (G.ctrlT <= 0) G.ctrlImm = (G.char.bonus && G.char.bonus.ctrlImm) || (D.levelRulesMeta && D.levelRulesMeta.controlImmunity) || 2; } else if (G.ctrlImm > 0) G.ctrlImm -= dt;
  if (H2) { G.hzT -= dt; if (G.hzT <= 0) { G.hzT = H2.every;
      for (let i = 0, n = 0; i < 12 && n < H2.count; i++) { const a = Math.random() * 6.28, r = rnd(H2.minDist, 170), x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r; if (inRescueZone(x, y)) continue; G.hz.push({ kind: 'burner', spr: H2.spr, x, y, r: H2.r, t: 0, warn: H2.warn, dur: H2.warn + H2.fire, dps: H2.dps }); n++; } } }
  blackoutUpdate(dt); windUpdate(dt); heliUpdate(dt); bossRulesUpdate(dt);
  for (const z of G.hz) { z.t += dt; if (z.kind === 'ring') { z.r += z.speed * dt; const d = Math.sqrt(dist2(z, P)); if (!z.hit && Math.abs(d - z.r) < 10 && !inRescueZone(P.x, P.y, 0)) { z.hit = true; hurtBy(z.dmg, 'vapor'); } continue; } const inside = dist2(z, P) < (z.r + 6) ** 2; if (z.t < z.warn || !inside) continue;
    if (z.kind === 'burner' && !inRescueZone(z.x, z.y, 0)) hurtBy(z.dps * 0.6, z.spr === 'hz_tubo' ? 'tubo' : 'hornalla'); if (z.kind === 'relax' && !z.hit) { z.hit = true; if (applyControl('stun', z.stun)) track('hazard_damage', { stage: G.stage, type: 'relax', character: G.char.id, amount: 0 }); } }
  G.hz = G.hz.filter(z => z.t < z.dur); rescueUpdate(dt); }
// rescue (niveles_balance §6): door between rescueAt and the end, 15 s in zone, pause 3 s then decay at 1/2, +30% local density, saved immediately
function rescueUpdate(dt) { const RR = D.rescueRules, L = LV.rescue; if (!L || G.rescueAt == null) return; const P = G.p;
  if (!G.rescue && G.t >= G.rescueAt) { let x, y; for (let i = 0; i < 20; i++) { const a = Math.random() * 6.28; x = P.x + Math.cos(a) * 230; y = P.y + Math.sin(a) * 230; if (!inWater(x, y)) break; }
    G.rescue = { x, y, prog: 0, out: 0, done: false, char: L.char, prop: L.prop, repeat: !!(META.unlocked[L.char] && META.earnedUnlocks[L.char]), acc: 0, t0: G.t, outTotal: 0 };
    const pr = LV.art && LV.art.solids && LV.art.solids[L.prop]; G.solids = [rescueSolid(G.rescue, pr), ...rescueWalls(G.rescue)]; track('rescue_start', { stage: G.stage, char: L.char, minute: Math.floor(G.t / 60), repeat: G.rescue.repeat });
    G.banner = { s: tr('¡Hay alguien atrapado! Quedate en la zona'), t: 3 }; }
  const R0 = G.rescue; if (!R0 || R0.done) return; const inside = dist2(P, R0) < RR.radius ** 2;
  if (inside) { R0.prog = Math.min(RR.hold, R0.prog + dt); R0.out = 0; } else { R0.out += dt; R0.outTotal += dt; if (R0.out > RR.pause) R0.prog = Math.max(0, R0.prog - dt * RR.decay); }
  if (inside) { R0.acc += (1.2 + Math.min(G.t, 600) / 50) * RR.densityBoost * dt; while (R0.acc >= 1) { R0.acc--; const a = Math.random() * 6.28; spawnEnemy('apurado', R0.x + Math.cos(a) * 160, R0.y + Math.sin(a) * 160); } }
  if (R0.prog >= RR.hold) { R0.done = true; G.solids = []; sfx('win'); track('rescue_result', { stage: G.stage, char: R0.char, success: true, minute: Math.floor(G.t / 60), outside: Math.round(R0.outTotal) });
    if (R0.repeat) { drop('chest', R0.x, R0.y, 1); G.banner = { s: tr('¡Rescate! Cofre de agradecimiento'), t: 2.5 }; }
    else { META.rescued[R0.char] = Date.now(); unlockChar(R0.char, 'rescue'); G.rescuedNow.push(R0.char); G.unlockedNow.push(D.characters.find(c => c.id === R0.char).name); G.newHire = { char: R0.char, t: 3 }; G.banner = { s: tr('¡Nuevo empleado!') + ' ' + D.characters.find(c => c.id === R0.char).name, t: 3 }; saveMeta(); } } }
function rescueSolid(R0, hb) { const sh = SHEET[R0.prop], fw = sh ? sh.fw : 64, fs = sh ? sh.fs : 64, ax = sh ? sh.ax : 32, ay = sh ? sh.ay : 62, bx = R0.x, by = R0.y - 48; const h = hb || [2, fs - 24, fw - 4, 24];
  return { x: bx - ax + h[0], y: by - ay + h[1], w: h[2], h: h[3], px: bx, py: by }; }
function rescueWalls(R0) { return [{ x: R0.x - 112, y: R0.y - 112, w: 224 - 0, h: 40, wall: 1 }, { x: R0.x - 112, y: R0.y - 112, w: 12, h: 176, wall: 1 }, { x: R0.x + 100, y: R0.y - 112, w: 12, h: 176, wall: 1 }]; }
function solidsCollide(P, rr) { for (const b of G.solids) { const r = rr || PLAYER_R; if (P.x + r > b.x && P.x - r < b.x + b.w && P.y + r > b.y && P.y - r < b.y + b.h) {
  const l = P.x + r - b.x, rt = b.x + b.w - (P.x - r), t = P.y + r - b.y, bt = b.y + b.h - (P.y - r), m = Math.min(l, rt, t, bt); if (m === l) P.x -= l; else if (m === rt) P.x += rt; else if (m === t) P.y -= t; else P.y += bt; } } }
function hurt(amt) { const P = G.p; if (P.inv > 0 || DBG.god || G.victory) return; if (G.boT > 0) G.boHit = true; P.hp -= Math.max(1, amt - P.armor); P.inv = 0.6; G.shake = 0.15; sfx('hurt');
  const rv = G.char.bonus.revive; if (P.hp <= 0 && rv && !G.revived) { G.revived = true; P.hp = P.maxHp * rv; P.inv = 2; G.banner = { s: tr('¡RESCATE! Revivís al ') + Math.round(rv * 100) + '%', t: 2.5 }; sfx('lvl'); }
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
    if (p.team === 1) { if (dist2(p, P) < (p.r + PLAYER_R) ** 2) { hurt(p.dmg); if (p.ctrl && applyControl(p.ctrl, p.ctrlDur)) { G.ctrlHits = (G.ctrlHits || 0) + 1; if (p.ctrl === 'push') { P.kbx = (p.vx0 || 0) * 220; P.kby = (p.vy0 || 0) * 220; } } p.alive = false; } else if (dist2(p, P) > (W * 1.2) ** 2) p.alive = false; continue; }
    for (const e of ENE.items) { if (!e.alive) continue; if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < (e.r + p.r) ** 2) {
      const id = 'p' + PROJ.items.indexOf(p); if (e.hits[id] > G.t) continue; e.hits[id] = G.t + (p.hitCd || 99);
      damage(e, p.dmg, null, p.w === 'tarjeta' ? 40 : 90, p.x, p.y); if (p.healHit) G.p.hp = Math.min(G.p.maxHp, G.p.hp + p.healHit); if (p.explode) explodeAt(p.x, p.y, p.explode, p.dmg * 0.6, p.S, p.S && p.S.chain ? 3 : 0);
      if (p.foodOnHit && Math.random() < p.foodOnHit && foodCount() < D.food.maxOnScreen) { const q = PICK.get(); if (q) Object.assign(q, { kind: 'food_caramelo', food: 'caramelo', x: p.x, y: p.y, v: 0, mag: false, life: D.food.despawn }); } p.pierce--; if (p.pierce <= 0) { p.alive = false; break; } } }
  }
}
function fusionsUpdate(dt) { const P = G.p; G.frozenMul = 0; G.spaR = 0; G.quarR = 0; if (G.dark > 0) G.dark -= dt;
  G.trail.unshift({ x: P.x, y: P.y }); if (G.trail.length > 120) G.trail.length = 120;
  for (const F of G.fusions) { const f = D.fusions.find(x => x.id === F.id), Q = f.params, st = F.st; F.t += dt; CURS = { healOnKill: Q.healOnKill, chestOnKill: Q.chestOnKill };
    const every = (k, s) => { st[k] = (st[k] ?? 0) - dt; if (st[k] <= 0) { st[k] = s; return true; } return false; };
    const hitCircle = (x, y, R, dmg, key, cd, kb) => { for (const e of ENE.items) if (e.alive && (e.x - x) ** 2 + (e.y - y) ** 2 < (R + e.r) ** 2) { if (key) { if (e.hits[key] > G.t) continue; e.hits[key] = G.t + cd; } damage(e, dmg, null, kb || 0, x, y); } };
    switch (f.id) {
      case 'recepcion24': if (every('drop', Q.every)) { st.list.push({ x: P.x, y: P.y, t: 0 }); if (st.list.length > Q.max) st.list.shift(); }
        for (const b of st.list) { b.t -= dt; if (b.t <= 0) { b.t = Q.pulse; b.ring = 0.35; hitCircle(b.x, b.y, Q.R * P.area, Q.dmg, null, 0, 80); } b.ring -= dt; } break;
      case 'tren': st.list = []; for (let i = 1; i <= Q.n; i++) { const q = G.trail[Math.min(G.trail.length - 1, i * Q.gap / 2)] || P; st.list.push(q); hitCircle(q.x, q.y, 12, Q.dmg, 'tren' + i, Q.hitCd, 100); } break;
      case 'cinta': st.a = (st.a || 0) + Q.spin * dt; st.list = []; for (let i = 0; i < Q.n; i++) { const a = st.a + i * Math.PI * 2 / Q.n, x = P.x + Math.cos(a) * Q.R * P.area, y = P.y + Math.sin(a) * Q.R * P.area; st.list.push({ x, y, a }); hitCircle(x, y, 12, Q.dmg, 'cinta' + i, Q.hitCd, 120); } break;
      case 'cocina': for (const e of ENE.items) if (e.alive && dist2(e, P) < (Q.R * P.area) ** 2) damage(e, Q.dps * dt, null, 0); break;
      case 'cuarentena': G.quarR = Q.R * P.area; for (const e of ENE.items) if (e.alive && dist2(e, P) < G.quarR ** 2) { e.hp -= e.maxHp * Q.pctPerSec * dt * (isBig(e.d) ? 0.2 : 1); if (e.hp <= 0) kill(e); } break;
      case 'seguridad': if (every('d', Q.every)) { const a = Math.atan2(P.fy, P.fx); for (let i = 1; i <= Q.n; i++) { const fx2 = FX.get(); if (fx2) Object.assign(fx2, { kind: 'door', x: P.x + Math.cos(a) * i * Q.gap, y: P.y + Math.sin(a) * i * Q.gap, t: -i * 0.05, dur: 0.6, done: false, R: Q.R, dmg: Q.dmg, S: { crit: true }, vx: 0 }); } } break;
      case 'terraza': if (P.moving && every('f', Q.every)) { const fx2 = FX.get(); if (fx2) Object.assign(fx2, { kind: 'fire', big: true, S: null, x: P.x, y: P.y + 6, t: 0, dur: Q.dur, dps: P.speed * Q.dpsPerSpeed, R: Q.R, vx: 0 }); } break;
      case 'evacuacion': if (every('e', Q.every)) { G.shake = 0.3; for (const e of ENE.items) if (e.alive && e.d.behavior !== 'dueno' && e.d.behavior !== 'boss') { const a = Math.atan2(e.y - P.y, e.x - P.x); const Rr = Math.hypot(W, H) / 2 + 10; e.x = P.x + Math.cos(a) * Rr; e.y = P.y + Math.sin(a) * Rr; damage(e, Q.dmg, null, 0); } const fx2 = FX.get(); if (fx2) Object.assign(fx2, { kind: 'ring', x: P.x, y: P.y, t: 0, dur: 0.5, r: W / 2, evo: true, spr: 'fx_alarma_onda', vx: 0 }); } break;
      case 'spa': G.spaR = Q.R * P.area; G.spaXp = Q.xpMul; for (const e of ENE.items) if (e.alive && dist2(e, P) < G.spaR ** 2) damage(e, Q.dps * dt, null, 0); break;
      case 'valetvip': if (every('v', Q.every)) { const b = Math.random() * 6.28; for (let i = 0; i < Q.n; i++) { const a = b + i * Math.PI * 2 / Q.n; fireProj({ w: 'fus', S: null, spr: 'fus_limusina_vip', x: P.x - Math.cos(a) * 200, y: P.y - Math.sin(a) * 200, vx: Math.cos(a) * Q.speed, vy: Math.sin(a) * Q.speed, dmg: Q.dmg, life: 2.5, r: 16, pierce: 999, hitCd: 1, ang: a, rotTo: true }); } } break;
      case 'inventario': if (every('i', Q.every)) { st.marked = ENE.items.filter(e => e.alive && Math.abs(e.x - P.x) < W / 2 && Math.abs(e.y - P.y) < H / 2); st.boom = Q.delay; }
        if (st.boom > 0) { st.boom -= dt; if (st.boom <= 0) { for (const e of st.marked) if (e.alive) { damage(e, Q.dmg, null, 0); const fx2 = FX.get(); if (fx2) Object.assign(fx2, { kind: 'xpl', S: { chain: 1 }, x: e.x, y: e.y, t: 0, dur: 0.3, r: 18, vx: 0 }); } st.marked = []; G.shake = 0.2; } } break;
      case 'blackfriday': if (every('b', Q.every)) { const x = P.x + rnd(-W / 2, W / 2), y = P.y + rnd(-H / 2, H / 2), fx2 = FX.get(); if (fx2) Object.assign(fx2, { kind: 'strike', S: { chestOnKill: Q.chestOnKill }, spr: 'proj_billete_dorado', x, y, t: 0, dur: 0.45, R: Q.R, dmg: Q.dmg, done: false, tip: 1, vx: 0 }); } break;
      case 'glaciar': G.frozenMul = Q.frozenDmgMul; if (every('g', Q.freezeEvery)) for (const e of ENE.items) if (e.alive && e.d.behavior !== 'dueno' && dist2(e, P) < (Q.R * P.area) ** 2) e.stunT = Math.max(e.stunT, Q.freeze); break;
      case 'torre': st.a = (st.a || 0) + 1.1 * dt; st.list = []; for (let i = 0; i < Q.n; i++) { const a = st.a + i * Math.PI * 2 / Q.n; st.list.push({ x: P.x + Math.cos(a) * Q.R, y: P.y + Math.sin(a) * Q.R * 0.7 }); }
        if (every('s', Q.cd)) for (const q of st.list) { const t = nearestEnemy(260, q); if (t) { const a = Math.atan2(t.y - q.y, t.x - q.x); fireProj({ w: 'fus', S: null, spr: 'proj_misil', x: q.x, y: q.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, dmg: Q.dmg, life: 1.2, r: 4, pierce: 1, ang: a, rotTo: true, explode: 18 }); } }
        for (const k of PICK.items) if (k.alive && !k.food && k.kind !== 'chest') k.mag = true; break;
      case 'desayuno': if (every('t', Q.cd)) for (let i = 0; i < Q.n; i++) { const a = Math.random() * 6.28; fireProj({ w: 'fus', S: null, spr: 'proj_bandeja_dorada', x: P.x, y: P.y, vx: Math.cos(a) * Q.speed, vy: Math.sin(a) * Q.speed, dmg: Q.dmg, life: 5, r: 9, hitCd: 0.5, bounce: true, spin: 10, foodOnHit: Q.food, healHit: Q.heal }); } break;
      case 'banquete': st.a = (st.a || 0) + 4 * dt; if (every('k', Q.every)) { const a = st.a; fireProj({ w: 'fus', S: { healOnKill: Q.healOnKill }, spr: 'cuchillo', x: P.x, y: P.y, vx: Math.cos(a) * Q.speed, vy: Math.sin(a) * Q.speed, dmg: Q.dmg, life: 1.4, r: 5, pierce: 2, ang: a, rotTo: true }); } break;
      case 'apagon': if (every('a', Q.every)) G.dark = Q.dur; if (G.dark > 0) for (const e of ENE.items) if (e.alive && dist2(e, P) > (Q.R * P.area) ** 2) { const big = isBig(e.d); damage(e, (big ? Q.bossDps : Q.dps) * dt, null, 0); } break;
      case 'checkout': if (every('c', Q.every)) { const vis = ENE.items.filter(e => e.alive && !e.d.elite && e.d.behavior !== 'dueno' && e.d.behavior !== 'boss' && Math.abs(e.x - P.x) < W / 2 && Math.abs(e.y - P.y) < H / 2);
        const n = Math.floor(vis.length * Q.pct); for (let i = 0; i < n; i++) { const e = vis.splice(Math.floor(Math.random() * vis.length), 1)[0]; const fx2 = FX.get(); if (fx2) Object.assign(fx2, { kind: 'poof', x: e.x, y: e.y, t: 0, dur: 0.4, vx: 0 }); kill(e); } G.banner = { s: tr('CHECK-OUT FORZADO: -') + n, t: 1.2 }; } break;
      case 'tsunami': if (every('w', Q.every)) { st.wx = P.x - W / 2 - 40; st.on = true; }
        if (st.on) { st.wx += Q.speed * dt; for (const e of ENE.items) if (e.alive && Math.abs(e.x - st.wx) < 20 && Math.abs(e.y - P.y) < H / 2) { if (e.hits.tsu === F.t) continue; if (!(e.hits.tsuW > G.t)) { e.hits.tsuW = G.t + 3; damage(e, Q.dmg, null, 0); e.kb = 0.2; e.kbx = Q.kb; e.kby = 0; } } if (st.wx > P.x + W / 2 + 40) st.on = false; } break;
    } }
  CURS = null; }
function fxUpdate(dt) { for (const f of FX.items) if (f.alive) { f.t += dt; CURS = f.S || null; if (f.vx) { f.x += f.vx * dt; f.y += f.vy * dt; }
  if (f.kind === 'door' && !f.done && f.t >= 0.15) { f.done = true; for (const e of ENE.items) if (e.alive && dist2(e, f) < (f.R + e.r) ** 2) damage(e, f.dmg, null, 120, f.x, f.y); sfx('hit'); }
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
function weaponAvailable(id) { if (G.ci) return !!D.checkin.skills[id]; const r = D.weapons[id].requiresChar; return !r || META.unlocked[r] || G.char.id === r; }
function slotsOpen() { return D.run.slotsStart + D.run.slotOpenLevels.filter(l => G.lvl >= l).length; }
function upgradePool() { const out = [], sl = slotsOpen(), LR = D.levelRules;
  for (const id in D.weapons) { if (G.ci && !D.checkin.skills[id]) continue; if (!weaponAvailable(id) || G.banished['w:' + id]) continue; const w = G.weapons.find(w => w.id === id); if (w ? w.lvl < LR.maxLevel : G.weapons.length < sl) out.push({ kind: 'w', id, lvl: w ? w.lvl + 1 : 1 }); }
  for (const id in D.passives) { const P = D.passives[id]; if (G.ci && !D.checkin.passives[id]) continue; if (G.banished['p:' + id] || (!G.ci && !P.core && G.lvl < D.run.nonCorePassiveFromLevel)) continue; const p = G.passives.find(p => p.id === id); if (p ? p.lvl < (P.maxLevel || 5) : G.passives.length < sl) out.push({ kind: 'p', id, lvl: p ? p.lvl + 1 : 1 }); }
  return out; }
function nChoices() { return G.char.id === 'gerente' ? D.run.choicesGerente : D.run.choices; }
function rollChoices() { const pool = upgradePool(); const c = []; while (c.length < nChoices() && pool.length) c.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  if (!c.length) c.push({ kind: 'heal' }, { kind: 'keys' }); G.choices = c; }
function levelUp() { G.xp -= G.xpNext; G.lvl++; G.xpNext = Math.floor(5 + G.lvl * 4 + G.lvl * G.lvl * 0.35); G.state = 'levelup'; G.banishMode = false; rollChoices(); sfx('lvl');
  if (D.run.slotOpenLevels.includes(G.lvl)) G.banner = { s: tr('¡NUEVO SLOT! (') + slotsOpen() + '+' + slotsOpen() + ')', t: 2.5 }; }
function applyChoice(c) { if (c.kind === 'w') addWeapon(c.id); else if (c.kind === 'p') addPassive(c.id); else if (c.kind === 'heal') G.p.hp = G.p.maxHp; else G.keys += 2; }
function choose(i) { const c = G.choices && G.choices[i]; if (!c) return; if (!G.banishMode) track('level_up_choice', { kind: c.kind, id: c.id || null, lvl: c.lvl || null, playerLevel: G.lvl, options: G.choices.map(o => o.id || o.kind) });
  if (G.banishMode) { if (c.kind === 'w' || c.kind === 'p') { G.banished[c.kind + ':' + c.id] = 1; G.banishLeft--; G.banishUsed++; G.banishMode = false; const pool = upgradePool().filter(o => !G.choices.some(x => x.kind === o.kind && x.id === o.id));
      if (pool.length) G.choices[i] = pool[Math.floor(Math.random() * pool.length)]; else G.choices.splice(i, 1); if (!G.choices.length) rollChoices(); sfx('hurt'); } return; }
  applyChoice(c); G.choices = null; G.state = 'play'; if (G.xp >= G.xpNext) levelUp(); }
function reroll() { if (G.rerolls > 0) { G.rerolls--; G.rerollsUsed++; rollChoices(); sfx('tip'); } }
function toggleBanish() { if (G.banishLeft > 0) G.banishMode = !G.banishMode; }
function fusionHas(f) { return G.fusions.some(x => x.id === f.id); }
function fusionEligible() { if (G && G.ci) return []; const FR = D.fusionRules; if (G.fusions.length >= FR.maxPerRun) return [];
  const rareUsed = G.fusions.filter(x => D.fusions.find(f => f.id === x.id).rare).length;
  return D.fusions.filter(f => { if (fusionHas(f) || (f.rare && rareUsed >= FR.maxRarePerRun)) return false;
    const ws = f.recipe.w.map(id => G.weapons.find(w => w.id === id)); if (ws.some(w => !w || !w.evo || w.lvl < FR.weaponLevel)) return false;
    if (f.recipe.p) { const p = G.passives.find(p => p.id === f.recipe.p); if (!p || p.lvl < FR.passiveLevel) return false; } return true; }); }
function doFusion(f) { track('fusion_made', { id: f.id, rare: !!f.rare, first: !META.book.fused[f.id], minute: Math.floor(G.t / 60) }); for (const id of f.recipe.w) G.weapons = G.weapons.filter(w => w.id !== id); if (f.recipe.p) G.passives = G.passives.filter(p => p.id !== f.recipe.p);
  G.fusions.push({ id: f.id, t: 0, st: { list: [] } }); recalcPassives(); let msg = tr('¡FUSIÓN: ') + f.name.toUpperCase() + '!';
  if (!META.book.fused[f.id]) { META.book.fused[f.id] = Date.now(); META.keys += D.fusionRules.firstTimeKeys; msg += ' +' + D.fusionRules.firstTimeKeys + tr(' llaves'); saveMeta(); }
  G.banner = { s: msg, t: 3.5 }; G.fusionFlash = 1.2; sfx('win'); G.fusionOpts = null; G.state = 'play'; }
function openChest() { const el = fusionEligible(); if (el.length && G.state === 'play') { G.fusionOpts = el.slice(0, 3); G.state = 'fusion'; return; } openChestNormal(); }
function openChestNormal() { const n = Math.random() < D.run.chest.tripleChance + (G.p.chestExtra || 0) ? 3 : 1, got = []; G.chestsOpened++;
  for (let i = 0; i < n; i++) { const pool = upgradePool(); if (!pool.length) { G.keys += 3; got.push(tr('+3 llaves')); continue; } const owned = pool.filter(o => o.kind === 'w' && o.lvl > 1); const list = owned.length && Math.random() < 0.6 ? owned : pool; const c = list[Math.floor(Math.random() * list.length)];
    applyChoice(c); got.push(upLabel(c)[0]); }
  G.banner = { s: tr('🎁 Cofre') + (n === 3 ? ' x3' : '') + ': ' + got.join(', ').slice(0, 60), t: 3 }; sfx('win'); }

// ---------------- achievements / end -------------
function achMet(c) { if (c.checkinWin) return !!(G && G.ci && G.win); if (G && G.ci) return false; const runK = G.committed ? 0 : G.kills, runKar = G.committed ? 0 : G.karens;
  if (c.surviveSec) return G.t >= c.surviveSec; if (c.kill) return (G.killed[c.kill] || 0) > 0; if (c.win) return !!G.win; if (c.totalKills) return META.totalKills + runK >= c.totalKills;
  if (c.runKills) return G.kills >= c.runKills; if (c.evolveAny) return G.evolved.length > 0; if (c.evolve) return G.evolved.includes(c.evolve); if (c.eat) return (G.ate[c.eat] || 0) > 0;
  if (c.karens) return META.stats.karens + runKar >= c.karens; if (c.winAs) return !!G.win && G.char.id === c.winAs; if (c.fullBuild) return G.weapons.length >= 4 && G.passives.length >= 4;
  if (c.wins) return META.wins >= c.wins;
  if (c.evolveCount) return G.evolved.length >= c.evolveCount; if (c.winMinHp) return !!G.win && G.minHpFrac >= c.winMinHp; if (c.winNoFood) return !!G.win && !Object.keys(G.ate).length;
  if (c.duenoUnder) return G.duenoKillTime != null && G.duenoKillTime < c.duenoUnder; if (c.winKills) return !!G.win && G.kills >= c.winKills;
  if (c.fusionsTotal) return Object.keys(META.book.fused).length >= c.fusionsTotal; if (c.fusionsNormal) return D.fusions.filter(f => !f.rare && META.book.fused[f.id]).length >= c.fusionsNormal;
  if (c.allUnlocked) return D.characters.filter(ch => ch.unlock).every(ch => META.unlocked[ch.id] && META.earnedUnlocks[ch.id]); return false; }
function checkAch() { for (const a of D.achievements) if (!META.ach[a.id] && achMet(a.cond)) { const had = { ...META.unlocked }; grantAch(a.id); G.achNow.push(a.name);
  if (a.reward.unlock && !had[a.reward.unlock] && META.unlocked[a.reward.unlock]) G.unlockedNow.push(D.characters.find(c => c.id === a.reward.unlock).name); } }
function levelAchMet(c) { if (!G.win) return false; if (c.winNoReroll) return G.rerollsUsed === 0 && G.banishUsed === 0; if (c.winKillsType) return (G.killed[c.winKillsType] || 0) >= c.n;
  if (c.rescueAndWin) return G.rescuedNow.includes(c.rescueAndWin) || (G.rescue && G.rescue.done && G.rescue.char === c.rescueAndWin); return false; }
function levelUnlocks() { for (const k in D.costumes) { const c = D.costumes[k]; if (c.cond === 'level_win:' + LV.id && !META.costumes[k]) { META.costumes[k] = true; G.costumeNow = k; achToast.push({ s: '👔 ' + tr('Traje desbloqueado'), sub: c.name + ' · ' + D.characters.find(x => x.id === c.char).name, t: 4 }); track('costume_unlocked', { id: k, stage: LV.id }); } }
  for (const u of LV.unlockables || []) if ((u.how === 'win' || (u.how === 'ach' && levelAchMet(u.cond))) && unlockChar(u.char, u.how)) G.unlockedNow.push(D.characters.find(c => c.id === u.char).name); }
function endRun(win) {
  if (!G || G.state === 'over') return; G.state = 'over'; G.win = win;
  track('run_end', { reason: win ? 'victory' : (G.abandoned ? 'abandon' : 'death'), minute: Math.floor(G.t / 60), seconds: Math.floor(G.t), level: G.lvl, fusions: G.fusions.length, kills: G.kills, character: G.char.id, stage: G.stage, rescued: G.rescuedNow.length });
  const LM = D.levelRulesMeta || {}, farm = LV.id === 'lobby' && LM.lobbyFarmMulAfter && META.levelsWon[LM.lobbyFarmMulAfter] ? LM.lobbyFarmMul : 1;
  const kg = Math.round(G.keys * G.p.keyMul * (LV.keyMul || 1) * farm); G.keysFinal = kg; META.keys += kg; META.stats.lifetimeKeys += kg; META.totalKills += G.kills; META.stats.karens += G.karens; META.bestTime = Math.max(META.bestTime, G.t);
  if (win && G.ci) { META.title = D.checkin.reward.title; } if (win && !G.ci) { META.wins++; META.stats.winsAs[G.char.id] = (META.stats.winsAs[G.char.id] || 0) + 1; } G.committed = true;
  META.levelBest[LV.id] = Math.max(META.levelBest[LV.id] || 0, Math.floor(G.t)); if (win) { META.levelsWon[LV.id] = (META.levelsWon[LV.id] || 0) + 1; levelUnlocks(); }
  checkAch(); saveMeta(); if (!win) sfx('lose');
}

// ---------------- update -------------
// Input as data: each player reads a slot. Slot 0 = keyboard + touch joystick. Future co-op: add slots (gamepad/second keyboard set).
function readInput(slot) {
  let mx = 0, my = 0; if (slot !== 0) return { mx, my };
  if (keys.KeyA || keys.ArrowLeft) mx--; if (keys.KeyD || keys.ArrowRight) mx++; if (keys.KeyW || keys.ArrowUp) my--; if (keys.KeyS || keys.ArrowDown) my++;
  if (JOY.active) { const dx = JOY.x - JOY.sx, dy = JOY.y - JOY.sy, d = Math.hypot(dx, dy); const R = MOB.on ? STICK.max : 30, dz = MOB.on ? STICK.dead : 3; if (d > dz) { const m = Math.min(1, MOB.on ? (d - dz) / (R - dz) : d / R); mx = dx / d * m; my = dy / d * m; } }
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; } return { mx, my };
}
function update(dt) {
  if (screen !== 'play' || G.state !== 'play') return;
  G.t += dt;
  for (const m of [5, 10, 15]) if (G.t >= m * 60 && !G.minSent[m]) { G.minSent[m] = 1; if (!DBG.t || DBG.t < m * 60) track('minute_reached', { minute: m, level: G.lvl, character: G.char.id }); }
  for (const P of G.players) {
    const { mx, my } = P.input = readInput(P.inputSlot); const ml = Math.hypot(mx, my);
    if (ml > 0.01) { P.fx = mx / ml; P.fy = my / ml; P.moving = true; } else P.moving = false;
    const sm = ctrlMul() * (G.water && inWater(P.x, P.y) ? G.water : 1); const wv = G.windDir != null ? windVec(P.x, P.y) : null; P.x += (mx * P.speed * sm + P.kbx + (wv ? wv.x : 0)) * dt; P.y += (my * P.speed * sm + P.kby + (wv ? wv.y : 0)) * dt; if (G.solids.length) solidsCollide(P); P.kbx *= Math.pow(0.001, dt); P.kby *= Math.pow(0.001, dt);
    P.anim += dt; P.inv -= dt; const bb = G.char.bonus; let rg = P.regen; if (bb.regenPctStill) rg += P.maxHp * (P.moving ? bb.regenPctMoving : bb.regenPctStill); P.hp = Math.min(P.maxHp, P.hp + rg * dt);
    if (bb.trail && P.moving) { G.trailT -= dt; if (G.trailT <= 0) { G.trailT = bb.trail.every; const f = FX.get(); if (f) Object.assign(f, { kind: 'fire', trail: true, x: P.x, y: P.y + 6, t: 0, dur: bb.trail.dur, dps: bb.trail.dps, R: bb.trail.r, vx: 0 }); } }
  }
  G.shake -= dt;
  spawning(dt); hazardsUpdate(dt); weaponsUpdate(dt); fusionsUpdate(dt); projUpdate(dt); enemiesUpdate(dt); pickUpdate(dt); fxUpdate(dt);
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  if (G.state === 'play') checkAch();
}

// ---------------- render helpers -------------
function draw(spr, x, y, flip, s = 1) { const w = spr.width * s, h = spr.height * s; if (flip) { ctx.save(); ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(spr, Math.round(-w / 2), Math.round(y - h / 2), w, h); ctx.restore(); } else ctx.drawImage(spr, Math.round(x - w / 2), Math.round(y - h / 2), w, h); }
const SHEET = {};
const UI = {};
function loadUI() { const S = window.UI_IMAGES || {}; return Promise.all(Object.keys(S).map(k => new Promise(res => { const img = new Image(); img.onload = () => { UI[k] = img; res(); }; img.onerror = () => res(); img.src = S[k]; }))); }
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
function drawAnim(key, x, footY, frame, flip, s = 1) { const sh = SHEET[key]; if (!sh) { const sp = SPR[key] || placeholder(key); return draw(sp, x, footY - (sp.height / 2 - 3) * s, flip, s); }
  ctx.save(); ctx.translate(Math.round(x), Math.round(footY)); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sh.img, (frame % sh.n) * sh.fw, 0, sh.fw, sh.fs, -sh.ax * s, -sh.ay * s, sh.fw * s, sh.fs * s); ctx.restore(); }
let BOC = null;
function renderLevelTop(cx, cy) { const h = G.heli, Hh = HZ('heli');
  if (h) { const L = 420, x0 = h.x - Math.cos(h.a) * L, y0 = h.y - Math.sin(h.a) * L; ctx.save(); ctx.translate(-cx, -cy);
    if (h.t < h.warn) { const sh = SHEET[Hh.line]; ctx.save(); ctx.translate(x0, y0); ctx.rotate(h.a); for (let d = 0; d < 2 * L; d += 32) { if (sh) ctx.drawImage(sh.img, (Math.floor(G.t * 8) % sh.n) * sh.fw, 0, sh.fw, sh.fs, d, -sh.fs / 2, sh.fw, sh.fs); else { ctx.fillStyle = 'rgba(255,40,40,.5)'; ctx.fillRect(d, -4, 24, 8); } } ctx.restore(); }
    else if (h.hx != null) { const sh = SHEET[Hh.spr]; ctx.save(); ctx.translate(h.hx, h.hy); ctx.rotate(h.a + Math.PI); if (sh) ctx.drawImage(sh.img, (Math.floor(G.t * 16) % sh.n) * sh.fw, 0, sh.fw, sh.fs, -sh.fw / 2, -sh.fs / 2, sh.fw, sh.fs); else { ctx.fillStyle = '#333'; ctx.fillRect(-48, -32, 96, 64); } ctx.restore(); }
    ctx.restore(); }
  if (HZ('globalForce') && G.windDir != null) { const wv = windVec(G.p.x, G.p.y), sh = SHEET.fx_viento_particula; if (wv.x || wv.y) for (let i = 0; i < 18; i++) { const px = ((i * 97 + G.t * wv.x * 6) % W + W) % W, py = ((i * 53 + G.t * wv.y * 6) % H + H) % H; if (sh) drawSpr('fx_viento_particula', px, py, G.windDir, G.t + i); else { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(px, py, 8, 1); } }
    if (G.windWarn > 0) txt('➜', W / 2 + Math.cos(G.windPend) * 140, H / 2 + Math.sin(G.windPend) * 80 + 4, 16, '#fff', 'center'); }
  if (G.boT > 0) { const B = HZ('visionMask'); const c = BOC || (BOC = document.createElement('canvas')); c.width = W; c.height = H; const g = c.getContext('2d'); g.fillStyle = 'rgba(0,0,8,.93)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(G.p.x - cx, G.p.y - cy, B.radius, 0, 6.2832); g.fill(); const R0 = G.rescue; if (R0 && !R0.done) { g.beginPath(); g.arc(R0.x - cx, R0.y - cy, D.rescueRules.radius, 0, 6.2832); g.fill(); } ctx.drawImage(c, 0, 0);
    for (const e of ENE.items) if (e.alive && isDark(e.x, e.y) && e.x > cx && e.x < cx + W && e.y > cy && e.y < cy + H) { ctx.strokeStyle = e.d.elite ? '#ff3df5' : 'rgba(255,255,255,.35)'; ctx.strokeRect(e.x - cx - 6, e.y - cy - 12, 12, 16); } } }
// placeholder art (missing SPR key): sized by prefix (boss 64, elite 48, else 32), colour from the key hash, 3-letter label
function placeholder(key) { key = String(key); if (/^(pl_|cos_)/.test(key)) return SPR.pl_recep; const sz = /^boss_/.test(key) ? 64 : /^elite_/.test(key) ? 48 : /^prop_/.test(key) ? 32 : 32; let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const c = document.createElement('canvas'); c.width = c.height = sz; const g = c.getContext('2d'); g.fillStyle = `hsl(${h % 360},55%,45%)`; g.fillRect(2, 2, sz - 4, sz - 4); g.strokeStyle = '#1a1020'; g.lineWidth = 2; g.strokeRect(2, 2, sz - 4, sz - 4);
  g.fillStyle = '#fff'; g.font = `bold ${Math.max(7, sz / 4)}px monospace`; g.textAlign = 'center'; g.fillText(key.replace(/^(enemy|elite|boss|prop_\w+?)_/, '').slice(0, 3).toUpperCase(), sz / 2, sz / 2 + 3); MISSING_ART[key] = 1; return SPR[key] = c; }
const MISSING_ART = {};
// centered sprite (projectiles/fx/food), optional rotation, animated at ~8fps
function drawSpr(key, x, y, ang = 0, t = 0, s = 1) { const sh = SHEET[key]; ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (ang) ctx.rotate(ang);
  if (sh) ctx.drawImage(sh.img, (Math.floor(t * 8) % sh.n) * sh.fw, 0, sh.fw, sh.fs, -sh.ax * s, -sh.ay * s, sh.fw * s, sh.fs * s);
  else { const sp = SPR[key]; if (sp) ctx.drawImage(sp, -sp.width * s / 2, -sp.height * s / 2, sp.width * s, sp.height * s); } ctx.restore(); }
const ICON = { llave_inglesa: 'wrench', linterna: 'linterna', cuchillos: 'cuchillo', memo: 'memo', billetes: 'billete', botella: 'botella', silbato: 'onda_silbato', piedras: 'piedra_caliente', baston: 'arco_baston', auto: 'auto' };
function weaponIcon(w) { if (G && G.ci && D.checkin.skills[w.id] && !w.evo && SHEET[D.checkin.skills[w.id][2]]) return D.checkin.skills[w.id][2]; const B = D.weapons[w.id]; return w.evo ? B.evo.spr : (ICON[w.id] || w.id); }
function drawIcon(key, x, y, size) { const sh = SHEET[key]; const sw = sh ? sh.fw : (SPR[key] || SPR.tip).width, shh = sh ? sh.fs : (SPR[key] || SPR.tip).height; const s = size / Math.max(sw, shh);
  if (sh) ctx.drawImage(sh.img, 0, 0, sh.fw, sh.fs, x + (size - sw * s) / 2, y + (size - shh * s) / 2, sw * s, shh * s); else if (SPR[key]) ctx.drawImage(SPR[key], x + (size - sw * s) / 2, y + (size - shh * s) / 2, sw * s, shh * s); }
function cosFilter(cos) { const c = cos && D.costumes[cos]; return c && c.filter && !SHEET['cos_' + cos] ? c.filter + (c.animated ? ' brightness(' + (1 + 0.15 * Math.sin(G_now() * 6)).toFixed(2) + ')' : '') : 'none'; }
function playerKey(charId, cos) { return cos && SHEET['cos_' + cos] ? 'cos_' + cos : 'pl_' + charId; }
function fmt(t) { t = Math.max(0, t); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0'); }
function footOf(e) { const b = e.d.behavior; return b === 'boss' || b === 'dueno' ? e.y + e.r * 0.8 : b === 'line' || b === 'ghost' ? e.y + e.r + 4 : e.y + e.r * 0.8; }

const PAT = {};
function renderLevelFloor(cx, cy) { const A = LV.art, k = A && A.bg; const sh = k && SHEET[k]; if (!sh) { ctx.fillStyle = '#2a3238'; ctx.fillRect(0, 0, W, H); return true; }
  const pat = PAT[k] || (PAT[k] = ctx.createPattern(sh.img, 'repeat')); ctx.save(); ctx.translate(-cx, -cy); ctx.fillStyle = pat; ctx.fillRect(cx, cy, W, H); ctx.restore();
  const props = (A.props || []).filter(q => !(A.solids && A.solids[q]) || true).filter(q => !LV.rescue || (q !== LV.rescue.prop && q !== LV.rescue.floorProp)); if (props.length) { const C = 128, x0 = Math.floor(cx / C) - 1, y0 = Math.floor(cy / C) - 1;
    for (let gy = y0; gy < y0 + H / C + 3; gy++) for (let gx = x0; gx < x0 + W / C + 3; gx++) { const h = ((gx * 73856093) ^ (gy * 19349663)) >>> 0; if (h % 5) continue; const px = gx * C + (h >>> 4) % 96, py = gy * C + (h >>> 8) % 96; if (inWater(px, py) || inRescueZone(px, py, 60)) continue;
      drawAnim(props[(h >>> 12) % props.length], px - cx, py - cy, 0, false); } }  // decorative props: no collision on the open field
  return true; }
function renderLevelLayer(cx, cy) { const H2 = HZ('slowZone'), A = LV.art || {};
  if (H2) { const c = H2.cell, wk = A.water && A.water.key, sh = wk && SHEET[wk];
    for (let gy = Math.floor(cy / c) - 1; gy <= Math.floor((cy + H) / c) + 1; gy++) for (let gx = Math.floor(cx / c) - 1; gx <= Math.floor((cx + W) / c) + 1; gx++) { const mx = (gx + 0.5) * c, my = (gy + 0.5) * c; if (!inWater(mx, my)) continue;
      const x = mx - H2.poolW / 2, y = my - H2.poolH / 2; ctx.save(); ctx.beginPath(); ctx.rect(x, y, H2.poolW, H2.poolH); ctx.clip();
      if (sh) { const f = Math.floor(G.t * (A.water.fps || 4)) % sh.n; for (let yy = y; yy < y + H2.poolH; yy += sh.fs) for (let xx = x; xx < x + H2.poolW; xx += sh.fw) ctx.drawImage(sh.img, f * sh.fw, 0, sh.fw, sh.fs, xx, yy, sh.fw, sh.fs); }
      else { ctx.fillStyle = '#2fb7c4'; ctx.fillRect(x, y, H2.poolW, H2.poolH); } ctx.restore(); ctx.strokeStyle = '#e8f4f4'; ctx.lineWidth = 3; ctx.strokeRect(x, y, H2.poolW, H2.poolH); } }
  const R0 = G.rescue; if (R0 && !R0.done) { const RR = D.rescueRules, T = A.tiles, tsh = T && SHEET[T.key];
    // rescue room 7x6 tiles: back wall (wall_top + wall_shadow) with the door, side edges, open front so the player can walk in
    for (let j = -3; j <= 2; j++) for (let i = -3; i <= 3; i++) { const x = R0.x - 16 + i * 32, y = R0.y - 16 + j * 32;
      const side = i === -3 ? 'l' : i === 3 ? 'r' : '', name = j === -3 ? (side ? 'wall_top_end' : 'wall_top') : j === -2 ? 'wall_shadow' : j === 2 ? (side ? 'corner_b' + side : 'edge_b') : side ? 'edge_' + side : 'floor_a';
      const t = tsh && (T.map[name] || T.map.floor_a); if (t) ctx.drawImage(tsh.img, t[0] * 32, t[1] * 32, 32, 32, x, y, 32, 32); else { ctx.fillStyle = j <= -2 ? '#2a2f36' : (i + j) & 1 ? '#3a4a52' : '#46565e'; ctx.fillRect(x, y, 32, 32); } }
    if (LV.rescue && LV.rescue.floorProp) { const fsh = SHEET[LV.rescue.floorProp]; drawAnim(LV.rescue.floorProp, R0.x, R0.y - (fsh ? fsh.fs / 2 - fsh.ay : -48), Math.floor(G.t * 2) % 2, false); }
    const b = G.solids[0]; drawAnim(R0.prop, b ? b.px : R0.x, b ? b.py : R0.y - 48, 0, false);
    ctx.strokeStyle = 'rgba(80,255,160,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(R0.x, R0.y, RR.radius, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(80,255,160,.25)'; ctx.beginPath(); ctx.moveTo(R0.x, R0.y); ctx.arc(R0.x, R0.y, RR.radius, -Math.PI / 2, -Math.PI / 2 + 6.283 * R0.prog / RR.hold); ctx.fill(); }
  for (const z of G.hz) { const warn = z.t < z.warn;
    if (z.kind === 'ring') { ctx.strokeStyle = 'rgba(230,240,255,.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.stroke(); if (SHEET[z.spr]) drawSpr(z.spr, z.x, z.y, 0, z.t * 0.4, z.r / 32); continue; }
    if (z.kind === 'burner') { const hk = z.spr, sh = SHEET[hk]; if (sh) { const fr = warn ? 1 + Math.floor(z.t * 6) % 2 : 3 + Math.floor(z.t * 8) % 3; drawAnim(hk, z.x, z.y + sh.ay - sh.fs / 2, fr, false); } else { ctx.fillStyle = warn ? 'rgba(255,200,0,.35)' : 'rgba(255,80,0,.6)'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.fill(); } }
    if (z.kind === 'relax') { ctx.fillStyle = warn ? 'rgba(200,140,255,.25)' : 'rgba(200,140,255,.55)'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.fill(); } } }
function renderWorld() {
  const P = G.p; let cx = Math.round(P.x - W / 2), cy = Math.round(P.y - H / 2);
  if (G.shake > 0) { cx += Math.round(rnd(-2, 2)); cy += Math.round(rnd(-2, 2)); }
  const ox = -(((cx % 64) + 64) % 64), oy = -(((cy % 64) + 64) % 64);
  if (LV.id === 'lobby' || !renderLevelFloor(cx, cy)) for (let y = oy; y < H; y += 64) for (let x = ox; x < W; x += 64) { ctx.drawImage(SPR.tile, x, y);
    const tx = Math.floor((x + cx) / 64), ty = Math.floor((y + cy) / 64); if (((tx * 73856093) ^ (ty * 19349663)) % 11 === 0) ctx.drawImage(SPR.plant, x + 2, y + 2); }
  if (G.t >= TLd().highSeason && !(G.boss && G.boss.alive)) { ctx.fillStyle = 'rgba(255,120,40,.07)'; ctx.fillRect(0, 0, W, H); }
  G.camX = cx; G.camY = cy; ctx.save(); ctx.translate(-cx, -cy); if (LV.id !== 'lobby') renderLevelLayer(cx, cy);
  for (const f of FX.items) if (f.alive && f.kind === 'puddle') { ctx.globalAlpha = 1 - f.t / f.dur * 0.6; drawSpr('charco', f.x, f.y, 0, f.t); ctx.globalAlpha = 1; }
  for (const f of FX.items) if (f.alive && f.kind === 'fire' && f.trail) { ctx.fillStyle = `rgba(255,215,64,${0.35 * (1 - f.t / f.dur)})`; ctx.fillRect(f.x - 4, f.y - 2, 8, 4); }
  for (const f of FX.items) if (f.alive && f.kind === 'fire' && !f.trail) { const sh = SHEET.llama_piso; if (sh) { ctx.globalAlpha = Math.min(1, (f.dur - f.t) * 2); const fk = f.big && SHEET.fx_barra_libre_fuego ? 'fx_barra_libre_fuego' : 'llama_piso'; for (let i = 0; i < 3; i++) drawAnim(fk, f.x + (i - 1) * f.R * 0.6, f.y + 6, Math.floor((f.t + i * 0.3) * 8), false); ctx.globalAlpha = 1; } else { ctx.fillStyle = 'rgba(255,120,0,.4)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.R, 0, 7); ctx.fill(); } }
  for (const k of PICK.items) if (k.alive) { const blink = k.food && k.life < 4 && Math.floor(k.life * 6) % 2; if (blink) continue;
    if (k.kind === 'chest' && G.fusions.length < 3 && fusionEligible().length) drawSpr('ui_cofre_violeta', k.x, k.y, 0, G.t * 0.4); else if (k.food) drawSpr(k.kind, k.x, k.y + Math.sin(G.t * 4 + k.x) * 1.5); else draw(SPR[k.kind], k.x, k.y + Math.sin(G.t * 5 + k.x) * 1.5); }
  for (const f of FX.items) if (f.alive && f.kind === 'ring') { const k = f.t / f.dur, R = f.r * (0.3 + 0.7 * k);
    if (f.spr && SHEET[f.spr]) { ctx.globalAlpha = 1 - k; drawSpr(f.spr, P.x, P.y, 0, k * 0.24, R / 16); ctx.globalAlpha = 1; }
    else { ctx.strokeStyle = f.evo ? `rgba(255,240,140,${1 - k})` : `rgba(242,194,48,${1 - k})`; ctx.lineWidth = f.evo ? 5 : 3; ctx.beginPath(); ctx.arc(P.x, P.y, R, 0, 7); ctx.stroke(); if (f.evo) { ctx.globalAlpha = 1 - k; drawSpr('evo_campana', P.x, P.y - 26, 0, 0); ctx.globalAlpha = 1; } } }
  for (const w of G.weapons) { const B = D.weapons[w.id], S = WS(w);
    if (B.type === 'spray') { const half = S.angle360 ? Math.PI : S.angle; ctx.fillStyle = w.evo ? 'rgba(120,255,140,.12)' : 'rgba(120,220,255,.14)'; ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.arc(P.x, P.y, S.range, w.ang - half, w.ang + half); ctx.fill(); }
    if (B.type === 'beam') { ctx.fillStyle = 'rgba(255,247,176,.22)'; ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.arc(P.x, P.y, S.range, w.ang - S.angle, w.ang + S.angle); ctx.fill(); } }
  // Dueño telegraph
  const bo = G.boss; if (bo && bo.alive && bo.st === 'tele') { ctx.strokeStyle = `rgba(255,30,30,${0.4 + 0.4 * Math.sin(G.t * 30)})`; ctx.lineWidth = bo.r * 1.4; ctx.beginPath(); ctx.moveTo(bo.x, bo.y); ctx.lineTo(bo.x + bo.dx * 300, bo.y + bo.dy * 300); ctx.stroke(); txt('!', bo.x, bo.y - 70, 16, '#ff3030', 'center'); }
  const list = ENE.items.filter(e => e.alive).sort((a, b) => a.y - b.y);
  for (const e of list) { if (e.hidden) { if (e.ph2 === 'tell') drawSpr(e.d.tell, e.x, e.y, 0, e.tT * 0.375); continue; } const key = e.sprNow || e.d.spr || 'e_' + e.type, fy = footOf(e); let fr = animFrame(true, G.t + e.ph);
    if (e.d.behavior === 'lvboss' && e.d.ai.fixed) fr = e.venting ? 6 + Math.floor(G.t * 8) % 2 : e.flash > 0 ? 5 : Math.floor(G.t * 2.5) % 2;
    else if (e.d.behavior === 'lvboss') fr = e.atkT > 0 ? 2 + Math.floor(G.t * 10) % 3 : e.flash > 0 ? 5 : SHEET[key] && SHEET[key].n >= 8 ? 6 + Math.floor(G.t * 6) % 2 : Math.floor(G.t * 2.5) % 2;
    else if (e.d.behavior === 'boss' && e.d.spr) fr = animFrame(true, G.t + e.ph);
    if (e.d.behavior === 'dueno') fr = e.st === 'dash' || e.st === 'tele' ? 5 + Math.floor(G.t * 8) % 2 : e.atkT > 0 ? 2 + Math.floor(G.t * 10) % 3 : Math.floor(G.t * 2.5) % 2;
    const flip = e.vx < 0; if (e.d.behavior === 'ghost') ctx.globalAlpha = 0.6 + 0.2 * Math.sin(G.t * 4 + e.ph);
    drawAnim(key, e.x, fy, fr, flip, e.d.scale || 1); ctx.globalAlpha = 1;
    if (e.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; drawAnim(key, e.x, fy, fr, flip); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    if (e.d.elite) { ctx.fillStyle = '#300'; ctx.fillRect(e.x - 14, fy - 34, 28, 3); ctx.fillStyle = '#ff3df5'; ctx.fillRect(e.x - 14, fy - 34, 28 * Math.max(0, e.hp / e.maxHp), 3); } }
  for (const Q of G.players) { const blink = Q.inv > 0 && Math.floor(Q.inv * 20) % 2; if (!blink) { ctx.filter = cosFilter(Q.costume); drawAnim(playerKey(Q.charId, Q.costume), Q.x, Q.y + 8, animFrame(Q.moving, Q.anim), Q.fx < 0); ctx.filter = 'none'; }
    ctx.fillStyle = '#300'; ctx.fillRect(Q.x - 12, Q.y + 12, 24, 3); ctx.fillStyle = '#3fdc5a'; ctx.fillRect(Q.x - 12, Q.y + 12, 24 * Q.hp / Q.maxHp, 3); }
  for (const w of G.weapons) { const S = WS(w); if (S.auraR) { const key = w.id === 'piedras' ? 'fx_sauna_vapor' : 'fx_charco_hielo';
      ctx.globalAlpha = 0.35; ctx.fillStyle = w.id === 'piedras' ? 'rgba(255,160,90,.25)' : 'rgba(120,200,255,.25)'; ctx.beginPath(); ctx.arc(P.x, P.y, S.auraR, 0, 7); ctx.fill();
      for (let i = 0; i < 6; i++) { const a = G.t * 0.6 + i * 1.05; drawSpr(w.id === 'piedras' ? 'fx_sauna_vapor' : 'proj_burbuja', P.x + Math.cos(a) * S.auraR * 0.6, P.y + Math.sin(a) * S.auraR * 0.6, 0, G.t); } ctx.globalAlpha = 1; }
    if (D.weapons[w.id].type === 'drone' && w.pos) for (const q of w.pos) drawSpr('proj_dron', q.x, q.y, 0, G.t); }
  for (const w of G.weapons) if (D.weapons[w.id].type === 'sarten' && w.pos) for (const q of w.pos) { if (w.evo) drawSpr('evo_olla', q.x, q.y, q.a * 2, 0, 0.75); else { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a * 2); ctx.drawImage(SPR.sarten, -8, -8); ctx.restore(); } }
  for (const F of G.fusions) { const f = D.fusions.find(x => x.id === F.id), Q = f.params, st = F.st;
    if (F.id === 'recepcion24') for (const b of st.list) { drawAnim('fus_campana_fija', b.x, b.y + 10, b.ring > 0 ? 1 + Math.floor(G.t * 8) % 2 : 0, false); if (b.ring > 0) { ctx.strokeStyle = 'rgba(255,220,90,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, Q.R * P.area * (1 - b.ring / 0.35), 0, 7); ctx.stroke(); } }
    if (F.id === 'tren') st.list.forEach(q => drawAnim('fus_tren_vagon', q.x, q.y + 8, Math.floor(G.t * 8) % 2, false));
    if (F.id === 'cinta') st.list.forEach(q => drawSpr('fus_cinta_segmento', q.x, q.y, q.a + Math.PI / 2, G.t));
    if (F.id === 'cocina') { ctx.strokeStyle = 'rgba(255,110,30,.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(P.x, P.y, Q.R * P.area, 0, 7); ctx.stroke(); for (let i = 0; i < 10; i++) { const a = G.t + i * 0.63; drawAnim('llama_piso', P.x + Math.cos(a) * Q.R * P.area, P.y + Math.sin(a) * Q.R * P.area + 6, Math.floor(G.t * 8 + i), false); } }
    if (F.id === 'cuarentena') { ctx.fillStyle = 'rgba(80,255,120,.12)'; ctx.beginPath(); ctx.arc(P.x, P.y, G.quarR, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(80,255,120,.5)'; ctx.stroke(); }
    if (F.id === 'spa') { ctx.fillStyle = 'rgba(255,200,230,.12)'; ctx.beginPath(); ctx.arc(P.x, P.y, G.spaR, 0, 7); ctx.fill(); for (let i = 0; i < 5; i++) { const a = G.t * 0.5 + i * 1.26; drawSpr('fx_sauna_vapor', P.x + Math.cos(a) * G.spaR * 0.6, P.y + Math.sin(a) * G.spaR * 0.6, 0, G.t); } }
    if (F.id === 'glaciar') { ctx.globalAlpha = 0.45; drawSpr('fx_glaciar_piso', P.x, P.y, 0, G.t, Q.R * P.area / 32); ctx.globalAlpha = 1; }
    if (F.id === 'torre') st.list.forEach(q => drawSpr('proj_dron', q.x, q.y, 0, G.t));
    if (F.id === 'banquete') drawSpr('fus_mesa_bodas', P.x, P.y - 20, 0, G.t * 0.5, 0.6);
    if (F.id === 'inventario' && st.boom > 0) { ctx.strokeStyle = 'rgba(255,60,60,.8)'; for (const e of st.marked) if (e.alive) { ctx.strokeRect(e.x - 8, e.y - 8, 16, 16); } }
    if (F.id === 'tsunami' && st.on) { for (let y = P.y - H / 2; y < P.y + H / 2; y += 32) drawSpr('fx_tsunami_ola', st.wx, y + 16, 0, G.t); } }
  for (const f of FX.items) if (f.alive && f.kind === 'door' && f.t >= 0) drawAnim('fus_puerta', f.x, f.y + 10, f.done ? 1 : 0, false);
  for (const p of PROJ.items) if (p.alive) { const ar = p.lob ? Math.sin(Math.PI * p.t / 0.6) * 30 : 0; drawSpr(p.spr, p.x, p.y - ar, p.ang || 0, p.t); }
  for (const f of FX.items) if (f.alive) { const k = f.t / f.dur;
    if (f.kind === 'poof') { ctx.fillStyle = `rgba(255,255,255,${1 - k})`; for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.fillRect(f.x + Math.cos(a) * 12 * k - 1, f.y + Math.sin(a) * 12 * k - 1, 3, 3); } }
    if (f.kind === 'mist') { ctx.fillStyle = `rgba(170,235,255,${0.7 * (1 - k)})`; ctx.fillRect(f.x - 2, f.y - 2, 4, 4); }
    if (f.kind === 'cloud') { ctx.globalAlpha = 0.6 * (1 - k); drawSpr('evo_nube', f.x, f.y, 0, 0, 0.6); ctx.globalAlpha = 1; }
    if (f.kind === 'phasefx') { if (SHEET[f.spr]) drawSpr(f.spr, f.x, f.y, 0, f.t * 0.6); continue; }
    if (f.kind === 'xpl') { if (SHEET.fx_despido_explosion) drawSpr(f.S && f.S.chain ? 'fx_despido_explosion' : 'fx_burbuja_explosion', f.x, f.y, 0, k * 0.37, f.r / 14); else { ctx.fillStyle = `rgba(255,220,120,${0.6 * (1 - k)})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); } }
    if (f.kind === 'nova') { ctx.strokeStyle = `rgba(160,230,255,${1 - k})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * k, 0, 7); ctx.stroke(); ctx.globalAlpha = 0.5 * (1 - k); drawSpr('fx_charco_hielo', f.x, f.y, 0, 0, f.r / 16); ctx.globalAlpha = 1; }
    if (f.kind === 'whip') { if (SHEET.fx_latigazo_toalla) { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang); const sh = SHEET.fx_latigazo_toalla, s = f.r / 48; ctx.drawImage(sh.img, (k > 0.5 ? 1 : 0) * sh.fw, 0, sh.fw, sh.fs, 0, -8 * s, sh.fw * s, sh.fs * s); ctx.restore(); } }
    if (f.kind === 'boom') { ctx.fillStyle = `rgba(255,200,80,${0.6 * (1 - k)})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.5 + k * 0.5), 0, 7); ctx.fill(); }
    if (f.kind === 'strike') { if (!f.done) { ctx.strokeStyle = 'rgba(80,255,120,.6)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.R, 0, 7); ctx.stroke(); drawSpr(f.spr || 'billete', f.x, f.y - (1 - f.t / 0.35) * 60, f.t * 8, f.t); } else { ctx.fillStyle = `rgba(80,255,120,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.R, 0, 7); ctx.fill(); } }
    if (f.kind === 'arc' && f.full) { ctx.globalAlpha = 1 - k * 0.5; drawSpr('fx_porton_golpe', f.x, f.y, 0, k * 0.24, f.r / 32); ctx.globalAlpha = 1; }
    else if (f.kind === 'arc' && f.spr === 'fx_arco_plumero' && SHEET.fx_arco_plumero) { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang); const sh = SHEET.fx_arco_plumero, s = f.r / 28; ctx.drawImage(sh.img, (k > 0.5 ? 1 : 0) * sh.fw, 0, sh.fw, sh.fs, -4 * s, -16 * s, sh.fw * s, sh.fs * s); ctx.restore(); }
    else if (f.kind === 'arc') { if (SHEET.arco_baston) { ctx.globalAlpha = 1 - k * 0.5; drawSpr('arco_baston', f.x + Math.cos(f.ang) * f.r * 0.5, f.y + Math.sin(f.ang) * f.r * 0.5, f.ang, k * 0.24, f.r / 24); ctx.globalAlpha = 1; } }
    if (f.kind === 'num') { ctx.globalAlpha = 1 - k; txt(String(f.v), f.x, f.y - k * 10, MOB.on ? Math.max(7, 14 / MOB.gs) : 7, f.col || '#fff', 'center'); ctx.globalAlpha = 1; } }
  ctx.restore();
  if (G.dark > 0) { const ap = G.fusions.find(x => x.id === 'apagon'); const Rr = ap ? D.fusions.find(f => f.id === 'apagon').params.R * G.p.area : 90; ctx.save(); ctx.fillStyle = 'rgba(0,0,10,.85)'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, Rr, 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.restore(); }
  if (G.fusionFlash > 0) { G.fusionFlash -= 1 / 60; ctx.fillStyle = `rgba(190,90,255,${G.fusionFlash * 0.4})`; ctx.fillRect(0, 0, W, H); }
  if (JOY.active && !MOB.on) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(JOY.sx, JOY.sy, 30, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; const dx = JOY.x - JOY.sx, dy = JOY.y - JOY.sy, d = Math.min(30, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); ctx.beginPath(); ctx.arc(JOY.sx + Math.cos(a) * d, JOY.sy + Math.sin(a) * d, 12, 0, 7); ctx.fill(); }
}
function renderHUD() {
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, 6); ctx.fillStyle = '#3fbf5a'; ctx.fillRect(0, 0, W * Math.min(1, G.xp / G.xpNext), 6);
  txt(tr('NV ') + G.lvl, 4, 16, 8); txt(fmt(G.t), W / 2, 20, 14, G.t >= TLd().highSeason ? '#ff8040' : '#fff', 'center');
  const ph = phaseName(); if (ph) txt(ph, W / 2, 30, 7, ph === tr('RESPIRO') ? '#7fe0ff' : '#ff8040', 'center');
  txt('☠ ' + G.kills, 4, 28, 8, '#ddd'); txt('🔑 ' + G.keys, 4, 40, 8, '#ffd23f');
  const sl = slotsOpen(), lockLv = D.run.slotOpenLevels, bs = 16;
  for (let row = 0; row < 2; row++) { const arr = row === 0 ? G.weapons : G.passives, y = H - 4 - (2 - row) * (bs + 2);
    for (let i = 0; i < D.run.slotsMax; i++) { const x = 4 + i * (bs + 2), it = arr[i];
      if (i >= sl && !it) { const lk = 'ui_slot_candado_nv' + lockLv[i - D.run.slotsStart]; if (SHEET[lk]) drawIcon(lk, x, y, bs); else { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y, bs, bs); txt(String(lockLv[i - D.run.slotsStart]), x + bs / 2, y + 11, 5, '#888', 'center'); } continue; }
      ctx.fillStyle = it && it.evo ? 'rgba(120,80,0,.7)' : 'rgba(0,0,0,.5)'; ctx.fillRect(x, y, bs, bs); if (!it) continue;
      if (row === 0) { drawIcon(weaponIcon(it), x, y, bs); if (it.lvl >= 8) { if (SHEET.ui_maestria) drawIcon('ui_maestria', x + bs - 8, y - 2, 8); ctx.strokeStyle = '#ffd23f'; ctx.strokeRect(x + .5, y + .5, bs - 1, bs - 1); } }
      else drawIcon(D.passives[it.id].icon || ('ic_' + it.id), x, y, bs);
      txt(String(it.lvl), x + bs - 3, y + bs - 1, 5, '#ffd23f'); } }
  G.fusions.forEach((F, i) => { const f = D.fusions.find(x => x.id === F.id); drawIcon(f.icon, 4 + D.run.slotsMax * 18 + 6 + i * 20, H - 40, 18); });
  const bb = (G.boss && G.boss.alive) ? G.boss : (G.mini && G.mini.alive ? G.mini : null);
  if (bb) { const bw = Math.min(260, W - 40); ctx.fillStyle = '#300'; ctx.fillRect(W / 2 - bw / 2, 34, bw, 6); ctx.fillStyle = bb === G.boss ? '#d4af37' : '#ff2a2a'; ctx.fillRect(W / 2 - bw / 2, 34, bw * bb.hp / bb.maxHp, 6);
    txt(bb.d.name.toUpperCase() + (bb === G.boss ? tr(' · FASE ') + (bb.phase || 1) : ''), W / 2, 50, 7, '#ffb080', 'center'); }
  if (G.banner) txt(G.banner.s, W / 2, H / 3, 12, '#ffd23f', 'center');
  if (G.rescue && !G.rescue.done) { const R0 = G.rescue, dx = R0.x - G.p.x, dy = R0.y - G.p.y; if (Math.abs(dx) > W / 2 - 10 || Math.abs(dy) > H / 2 - 10) { const a = Math.atan2(dy, dx), ex = W / 2 + Math.cos(a) * (W / 2 - 18), ey = H / 2 + Math.sin(a) * (H / 2 - 18);
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = '#50ffa0'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.fill(); ctx.restore(); }
    txt(tr('RESCATE') + ' ' + Math.floor(R0.prog) + '/' + D.rescueRules.hold + 's', W / 2, 44, 7, '#50ffa0', 'center'); }
  if (G.newHire && G.newHire.t > 0) { G.newHire.t -= 1 / 60; if (SHEET.ui_nuevo_empleado) drawSpr('ui_nuevo_empleado', W / 2, H / 3 + 22, 0, G.t); }
  btn(W - 26, 10, 20, 20, 'II', () => togglePause(), { size: 9 });
}
function renderToasts(dt) { let y = 60; for (const a of achToast) { a.t -= dt; ctx.fillStyle = 'rgba(20,10,30,.85)'; ctx.fillRect(W - 170, y, 164, 26); ctx.strokeStyle = '#ffd23f'; ctx.strokeRect(W - 169.5, y + .5, 163, 25);
  txt(a.s, W - 164, y + 11, 7, '#ffd23f'); txt(a.sub, W - 164, y + 21, 5, '#ddd'); y += 30; } achToast = achToast.filter(a => a.t > 0); }
function overlay(a = 0.7) { ctx.fillStyle = `rgba(10,6,16,${a})`; ctx.fillRect(0, 0, W, H); }
function upLabel(c) { if (c.kind === 'heal') return [tr('Botiquín'), tr('Cura toda la vida'), 'food_buffet']; if (c.kind === 'keys') return [tr('Llavero'), tr('+2 llaves'), 'key'];
  if (c.kind === 'w') { const S = D.weapons[c.id], LR = D.levelRules; if (c.lvl === LR.evoLevel && S.evo) return ['→ ' + S.evo.name, tr('¡EVOLUCIONA al nivel 5!'), S.evo.spr];
    const owned = G.weapons.find(w => w.id === c.id), nm = owned && owned.evo ? S.evo.name : S.name, ic = owned && owned.evo ? S.evo.spr : (S.icon || c.id);
    const lvTxt = { 2: tr('Efecto A'), 3: tr('+20% daño'), 4: tr('Efecto B'), 6: tr('+25% daño'), 7: tr('+1 proyectil / +20% área'), 8: tr('MAESTRÍA: -20% enfriamiento') }[c.lvl];
    return [nm + (c.lvl > 1 ? tr(' Nv') + c.lvl : tr(' (NUEVA)')), c.lvl > 1 ? (lvTxt || tr('Mejora')) : S.desc, ic]; }
  const S = D.passives[c.id]; return [S.name + (c.lvl > 1 ? tr(' Nv') + c.lvl : tr(' (NUEVO)')), S.desc, S.icon || ('ic_' + c.id)]; }
function renderLevelUp() { overlay(); txt(G.banishMode ? tr('ELEGÍ UNA OPCIÓN PARA DESCARTAR') : tr('¡SUBISTE DE NIVEL!'), W / 2, 36, 12, G.banishMode ? '#ff6060' : '#ffd23f', 'center');
  const n = G.choices.length, cw = Math.min(140, (W - 24) / n - 6), ch = 92, y = H / 2 - 54;
  G.choices.forEach((c, i) => { const x = W / 2 + (i - (n - 1) / 2) * (cw + 6) - cw / 2; const [nm, d, ic] = upLabel(c);
    buttons.push({ x, y, w: cw, h: ch, fn: () => choose(i) });
    ctx.fillStyle = '#2a2140'; ctx.fillRect(x, y, cw, ch); ctx.strokeStyle = G.banishMode ? '#ff6060' : nm.startsWith('→') ? '#ff7bc2' : '#f2c230'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, cw - 1, ch - 1);
    drawIcon(ic, x + cw / 2 - 16, y + 6, 32); txt(nm.length > 24 ? nm.slice(0, 23) + '.' : nm, x + cw / 2, y + 50, 6, '#fff', 'center'); txt(d.length > 28 ? d.slice(0, 27) + '.' : d, x + cw / 2, y + 63, 5, '#bbb', 'center'); txt('[' + (i + 1) + ']', x + cw / 2, y + 84, 7, '#f2c230', 'center'); });
  const by = y + ch + 12;
  btn(W / 2 - 110, by, 104, 18, tr('Reroll (') + G.rerolls + ') [R]', reroll, { disabled: G.rerolls <= 0 }); if (SHEET.ui_btn_reroll) drawIcon('ui_btn_reroll', W / 2 - 128, by, 18);
  btn(W / 2 + 6, by, 104, 18, tr('Descartar (') + G.banishLeft + ') [X]', toggleBanish, { disabled: G.banishLeft <= 0, hl: G.banishMode }); if (SHEET.ui_btn_descarte) drawIcon('ui_btn_descarte', W / 2 + 112, by, 18);
  txt(tr('Slots: ') + G.weapons.length + '/' + slotsOpen() + tr(' armas · ') + G.passives.length + '/' + slotsOpen() + tr(' pasivos'), W / 2, by + 32, 6, '#aaa', 'center'); }
function renderFusion() { overlay(0.8); txt(tr('COFRE VIOLETA: ¿FUSIONAR?'), W / 2, 40, 13, '#c58cff', 'center');
  const n = G.fusionOpts.length, cw = Math.min(170, (W - 30) / n - 8), y = 60;
  G.fusionOpts.forEach((f, i) => { const x = W / 2 + (i - (n - 1) / 2) * (cw + 8) - cw / 2; ctx.fillStyle = '#2a1740'; ctx.fillRect(x, y, cw, 120); ctx.strokeStyle = f.rare ? '#ffd23f' : '#c58cff'; ctx.strokeRect(x + .5, y + .5, cw - 1, 119);
    drawIcon(f.icon, x + cw / 2 - 16, y + 6, 32); txt(f.name, x + cw / 2, y + 50, 7, '#fff', 'center'); const rec = f.recipe.w.map(id => D.weapons[id].evo.name).concat(f.recipe.p ? [D.passives[f.recipe.p].name] : []).join(' + ');
    txt(rec.slice(0, 34), x + cw / 2, y + 62, 5, '#c58cff', 'center'); txt(f.desc.slice(0, 34), x + cw / 2, y + 74, 5, '#ccc', 'center'); txt(f.desc.slice(34, 68), x + cw / 2, y + 82, 5, '#ccc', 'center');
    btn(x + 8, y + 94, cw - 16, 18, tr('FUSIONAR [') + (i + 1) + ']', () => doFusion(f), { hl: true, size: 7 }); });
  txt(tr('El arma y el pasivo desaparecen y se libera su slot. Fusiones: ') + G.fusions.length + '/' + D.fusionRules.maxPerRun, W / 2, y + 136, 6, '#aaa', 'center');
  btn(W / 2 - 70, y + 146, 140, 20, tr('NO, abrir cofre normal [N]'), () => { G.fusionOpts = null; G.state = 'play'; openChestNormal(); }, { size: 6 }); }
function bookState(f) { const B = META.book, wHalf = f.recipe.w.every(id => B.revealed[id + ':w']), pHalf = f.recipe.p ? !!B.revealed[f.recipe.p + ':p'] : wHalf; return { fused: !!B.fused[f.id], wHalf, pHalf, any: f.recipe.w.some(id => B.revealed[id + ':w']) || (f.recipe.p && B.revealed[f.recipe.p + ':p']) }; }
function renderBook() { ctx.fillStyle = '#1a1224'; ctx.fillRect(0, 0, W, H); txt(tr('LIBRO DE RECETAS ') + Object.keys(META.book.fused).length + '/' + D.fusions.length, W / 2, 18, 12, '#c58cff', 'center');
  const per = 10, cw = 40, chh = 56, sx = W / 2 - per * (cw + 4) / 2;
  D.fusions.forEach((f, i) => { const col = i % per, row = Math.floor(i / per), x = sx + col * (cw + 4), y = 28 + row * (chh + 52), s = bookState(f);
    const card = s.fused ? (f.card || 'ui_receta_revelada') : (s.wHalf && s.pHalf ? (f.card || 'ui_receta_revelada') : 'ui_receta_silueta');
    if (SHEET[card]) drawIcon(card, x + 4, y, 48); if ((s.fused || (s.wHalf && s.pHalf)) && !f.card) drawIcon(f.icon, x + 12, y + 2, 32);
    if (s.fused && SHEET.ui_receta_brillo) { ctx.globalAlpha = 0.5; const sh = SHEET.ui_receta_brillo; ctx.drawImage(sh.img, (Math.floor(G_now() * 3) % sh.n) * sh.fw, 0, sh.fw, sh.fs, x + 12, y, 32, 48); ctx.globalAlpha = 1; }
    const nm = s.fused || (s.wHalf && s.pHalf) ? f.name : '???'; txt(nm.slice(0, 11), x + cw / 2 + 4, y + 56, 4, s.fused ? '#ffd23f' : '#ccc', 'center');
    let r1 = f.rare ? (s.wHalf ? f.recipe.w.map(id => D.weapons[id].evo.name.split(' ')[0]).join('+') : tr('Requiere dos')) : (s.wHalf ? D.weapons[f.recipe.w[0]].evo.name.split(' ')[0] : '???'), r2 = f.rare ? (s.wHalf ? '' : tr('armas maestras')) : (s.pHalf ? '+' + D.passives[f.recipe.p].name.split(' ')[0] : '+ ???');
    txt(r1.slice(0, 12), x + cw / 2 + 4, y + 63, 4, f.rare ? '#ffd23f' : '#c58cff', 'center'); txt(r2.slice(0, 12), x + cw / 2 + 4, y + 69, 4, '#c58cff', 'center'); });
  btn(W / 2 - 50, H - 24, 100, 18, tr('Volver [Esc]'), () => { screen = 'menu'; }); }
const G_now = () => performance.now() / 1000;
function renderPause() { overlay(); txt(tr('PAUSA'), W / 2, H / 2 - 30, 16, '#fff', 'center'); btn(W / 2 - 50, H / 2 - 10, 100, 20, tr('Seguir [Esc]'), togglePause);
  btn(W / 2 - 50, H / 2 + 16, 100, 20, tr('Abandonar'), () => { G.state = 'play'; G.abandoned = true; endRun(false); }); btn(W / 2 - 50, H / 2 + 42, 100, 20, tr('Sonido: ') + (AU.on ? tr('ON') : tr('OFF')), () => { AU.on = !AU.on; if (AU.mus) AU.mus.gain.value = AU.on ? 0.18 : 0; }); musicControls(W / 2 - 50, H / 2 + 68); }
function musicControls(x, y) { if (!window.MUSIC) return; btn(x, y, 20, 18, '-', () => MUSIC.setVol(Math.round((MUSIC.vol - 0.1) * 10) / 10), { size: 7 }); btn(x + 22, y, 56, 18, tr('Música ') + (MUSIC.mute ? tr('OFF') : Math.round(MUSIC.vol * 100) + '%'), () => MUSIC.setMute(!MUSIC.mute), { size: 5 }); btn(x + 80, y, 20, 18, '+', () => MUSIC.setVol(Math.round((MUSIC.vol + 0.1) * 10) / 10), { size: 7 }); }
function renderSummary() { overlay(0.8); txt(G.win ? tr('¡EL HOTEL ES TUYO!') : tr('TE DIERON DE BAJA'), W / 2, 46, 16, G.win ? '#3fdc5a' : '#ff6060', 'center');
  txt(tr('Tiempo: ') + fmt(G.t), W / 2, 72, 10, '#fff', 'center'); txt(tr('Kills: ') + G.kills, W / 2, 88, 10, '#fff', 'center'); txt(tr('Llaves ganadas: ') + G.keysFinal + tr('  (total ') + META.keys + ')', W / 2, 104, 10, '#ffd23f', 'center');
  txt(tr('Nivel ') + G.lvl + ' · ' + G.char.name + (G.evolved.length ? tr(' · evoluciones: ') + G.evolved.length : ''), W / 2, 120, 8, '#bbb', 'center');
  if (G.achNow.length) txt(tr('Logros: ') + G.achNow.join(', ').slice(0, 90), W / 2, 136, 7, '#ffd23f', 'center');
  if (G.unlockedNow.length) txt(tr('Desbloqueado: ') + G.unlockedNow.join(', '), W / 2, 150, 9, '#ff7bc2', 'center');
  btn(W / 2 - 110, 166, 105, 22, tr('Otra run [Enter]'), () => newRun(G.char.id), { hl: true }); btn(W / 2 + 5, 166, 105, 22, tr('Menú [M]'), () => { screen = 'menu'; G = null; }); }
function shopPrice(s) { const lv = META.shop[s.id]; return lv < s.price.length ? s.price[lv] : null; }
function costumesOf(cid) { return Object.keys(D.costumes).filter(k => D.costumes[k].char === cid && META.costumes[k]); }
function cycleCostume() { const c = META.sel, own = [null, ...costumesOf(c)]; const i = own.indexOf(META.costumeSel[c] || null); META.costumeSel[c] = own[(i + 1) % own.length]; if (!META.costumeSel[c]) delete META.costumeSel[c]; saveMeta(); }
function renderMenu() {
  ctx.fillStyle = '#1a1224'; ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) { ctx.globalAlpha = 0.25; ctx.drawImage(SPR.tile, x, y); ctx.globalAlpha = 1; }
  btn(W - 58, 4, 54, 14, LANG === 'es' ? 'ES | en' : 'es | EN', () => setLang(LANG === 'es' ? 'en' : 'es'), { size: 6 });
  const wl = WISHLIST_URL(); if (wl) btn(4, 4, 84, 14, tr('Wishlist en Steam'), () => { track('wishlist_click', { from: 'menu' }); PLATFORM.openLink(wl); }, { size: 5 });
  if (UI.title) { ctx.imageSmoothingEnabled = false; ctx.drawImage(UI.title, 0, 60, 864, 480, W / 2 - 72, 3, 144, 80); } // pixel-art logo (6x source -> native 144x80)
  else txt('CHECK-OUT CHAOS', W / 2, 40, 16, '#f2c230', 'center');
  if (!FULL()) txt(tr('DEMO'), W / 2 + 76, 78, 7, '#c58cff', 'left'); musicControls(W - 108, H - 24); if (META.title) txt('👑 ' + tr(META.title), W / 2, 92, 6, '#7ae8ff', 'center');
  txt(tr('v2 · Sobreviví 15 minutos de Temporada Alta').replace(/^v2 · /, ''), W / 2 - 80, 44, 6, '#ccc', 'right');
  txt('🔑 ' + META.keys + '   ☠ ' + META.totalKills, W / 2 + 80, 38, 7, '#ffd23f', 'left');
  txt(tr('   mejor ').trim() + ' ' + fmt(META.bestTime) + '   🏆 ' + Object.keys(META.ach).length + '/' + D.achievements.length, W / 2 + 80, 50, 7, '#ffd23f', 'left');
  const cs = D.characters, perRow = Math.ceil(cs.length / 2), cw = Math.min(64, (W - 16) / perRow - 4), chh = 56, y0 = 86;
  cs.forEach((c, i) => { const row = Math.floor(i / perRow), col = i % perRow, n = Math.min(perRow, cs.length - row * perRow);
    const x = W / 2 + (col - (n - 1) / 2) * (cw + 4) - cw / 2, y = y0 + row * (chh + 4), un = playable(c.id), lockedFull = !un && !canUnlock(c.id), sel = MENU_PEEK ? MENU_PEEK === c.id : META.sel === c.id;
    buttons.push({ x, y, w: cw, h: chh, fn: () => { MENU_PEEK = un ? null : c.id; if (un) META.sel = c.id; else sfx('hurt'); saveMeta(); } });
    ctx.fillStyle = sel ? '#3a2f5a' : '#241c33'; ctx.fillRect(x, y, cw, chh); ctx.strokeStyle = sel ? '#f2c230' : '#554'; ctx.strokeRect(x + .5, y + .5, cw - 1, chh - 1);
    ctx.globalAlpha = un ? 1 : 0.3; drawAnim(playerKey(c.id, META.costumeSel[c.id]), x + cw / 2, y + 38, animFrame(sel, performance.now() / 1000), false, 1.1); ctx.globalAlpha = 1;
    txt(c.name.length > 12 ? c.name.slice(0, 11) + '.' : c.name, x + cw / 2, y + 46, 5, '#fff', 'center');
    if (lockedFull) txt('🔒 ' + tr('Completa'), x + cw / 2, y + 54, 5, '#c58cff', 'center'); else if (!un) txt('🔒 ' + (c.unlock ? levelDef(c.unlock.level).name.slice(0, 12) : ''), x + cw / 2, y + 54, 5, '#ff7bc2', 'center'); else txt(D.weapons[c.weapon].name.slice(0, 14), x + cw / 2, y + 54, 4, '#f2c230', 'center'); });
  const sc = D.characters.find(c => c.id === (MENU_PEEK || META.sel)) || cs[0]; let y = y0 + 2 * (chh + 4) + 4;
  txt(sc.name + ' — ' + D.weapons[sc.weapon].name + ' (' + D.weapons[sc.weapon].desc + ') · ' + sc.bonusText, W / 2, y + 6, 6, '#fff', 'center');
  if (!playable(sc.id) && !canUnlock(sc.id)) txt(tr('Disponible en la versión completa'), W / 2, y + 15, 6, '#c58cff', 'center'); else if (!META.unlocked[sc.id] && sc.unlock) txt(tr('Desbloqueo: ') + sc.unlock.text, W / 2, y + 15, 6, '#ff7bc2', 'center');
  y += 20; let sx = W / 2 - 3 * 66 / 2;
  for (const s of D.shop) { const pr = shopPrice(s); btn(sx, y, 62, 16, pr == null ? s.name + ' MAX' : s.name + ' ' + pr + '🔑', () => { if (pr != null && META.keys >= pr) { META.keys -= pr; META.shop[s.id]++; saveMeta(); sfx('key'); } }, { size: 5, disabled: pr == null || META.keys < pr }); sx += 66; }
  y += 20; const own = costumesOf(META.sel), cur = META.costumeSel[META.sel];
  btn(W / 2 - 128, y, 124, 16, tr('Traje: ') + (cur ? D.costumes[cur].name : tr('Clásico')) + (own.length ? ' [T]' : tr(' (sin trajes)')), cycleCostume, { size: 5, disabled: !own.length });
  btn(W / 2 + 4, y, 124, 16, tr('Logros ') + Object.keys(META.ach).length + '/' + D.achievements.length + ' [L]', () => { screen = 'ach'; }, { size: 6 });
  btn(W / 2 - 60, y + 22, 120, 22, tr('JUGAR [Enter]'), startSelected, { hl: true, size: 10 }); btn(W / 2 + 66, y + 22, 62, 22, tr('Recetas [B]'), () => { screen = 'book'; }, { size: 6 });
  if (!FULL()) btn(W / 2 - 128, y + 22, 62, 22, tr('Versión completa'), () => { screen = 'full'; track('full_version_click', { action: 'open_screen', from: 'menu' }); }, { size: 5 });
  const tips = D.loadingTips; txt(tr('Tip: ') + tips[Math.floor(G_now() / 6) % tips.length], W / 2, Math.min(H - 12, y + 50), 5, '#c58cff', 'center');
  txt(tr('WASD/Flechas o arrastrá · Esc/P pausa · 1-9 elegir'), W / 2, Math.min(H - 4, y + 56), 5, '#999', 'center');
}
function renderAch() { ctx.fillStyle = '#1a1224'; ctx.fillRect(0, 0, W, H); txt(tr('LOGROS'), W / 2, 22, 14, '#f2c230', 'center');
  const colW = Math.min(300, (W - 20) / 2); D.achievements.forEach((a, i) => { const col = i % 2, row = Math.floor(i / 2), x = W / 2 + (col ? 4 : -colW - 4), y = 32 + row * 34, got = !!META.ach[a.id];
    ctx.fillStyle = got ? '#2f3a26' : '#241c33'; ctx.fillRect(x, y, colW, 30); txt((got ? '✔ ' : '· ') + a.name, x + 5, y + 10, 7, got ? '#3fdc5a' : '#aaa'); txt(a.desc, x + 5, y + 19, 5, '#ccc'); txt(tr('Premio: ') + rewardText(a.reward), x + 5, y + 27, 5, '#ffd23f'); });
  btn(W / 2 - 50, H - 24, 100, 18, tr('Volver [Esc]'), () => { screen = 'menu'; }); }
let MENU_PEEK = null;
function FULL_URL() { const u = (D.links && D.links.fullVersion) || ''; if (!u) return ''; if (PLATFORM.name === 'poki' && !(window.PokiSDK && window.PokiSDK.openExternalLink)) return ''; return u; }
function renderFull() { ctx.fillStyle = '#1a1224'; ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) { ctx.globalAlpha = 0.2; ctx.drawImage(SPR.tile, x, y); ctx.globalAlpha = 1; }
  txt(tr('VERSIÓN COMPLETA'), W / 2, 30, 16, '#f2c230', 'center'); txt(tr('Estás jugando la DEMO. La versión completa incluye:'), W / 2, 50, 7, '#fff', 'center');
  const lk = D.characters.filter(c => !inDemoSet(c.id)), cw = 40, x0 = W / 2 - (lk.length * (cw + 2)) / 2;
  lk.forEach((c, i) => { const x = x0 + i * (cw + 2) + cw / 2; ctx.fillStyle = '#241c33'; ctx.fillRect(x - cw / 2, 60, cw, 58); drawAnim(playerKey(c.id, null), x, 102, animFrame(false, performance.now() / 1000), false, 1.1);
    txt(c.name.length > 9 ? c.name.slice(0, 8) + '.' : c.name, x, 113, 4, playable(c.id) ? '#3fdc5a' : '#ccc', 'center'); });
  txt('· ' + tr('11 personajes más, cada uno con su arma y bonus'), W / 2, 140, 7, '#ffd23f', 'center');
  txt('· ' + tr('4 niveles más, rescates y logros para desbloquear personajes'), W / 2, 154, 7, '#ffd23f', 'center');
  txt('· ' + tr('Tu progreso de la demo se conserva'), W / 2, 168, 7, '#ffd23f', 'center');
  const u = FULL_URL(); btn(W / 2 - 90, 190, 180, 24, u ? tr('Conseguir la versión completa') : tr('Próximamente'), () => { track('full_version_click', { action: 'link', hasUrl: !!u, from: 'full_screen' }); if (u) PLATFORM.openLink(u); }, { hl: !!u, disabled: !u, size: 7 });
  btn(W / 2 - 50, H - 30, 100, 18, tr('Volver [Esc]'), () => { screen = 'menu'; }); }
function WISHLIST_URL() { const u = Q.get('wishlist') || (D.links && D.links.wishlist) || ''; if (!u) return ''; if (PLATFORM.name === 'poki' && !(window.PokiSDK && window.PokiSDK.openExternalLink)) return ''; return u; }
function startSelected() { if (!playable(META.sel)) META.sel = 'recep'; screen = 'levels'; }
function startCheckin() { const L = levelDef('checkin'); if (levelPlayable(L)) { screen = 'guests'; return; } sfx('hurt'); if (!FULL()) { screen = 'full'; track('full_version_click', { action: 'open_screen', from: 'checkin_card' }); } }
let GUEST_SEL = 0;
function renderGuests() { ctx.fillStyle = '#0d0b1a'; ctx.fillRect(0, 0, W, H); const bgk = (levelDef('checkin').art || {}).bg; if (SHEET[bgk]) { ctx.globalAlpha = 0.35; for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) ctx.drawImage(SHEET[bgk].img, x, y); ctx.globalAlpha = 1; }
  if (SHEET.ui_checkin_titulo) drawSpr('ui_checkin_titulo', W / 2, 30, 0, performance.now() / 4000); else txt('CHECK-IN MODE', W / 2, 30, 16, '#7ae8ff', 'center'); txt(tr('ELEGÍ HUÉSPED'), W / 2, 58, 9, '#fff', 'center');
  D.checkin.guests.forEach((g, i) => { const x = W / 2 - 195 + i * 135, y = 76, sel = GUEST_SEL === i; buttons.push({ x, y, w: 120, h: 190, fn: () => { if (GUEST_SEL === i) newRun(g.id, 'checkin'); GUEST_SEL = i; } });
    ctx.fillStyle = sel ? '#2a3a5a' : '#1a1f33'; ctx.fillRect(x, y, 120, 190); if (sel) { ctx.strokeStyle = '#7ae8ff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 120, 190); }
    if (SHEET[g.portrait]) ctx.drawImage(SHEET[g.portrait].img, x + 36, y + 10); drawAnim('pl_' + g.id, x + 60, y + 110, animFrame(sel, performance.now() / 1000), false, 1.5);
    txt(g.name, x + 60, y + 130, 6, '#fff', 'center'); txt(tr(g.bonusText), x + 60, y + 146, 4, '#7ae8ff', 'center'); txt((i + 1) + '', x + 8, y + 12, 7, '#888'); });
  btn(W / 2 - 60, H - 52, 120, 20, tr('JUGAR [Enter]'), () => newRun(D.checkin.guests[GUEST_SEL].id, 'checkin'), { hl: true, size: 7 }); btn(W / 2 - 50, H - 26, 100, 16, tr('Volver [Esc]'), () => { screen = 'levels'; }, { size: 6 }); }
function startLevel(id) { if (id === 'checkin') return startCheckin(); const L = levelDef(id || META.levelSel); if (!levelPlayable(L)) { sfx('hurt'); if (levelLockReason(L) === 'full') { screen = 'full'; track('full_version_click', { action: 'open_screen', from: 'level_card', stage: L.id }); } return; } newRun(META.sel, L.id); }
const CHAR_SIL = { chef: 'chef_ejecutivo', gerente: 'gerente_general', conserje: 'conserje_nocturno', dueno: 'dueno_hotel' };
function renderLevels() { ctx.fillStyle = '#1a1224'; ctx.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) { ctx.globalAlpha = 0.2; ctx.drawImage(SPR.tile, x, y); ctx.globalAlpha = 1; }
  txt(tr('ELEGÍ NIVEL'), W / 2, 22, 14, '#f2c230', 'center'); txt(D.characters.find(c => c.id === META.sel).name + '  ·  🔑 ' + META.keys, W / 2, 36, 7, '#ccc', 'center');
  LEVELS().forEach((L, i) => { const x = 12 + i * 124, y = 52, ok = levelPlayable(L), why = levelLockReason(L), sel = META.levelSel === L.id, k = 'ui_nivel_' + L.id + (ok ? '_unlocked' : '_locked');
    buttons.push({ x, y, w: 112, h: 160, fn: () => { if (ok) { if (META.levelSel === L.id) startLevel(L.id); META.levelSel = L.id; saveMeta(); } else startLevel(L.id); } });
    const art = !!SHEET[k]; if (art) ctx.drawImage(SHEET[k].img, x, y); else { ctx.fillStyle = ok ? '#2d2440' : '#18131f'; ctx.fillRect(x, y, 112, 160); txt(L.order + '. ' + L.name, x + 56, y + 96, 7, ok ? '#fff' : '#777', 'center'); }
    if (art) txt(L.name, x + 34, y + 97, 6, ok ? '#fff' : '#999');
    if (!art) for (let d = 0; d < 5; d++) { if (SHEET.ui_nivel_dificultad) drawSpr('ui_nivel_dificultad', x + 14 + d * 10, y + 150, 0, d < L.diff ? 0 : 0.125); else txt(d < L.diff ? '★' : '☆', x + 14 + d * 10, y + 153, 6, '#ffd23f', 'center'); }
    (L.unlockables || []).forEach((u, j) => { const sx = x + 11 + j * 34, sy = y + 117, got = META.unlocked[u.char]; if (got) drawAnim(playerKey(u.char, null), sx + 14, sy + 27, 0, false, 0.85); else { const sk = 'ui_silueta_' + (CHAR_SIL[u.char] || u.char); if (SHEET[sk]) ctx.drawImage(SHEET[sk].img, 0, 0, 32, 32, sx, sy, 28, 28); else { ctx.fillStyle = '#000'; ctx.fillRect(sx, sy, 28, 28); txt('?', sx + 14, sy + 18, 8, '#555', 'center'); } } });
    if (!ok) { if (!art) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y, 112, 160); } if (!art) txt('🔒', x + 56, y + 46, 12, '#fff', 'center');
      txt(why === 'full' ? tr('Versión completa') : why === 'soon' ? tr('Próximamente') : tr('Ganá ') + levelDef(why.slice(4)).name, x + 56, y + 80, 6, why === 'full' ? '#c58cff' : '#ffd23f', 'center'); }
    if (sel) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, 114, 162); }
    if (META.levelsWon[L.id]) txt('✔', x + 104, y + 12, 8, '#3fdc5a', 'center'); });
  const CL = levelDef('checkin'), ci = CL.mode === 'checkin' && levelPlayable(CL); btn(W / 2 - 200, H - 52, 150, 18, tr('CHECK-IN MODE') + (ci ? '' : ' 🔒'), () => startCheckin(), { size: 5, disabled: !ci, hl: ci });
  if (!ci) txt(!FULL() ? tr('Solo en la versión completa') : tr('Ganá los 5 niveles con todos los personajes'), W / 2 - 125, H - 26, 5, !FULL() ? '#c58cff' : '#999', 'center');
  if (!FULL()) btn(W / 2 - 40, H - 52, 110, 18, tr('Versión completa'), () => { screen = 'full'; track('full_version_click', { action: 'open_screen', from: 'levels' }); }, { size: 6, hl: true });
  btn(W / 2 + 80, H - 52, 110, 18, tr('JUGAR [Enter]'), () => startLevel(), { hl: true, size: 7 }); btn(W / 2 + 80, H - 30, 110, 16, tr('Volver [Esc]'), () => { screen = 'menu'; }, { size: 6 }); }
function togglePause() { if (!G) return; if (G.state === 'play') G.state = 'pause'; else if (G.state === 'pause') G.state = 'play'; }
function onKey(c) {
  if (screen === 'chars' || screen === 'shop') { if (c === 'Escape') screen = 'menu'; if (c === 'Enter' || c === 'Space') startSelected(); return; }
  if (screen === 'guests') { if (c === 'Escape') screen = 'levels'; if (c === 'Enter' || c === 'Space') newRun(D.checkin.guests[GUEST_SEL].id, 'checkin'); const i = +c.replace('Digit', '') - 1; if (D.checkin.guests[i]) GUEST_SEL = i; return; }
  if (screen === 'levels') { if (c === 'Escape') screen = 'menu'; if (c === 'Enter' || c === 'Space') startLevel(); const i = +c.replace('Digit', '') - 1; const L = LEVELS()[i]; if (L) { if (levelPlayable(L)) { META.levelSel = L.id; saveMeta(); } else startLevel(L.id); } return; }
  if (screen === 'book') { if (c === 'Escape' || c === 'KeyB' || c === 'Enter') screen = 'menu'; return; }
  if (screen === 'full') { if (c === 'Escape' || c === 'Enter') screen = 'menu'; return; }
  if (screen === 'ach') { if (c === 'Escape' || c === 'KeyL' || c === 'Enter') screen = 'menu'; return; }
  if (screen === 'menu') { if (c === 'Enter' || c === 'Space') startSelected(); if (c === 'KeyI') setLang(LANG === 'es' ? 'en' : 'es'); if (c === 'KeyL') screen = 'ach'; if (c === 'KeyB') screen = 'book'; if (c === 'KeyT') cycleCostume();
    const i = +c.replace('Digit', '') - 1; const ch = D && D.characters[i]; if (ch && playable(ch.id)) { META.sel = ch.id; MENU_PEEK = null; saveMeta(); } return; }
  if (!G) return;
  if (c === 'Escape' || c === 'KeyP') togglePause();
  if (G.state === 'fusion') { const i = +c.replace('Digit', '') - 1; if (G.fusionOpts[i]) doFusion(G.fusionOpts[i]); if (c === 'KeyN') { G.fusionOpts = null; G.state = 'play'; openChestNormal(); } }
  if (G.state === 'levelup') { const i = +c.replace('Digit', '') - 1; if (i >= 0 && i < 5) choose(i); if (c === 'KeyR') reroll(); if (c === 'KeyX') toggleBanish(); }
  if (G.state === 'over') { if (c === 'Enter' || c === 'Space') newRun(G.char.id); if (c === 'KeyM') { screen = 'menu'; G = null; } }
}

// ---------------- mobile layer (phones only: coarse pointer + small viewport, or ?mobile=1; ?mobile=0 forces desktop) -------------
// Full-screen DPR-aware canvas. The 640x360 world (wider up to 800 in landscape to fill 19.5:9 screens) is drawn at an integer device-pixel
// scale when that costs <=10%, else fractional; all mobile UI is drawn in CSS px (so 16 means 16 CSS px) and respects safe-area insets.
const MOB = { on: false, vw: 1, vh: 1, dpr: 1, sa: { l: 0, r: 0, t: 0, b: 0 }, gx: 0, gy: 0, gs: 1, portrait: false, portraitOk: false };
const L2 = (es, en) => LANG === 'en' ? en : es;
const IOS = /iP(hone|od|ad)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const FS_OK = () => !IOS && !!(document.fullscreenEnabled && document.documentElement.requestFullscreen);
function fsToggle() { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => { try { screen_orientation_lock(); } catch (e) { } }).catch(() => { }); else document.exitFullscreen().catch(() => { }); } catch (e) { } }
function screen_orientation_lock() { const so = window.screen && window.screen.orientation; if (so && so.lock) so.lock('landscape').catch(() => { }); }
function detectMobile() { const q = Q.get('mobile'); if (q === '1') return true; if (q === '0') return false;
  return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches) && Math.min(innerWidth, innerHeight) <= 600; }
function resizeMobile() {
  const vv = window.visualViewport, vw = Math.max(1, Math.round(vv ? vv.width : innerWidth)), vh = Math.max(1, Math.round(vv ? vv.height : innerHeight)), dpr = window.devicePixelRatio || 1;
  const pr = getComputedStyle(document.getElementById('sa') || document.body), px = k => parseFloat(pr[k]) || 0;
  const sa = document.getElementById('sa') ? { t: px('paddingTop'), r: px('paddingRight'), b: px('paddingBottom'), l: px('paddingLeft') } : { t: 0, r: 0, b: 0, l: 0 };
  Object.assign(MOB, { vw, vh, dpr, sa, portrait: vh > vw * 1.1 });
  cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
  const aw = vw - sa.l - sa.r, ah = vh - sa.t - sa.b, snap = f => { const dev = f * dpr, k = Math.floor(dev); return k >= 1 && k / dev >= 0.9 ? k / dpr : f; };
  H = 360; let gs;
  if (MOB.portrait) { W = 640; gs = snap(aw / W); }
  else { gs = snap(ah / H); if (aw / gs < 640) gs = snap(aw / 640); W = Math.max(640, Math.min(800, Math.floor(aw / gs))); }
  const rd = v => Math.round(v * dpr) / dpr; MOB.gs = gs; MOB.gx = rd(sa.l + (aw - W * gs) / 2); MOB.gy = rd(MOB.portrait ? sa.t : sa.t + (ah - H * gs) / 2);
  document.body.classList.remove('portrait'); }
let BTN_CSS = false, MS = null; const MSC = { chars: 0, max: 0 }; let TAP = null;
function mStat(kind, v) { if (!MS) return; if (kind === 't') MS.minText = Math.min(MS.minText, v); else MS.minTarget = Math.min(MS.minTarget, v); }
function fitTxt(s, maxW, size) { s = String(s); ctx.font = `bold ${size}px monospace`; if (ctx.measureText(s).width <= maxW) return s; while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1); return s + '…'; }
function mt(s, x, y, size, col = '#fff', align = 'left', maxW = 0) { mStat('t', size); txt(maxW ? fitTxt(s, maxW, size) : s, x, y, size, col, align); }
function wrapTxt(s, x, y, maxW, size, col, align = 'center', maxLines = 4) { ctx.font = `bold ${size}px monospace`; const words = String(s).split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = fitTxt(lines[maxLines - 1] + '…', maxW, size); }
  lines.forEach((l, i) => mt(fitTxt(l, maxW, size), x, y + i * Math.round(size * 1.25), size, col, align)); return lines.length * Math.round(size * 1.25); }
function mBtn(x, y, w, h, label, fn, opt = {}) { buttons.push({ x, y, w, h, fn, css: true }); if (MS) (MS.btns = MS.btns || []).push([String(label), Math.round(x + w / 2), Math.round(y + h / 2)]); mStat('b', Math.min(w, h)); const sz = opt.size || 16;
  ctx.fillStyle = opt.disabled ? '#3a3340' : (opt.hl ? '#f2c230' : (opt.bg || '#2b5fd9')); ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y + h - 3, w, 3);
  mt(label, x + w / 2, y + h / 2 + sz * 0.36, sz, opt.hl ? '#000' : (opt.disabled ? '#999' : '#fff'), 'center', w - 12); }
function mBg() { ctx.fillStyle = '#1a1224'; ctx.fillRect(0, 0, MOB.vw, MOB.vh); ctx.globalAlpha = 0.18; for (let y = 0; y < MOB.vh; y += 96) for (let x = 0; x < MOB.vw; x += 96) ctx.drawImage(SPR.tile, x, y, 96, 96); ctx.globalAlpha = 1; }
const mTop = () => MOB.sa.t + (MOB.portrait && !MOB.portraitOk ? 64 : 0) + 8;
// flow a row of buttons (auto width, 44 px tall), wrapping, centred in [x0, x0 + maxW]; returns bottom y
function mRow(items, x0, y, maxW, h = 44) { ctx.font = 'bold 16px monospace'; const ws = items.map(it => Math.max(it.minW || 88, Math.ceil(ctx.measureText(it.label).width) + 28)); let rows = [[]], rw = [0];
  ws.forEach((w, i) => { if (rw[rw.length - 1] + w > maxW && rows[rows.length - 1].length) { rows.push([]); rw.push(0); } rows[rows.length - 1].push(i); rw[rw.length - 1] += w + 10; });
  rows.forEach((r, ri) => { let x = x0 + (maxW - (rw[ri] - 10)) / 2; for (const i of r) { mBtn(x, y + ri * (h + 10), ws[i], h, items[i].label, items[i].fn, items[i]); x += ws[i] + 10; } }); return y + rows.length * (h + 10); }
function mBack(to) { mBtn(MOB.sa.l + 12, mTop(), 104, 44, '‹ ' + L2('Volver', 'Back'), () => { screen = to; MSC.chars = 0; }, { bg: '#3a2f5a' }); }
function mTitle() { mBg(); const { vw, vh, sa } = MOB, top = mTop(), cw = vw - sa.l - sa.r;
  const lh = Math.min(MOB.portrait ? 170 : 132, (vh - top - sa.b) * 0.36), lw = lh * 1.8; let y = top;
  if (UI.title) { ctx.imageSmoothingEnabled = false; ctx.drawImage(UI.title, 0, 60, 864, 480, vw / 2 - lw / 2, y, lw, lh); } else mt('CHECK-OUT CHAOS', vw / 2, y + 40, 28, '#f2c230', 'center');
  y += lh + 4; if (!FULL()) mt(tr('DEMO'), vw / 2 + lw / 2 - 8, y - 6, 16, '#c58cff', 'right');
  mt('🔑 ' + META.keys + '   ☠ ' + META.totalKills + '   🏆 ' + Object.keys(META.ach).length + '/' + D.achievements.length, vw / 2, y + 16, 16, '#ffd23f', 'center', cw - 24); y += 30;
  mBtn(vw / 2 - 120, y, 240, 56, L2('JUGAR', 'PLAY'), () => { screen = 'chars'; }, { hl: true, size: 22 }); y += 68;
  const items = [{ label: tr('Logros'), fn: () => { screen = 'ach'; } }, { label: L2('Recetas', 'Recipes'), fn: () => { screen = 'book'; } }, { label: L2('Mejoras', 'Upgrades'), fn: () => { screen = 'shop'; } },
    { label: LANG === 'es' ? 'English' : 'Español', fn: () => setLang(LANG === 'es' ? 'en' : 'es') }];
  if (FS_OK()) items.push({ label: document.fullscreenElement ? L2('Salir de pantalla completa', 'Exit fullscreen') : L2('Pantalla completa', 'Fullscreen'), fn: fsToggle });
  if (!FULL()) items.push({ label: tr('Versión completa'), fn: () => { screen = 'full'; track('full_version_click', { action: 'open_screen', from: 'menu' }); }, bg: '#6a3fb0' });
  mRow(items, sa.l + 12, y, cw - 24); }
function gridLayout(n, x0, y0, gw, gh, minC = 120, gap = 10, scroll = false, rowH = 150) {
  const many = scroll && n > 8; let rows = Math.max(1, Math.min(4, n, Math.floor((gh + gap) / (rowH + gap)))), ch, cols, cw;
  for (;;) { ch = Math.min(200, (gh - (rows - 1) * gap) / rows); cols = Math.ceil(n / rows); cw = (gw - (cols - 1) * gap) / cols;
    if (many || cw >= minC || rows >= n) break; const ch2 = (gh - rows * gap) / (rows + 1); if (ch2 < minC) break; rows++; }
  if (many) cw = Math.max(Math.min(cw, 170), Math.min(160, Math.max(minC, (gw - 3 * gap) / 3.6)));
  cw = Math.min(cw, 190, Math.max(ch, minC) * 1.1);
  return { rows, cols, cw, ch, gap, content: cols * (cw + gap) - gap }; }
function mGrid(items, drawCard, area, scrollable) { if (MSC.scr !== screen) { MSC.scr = screen; MSC.chars = 0; } const g = gridLayout(items.length, area.x, area.y, area.w, area.h, 120, 10, scrollable, area.rowH || 150);
  const max = Math.max(0, g.content - area.w); MSC.max = scrollable ? max : 0; if (scrollable) MSC.chars = Math.max(0, Math.min(max, MSC.chars)); const off = scrollable ? MSC.chars : 0;
  const x0 = area.x + (g.content < area.w ? (area.w - g.content) / 2 : 0) - off, y0 = area.y + Math.max(0, (area.h - (g.rows * (g.ch + g.gap) - g.gap)) / 2);
  ctx.save(); ctx.beginPath(); ctx.rect(area.x - 4, area.y - 4, area.w + 8, area.h + 8); ctx.clip();
  items.forEach((it, i) => { const col = Math.floor(i / g.rows), row = i % g.rows, x = x0 + col * (g.cw + g.gap), y = y0 + row * (g.ch + g.gap);
    if (x + g.cw < area.x - 4 || x > area.x + area.w + 4) return; buttons.push({ x: Math.max(x, area.x), y, w: Math.min(x + g.cw, area.x + area.w) - Math.max(x, area.x), h: g.ch, fn: it.fn, css: true }); mStat('b', Math.min(g.cw, g.ch)); MS.card = [Math.round(g.cw), Math.round(g.ch)]; drawCard(it, x, y, g.cw, g.ch); });
  ctx.restore(); if (max > 0) { const tw = area.w * area.w / g.content, tx = area.x + (area.w - tw) * (MSC.chars / max); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(area.x, area.y + area.h + 2, area.w, 4); ctx.fillStyle = '#f2c230'; ctx.fillRect(tx, area.y + area.h + 2, tw, 4); }
  return g; }
// landscape: grid left, info column + CTA right; portrait: grid top, info + CTA below
function mSplit() { const { vw, vh, sa } = MOB, top = mTop() + 52, side = MOB.portrait ? 0 : Math.min(230, Math.max(170, vw * 0.27));
  if (MOB.portrait) { const infoH = 150; return { grid: { x: sa.l + 12, y: top, w: vw - sa.l - sa.r - 24, h: vh - sa.b - top - infoH - 12 }, info: { x: sa.l + 12, y: vh - sa.b - infoH, w: vw - sa.l - sa.r - 24, h: infoH - 8 } }; }
  return { grid: { x: sa.l + 12, y: top, w: vw - sa.l - sa.r - side - 36, h: vh - sa.b - top - 16 }, info: { x: vw - sa.r - side - 12, y: top, w: side, h: vh - sa.b - top - 8 } }; }
function mCTA(info, label, fn, opt = {}) { const w = Math.min(info.w, 200); mBtn(info.x + info.w - w, info.y + info.h - 56, w, 56, label, fn, Object.assign({ hl: true, size: 20 }, opt)); }
function mChars() { mBg(); const { vw } = MOB, top = mTop(); mBack('menu'); mt(L2('ELEGÍ PERSONAJE', 'CHOOSE CHARACTER'), vw / 2, top + 29, 20, '#f2c230', 'center', vw - 260); mt('🔑 ' + META.keys, vw - MOB.sa.r - 16, top + 28, 16, '#ffd23f', 'right');
  const S = mSplit(), cs = D.characters;
  mGrid(cs.map(c => ({ c, fn: () => { const un = playable(c.id); MENU_PEEK = un ? null : c.id; if (un) META.sel = c.id; else sfx('hurt'); saveMeta(); } })), (it, x, y, w, h) => { const c = it.c, un = playable(it.c.id), sel = MENU_PEEK ? MENU_PEEK === c.id : META.sel === c.id;
    ctx.fillStyle = sel ? '#3a2f5a' : '#241c33'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = sel ? '#f2c230' : '#554'; ctx.lineWidth = sel ? 3 : 1; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.globalAlpha = un ? 1 : 0.3; const s = Math.max(1.5, Math.min((h - 44) / 34, (w - 16) / 32)); drawAnim(playerKey(c.id, META.costumeSel[c.id]), x + w / 2, y + 8 + 32 * s, animFrame(sel, performance.now() / 1000), false, s); ctx.globalAlpha = 1;
    mt(c.name, x + w / 2, y + h - 12, 16, '#fff', 'center', w - 8); if (!un) mt('🔒', x + w - 14, y + 22, 16, '#fff', 'center'); }, S.grid, true);
  const sc = cs.find(c => c.id === (MENU_PEEK || META.sel)) || cs[0], I = S.info; let y = I.y + 20;
  mt(sc.name, I.x, y, 20, '#f2c230', 'left', I.w); y += 24; y += wrapTxt(D.weapons[sc.weapon].name + ': ' + sc.bonusText, I.x, y, I.w, 16, '#ddd', 'left', MOB.portrait ? 2 : 4);
  if (!playable(sc.id)) wrapTxt(!canUnlock(sc.id) ? tr('Disponible en la versión completa') : (sc.unlock ? tr('Desbloqueo: ') + sc.unlock.text : ''), I.x, y + 4, I.w, 16, '#ff7bc2', 'left', 2);
  const own = costumesOf(META.sel); if (own.length) { const cur = META.costumeSel[META.sel]; mBtn(I.x, I.y + I.h - 56 - (MOB.portrait ? 0 : 54), MOB.portrait ? Math.min(I.w - 210, 200) : Math.min(I.w, 200), 44, tr('Traje: ') + (cur ? D.costumes[cur].name : tr('Clásico')), cycleCostume, { bg: '#3a2f5a' }); }
  mCTA(I, L2('Jugar', 'Play') + ' ▶', startSelected); }
function mLevels() { mBg(); const { vw } = MOB, top = mTop(); mBack('chars'); mt(tr('ELEGÍ NIVEL'), vw / 2, top + 29, 20, '#f2c230', 'center', vw - 260); mt('🔑 ' + META.keys, vw - MOB.sa.r - 16, top + 28, 16, '#ffd23f', 'right');
  const S = mSplit(), Ls = LEVELS().slice(), CL = D.checkin ? levelDef('checkin') : null; const items = Ls.map(L => ({ L, fn: () => { if (levelPlayable(L)) { META.levelSel = L.id; saveMeta(); } else startLevel(L.id); } }));
  if (CL) items.push({ L: CL, ci: true, fn: () => startCheckin() });
  mGrid(items, (it, x, y, w, h) => { const L = it.L, ok = levelPlayable(L), why = levelLockReason(L), sel = !it.ci && META.levelSel === L.id, k = 'ui_nivel_' + L.id + (ok ? '_unlocked' : '_locked');
    ctx.fillStyle = ok ? '#2d2440' : '#18131f'; ctx.fillRect(x, y, w, h); const A = SHEET[k]; if (A) { const s = Math.min(w / 112, (h - 26) / 160), iw = 112 * s, ih = 160 * s; ctx.drawImage(A.img, x + (w - iw) / 2, y + 2, iw, ih); }
    else if (it.ci && SHEET.ui_checkin_titulo) drawSpr('ui_checkin_titulo', x + w / 2, y + h / 2 - 14, 0, 0, Math.min(1, w / 140));
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + h - 26, w, 26); mt(it.ci ? 'Check-In' : L.name, x + w / 2, y + h - 8, 16, ok ? '#fff' : '#aaa', 'center', w - 8);
    if (!ok) { mt('🔒', x + w / 2, y + h / 2 - 8, 22, '#fff', 'center'); mt(it.ci ? (!FULL() ? L2('Completa', 'Full game') : L2('5 niveles', '5 levels')) : why === 'full' ? L2('Completa', 'Full game') : why === 'soon' ? tr('Próximamente') : tr('Ganá ') + levelDef(why.slice(4)).name, x + w / 2, y + h / 2 + 16, 16, why === 'full' || (it.ci && !FULL()) ? '#c58cff' : '#ffd23f', 'center', w - 8); }
    if (META.levelsWon[L.id]) mt('✔', x + w - 14, y + 22, 18, '#3fdc5a', 'center'); if (sel) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); } }, S.grid, false);
  const L = levelDef(META.levelSel) || Ls[0], I = S.info; let y = I.y + 20; mt(L.name, I.x, y, 20, '#f2c230', 'left', I.w); y += 26; mt('★'.repeat(L.diff || 1) + '☆'.repeat(5 - (L.diff || 1)), I.x, y, 16, '#ffd23f', 'left', I.w); y += 22;
  mt(META.levelsWon[L.id] ? '✔ ' + L2('Ganado', 'Won') : (META.levelBest[L.id] ? L2('Mejor ', 'Best ') + fmt(META.levelBest[L.id]) : ''), I.x, y, 16, '#3fdc5a', 'left', I.w);
  if (!FULL()) mBtn(I.x, I.y + I.h - 56 - (MOB.portrait ? 0 : 54), MOB.portrait ? Math.min(I.w - 210, 200) : Math.min(I.w, 200), 44, tr('Versión completa'), () => { screen = 'full'; track('full_version_click', { action: 'open_screen', from: 'levels' }); }, { bg: '#6a3fb0' });
  mCTA(I, L2('Jugar', 'Play') + ' ▶', () => startLevel()); }
const w2c = (x, y) => [MOB.gx + x * MOB.gs, MOB.gy + y * MOB.gs];
function mHUD() { const { vw, sa } = MOB, gs = MOB.gs, top = sa.t; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, top, vw, 5); ctx.fillStyle = '#3fbf5a'; ctx.fillRect(0, top, vw * Math.min(1, G.xp / G.xpNext), 5);
  mt(tr('NV ') + G.lvl + '  ' + fmt(G.t), vw / 2, top + 28, 20, G.t >= TLd().highSeason ? '#ff8040' : '#fff', 'center'); let y = top + 48; const ph = phaseName(); if (ph) { mt(ph, vw / 2, y, 16, ph === tr('RESPIRO') ? '#7fe0ff' : '#ff8040', 'center'); y += 20; }
  mt('☠ ' + G.kills + '  🔑 ' + G.keys, sa.l + 12, top + 26, 16, '#ffd23f'); const bs = 22, sl = slotsOpen();
  for (let row = 0; row < 2; row++) { const arr = row === 0 ? G.weapons : G.passives; for (let i = 0; i < sl; i++) { const x = sa.l + 12 + i * (bs + 3), yy = top + 36 + row * (bs + 3), it = arr[i]; ctx.fillStyle = it && it.evo ? 'rgba(120,80,0,.7)' : 'rgba(0,0,0,.45)'; ctx.fillRect(x, yy, bs, bs); if (!it) continue;
    drawIcon(row === 0 ? weaponIcon(it) : (D.passives[it.id].icon || ('ic_' + it.id)), x, yy, bs); } }
  const bb = (G.boss && G.boss.alive) ? G.boss : (G.mini && G.mini.alive ? G.mini : null);
  if (bb) { const bw = Math.min(320, vw - 200); ctx.fillStyle = '#300'; ctx.fillRect(vw / 2 - bw / 2, y - 6, bw, 8); ctx.fillStyle = bb === G.boss ? '#d4af37' : '#ff2a2a'; ctx.fillRect(vw / 2 - bw / 2, y - 6, bw * bb.hp / bb.maxHp, 8); mt(bb.d.name.toUpperCase() + (bb === G.boss ? tr(' · FASE ') + (bb.phase || 1) : ''), vw / 2, y + 18, 16, '#ffb080', 'center', bw + 40); y += 28; }
  if (G.rescue && !G.rescue.done) { const R0 = G.rescue, dx = R0.x - G.p.x, dy = R0.y - G.p.y; mt(tr('RESCATE') + ' ' + Math.floor(R0.prog) + '/' + D.rescueRules.hold + 's', vw / 2, y + 4, 16, '#50ffa0', 'center');
    if (Math.abs(dx) > W / 2 - 10 || Math.abs(dy) > H / 2 - 10) { const a = Math.atan2(dy, dx), [ex, ey] = w2c(W / 2 + Math.cos(a) * (W / 2 - 18), H / 2 + Math.sin(a) * (H / 2 - 18)); ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = '#50ffa0'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.fill(); ctx.restore(); } }
  const [px, py] = w2c(W / 2, H / 2); const hb = 48, hy = py - 26 * gs - 12; ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(px - hb / 2 - 1, hy - 1, hb + 2, 8); ctx.fillStyle = G.p.hp / G.p.maxHp < 0.3 ? '#ff4040' : '#3fdc5a'; ctx.fillRect(px - hb / 2, hy, hb * Math.max(0, G.p.hp / G.p.maxHp), 6);
  if (G.banner) { const [, by] = w2c(0, H / 3); wrapTxt(G.banner.s, vw / 2, by, Math.min(vw - 40, 600), 20, '#ffd23f', 'center', 2); }
  mBtn(vw - sa.r - 16 - 44, top + 14, 44, 44, 'II', () => togglePause(), { bg: 'rgba(40,30,70,.85)', size: 18 }); }
function cardsLayout(n, x0, y0, aw, ah, minW = 140, minH = 180, gap = 12) { for (let cols = n; cols >= 1; cols--) { const rows = Math.ceil(n / cols), cw = Math.min(210, (aw - (cols - 1) * gap) / cols), ch = Math.min(250, (ah - (rows - 1) * gap) / rows);
    if (cw >= minW && ch >= minH) return { cols, rows, cw, ch, gap }; } const cols = n, rows = 1; return { cols, rows, cw: (aw - (cols - 1) * gap) / cols, ch: Math.min(250, ah), gap }; }
function mCards(list, drawCard, area) { const L = cardsLayout(list.length, area.x, area.y, area.w, area.h); const tw = L.cols * (L.cw + L.gap) - L.gap, th = L.rows * (L.ch + L.gap) - L.gap;
  list.forEach((it, i) => { const c = i % L.cols, r = Math.floor(i / L.cols), inRow = Math.min(L.cols, list.length - r * L.cols), rw = inRow * (L.cw + L.gap) - L.gap;
    const x = area.x + (area.w - rw) / 2 + c * (L.cw + L.gap), y = area.y + (area.h - th) / 2 + r * (L.ch + L.gap); buttons.push({ x, y, w: L.cw, h: L.ch, fn: it.fn, css: true }); mStat('b', Math.min(L.cw, L.ch)); MS.card = [Math.round(L.cw), Math.round(L.ch)]; drawCard(it, x, y, L.cw, L.ch); }); return L; }
const mOverlay = (a = 0.75) => { ctx.fillStyle = `rgba(10,6,16,${a})`; ctx.fillRect(0, 0, MOB.vw, MOB.vh); };
function mLevelUp() { const { vw, vh, sa } = MOB; if (G.luLvl !== G.lvl || !G.luT) { G.luLvl = G.lvl; G.luT = performance.now(); } const locked = performance.now() - G.luT < 300;
  mOverlay(); mt(G.banishMode ? tr('ELEGÍ UNA OPCIÓN PARA DESCARTAR') : tr('¡SUBISTE DE NIVEL!'), vw / 2, sa.t + 34, 22, G.banishMode ? '#ff6060' : '#ffd23f', 'center', vw - 40);
  const area = { x: sa.l + 16, y: sa.t + 50, w: vw - sa.l - sa.r - 32, h: vh - sa.t - sa.b - 50 - 66 };
  mCards(G.choices.map((c, i) => ({ c, fn: () => { if (performance.now() - G.luT >= 300) choose(i); } })), (it, x, y, w, h) => { const [nm, d, ic] = upLabel(it.c);
    ctx.fillStyle = '#2a2140'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = G.banishMode ? '#ff6060' : nm.startsWith('→') ? '#ff7bc2' : '#f2c230'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    const is = Math.min(48, h * 0.25); drawIcon(ic, x + w / 2 - is / 2, y + 10, is); let yy = y + 18 + is + 16; yy += wrapTxt(nm, x + w / 2, yy, w - 14, 16, '#fff', 'center', 2) + 4; wrapTxt(d, x + w / 2, yy, w - 14, 16, '#bbb', 'center', Math.max(1, Math.floor((y + h - yy - 6) / 20)));
    if (locked) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y, w, h); } }, area);
  const by = vh - sa.b - 56; mBtn(vw / 2 - 200, by, 190, 44, tr('Reroll (') + G.rerolls + ')', () => { if (!locked) reroll(); }, { disabled: G.rerolls <= 0 }); mBtn(vw / 2 + 10, by, 190, 44, tr('Descartar (') + G.banishLeft + ')', () => { if (!locked) toggleBanish(); }, { disabled: G.banishLeft <= 0, hl: G.banishMode }); }
function mFusion() { const { vw, vh, sa } = MOB; mOverlay(0.82); mt(tr('COFRE VIOLETA: ¿FUSIONAR?'), vw / 2, sa.t + 34, 22, '#c58cff', 'center', vw - 40);
  mCards(G.fusionOpts.map(f => ({ f, fn: () => doFusion(f) })), (it, x, y, w, h) => { const f = it.f; ctx.fillStyle = '#2a1740'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = f.rare ? '#ffd23f' : '#c58cff'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    drawIcon(f.icon, x + w / 2 - 20, y + 10, 40); let yy = y + 70; yy += wrapTxt(f.name, x + w / 2, yy, w - 14, 16, '#fff', 'center', 2) + 4; wrapTxt(f.desc, x + w / 2, yy, w - 14, 16, '#ccc', 'center', Math.max(1, Math.floor((y + h - yy - 6) / 20))); },
    { x: sa.l + 16, y: sa.t + 50, w: vw - sa.l - sa.r - 32, h: vh - sa.t - sa.b - 50 - 66 });
  mBtn(vw / 2 - 150, vh - sa.b - 56, 300, 44, L2('No, abrir cofre normal', 'No, open normal chest'), () => { G.fusionOpts = null; G.state = 'play'; openChestNormal(); }); }
function mPause() { const { vw, vh } = MOB; mOverlay(); let y = Math.max(MOB.sa.t + 40, vh / 2 - 150); mt(tr('PAUSA'), vw / 2, y, 26, '#fff', 'center'); y += 20;
  const items = [{ label: L2('Seguir', 'Resume'), fn: togglePause, hl: true, minW: 220 }, { label: tr('Sonido: ') + (AU.on ? tr('ON') : tr('OFF')), fn: () => { AU.on = !AU.on; if (AU.mus) AU.mus.gain.value = AU.on ? 0.18 : 0; } }];
  if (window.MUSIC) items.push({ label: tr('Música ') + (MUSIC.mute ? tr('OFF') : Math.round(MUSIC.vol * 100) + '%'), fn: () => MUSIC.setMute(!MUSIC.mute) });
  if (FS_OK()) items.push({ label: document.fullscreenElement ? L2('Salir de pantalla completa', 'Exit fullscreen') : L2('Pantalla completa', 'Fullscreen'), fn: fsToggle });
  items.push({ label: tr('Abandonar'), fn: () => { G.state = 'play'; G.abandoned = true; endRun(false); }, bg: '#7a2b3a' }); mRow(items, MOB.sa.l + 16, y, Math.min(560, vw - MOB.sa.l - MOB.sa.r - 32) , 48); }
function mSummary() { const { vw, vh, sa } = MOB; mOverlay(0.85); let y = Math.max(sa.t + 40, vh / 2 - 150); const mw = vw - sa.l - sa.r - 32;
  mt(G.win ? tr('¡EL HOTEL ES TUYO!') : tr('TE DIERON DE BAJA'), vw / 2, y, 26, G.win ? '#3fdc5a' : '#ff6060', 'center', mw); y += 34;
  mt(tr('Tiempo: ') + fmt(G.t) + '   ' + tr('Kills: ') + G.kills, vw / 2, y, 18, '#fff', 'center', mw); y += 26; mt(tr('Llaves ganadas: ') + G.keysFinal + tr('  (total ') + META.keys + ')', vw / 2, y, 18, '#ffd23f', 'center', mw); y += 26;
  if (G.achNow.length) y += wrapTxt(tr('Logros: ') + G.achNow.join(', '), vw / 2, y, mw, 16, '#ffd23f', 'center', 2); if (G.unlockedNow.length) y += wrapTxt(tr('Desbloqueado: ') + G.unlockedNow.join(', '), vw / 2, y, mw, 16, '#ff7bc2', 'center', 2);
  mRow([{ label: L2('Otra run', 'Play again'), fn: () => newRun(G.char.id), hl: true, minW: 200 }, { label: tr('Menú [M]').replace(' [M]', ''), fn: () => { screen = 'menu'; G = null; }, minW: 160 }], sa.l + 16, y + 10, mw, 52); }
const STICK = { R: 65, knob: 28, max: 60, dead: 6 };
function stickZone(p) { if (MOB.portrait) return p.cy > MOB.gy + H * MOB.gs; return p.cx < MOB.vw / 2 && p.cy > MOB.vh * 0.4; }
function stickCenter(cx, cy) { const { sa, vw, vh } = MOB, R = STICK.R; let x = Math.max(sa.l + 16 + R, cx), y = Math.min(vh - sa.b - 8 - R, Math.max(R + 8, cy));
  if (!MOB.portrait) { x = Math.min(x, vw / 2 - R - 8); const [px, py] = w2c(W / 2, H / 2), dx = x - px, dy = y - py, d = Math.hypot(dx, dy), need = R + 34 * MOB.gs + 8; if (d < need) { const a = Math.atan2(dy, dx || -1); x = px + Math.cos(a) * need; y = py + Math.sin(a) * need; x = Math.max(sa.l + 16 + R, x); } }
  else y = Math.max(y, MOB.gy + H * MOB.gs + R + 8); return [x, y]; }
function mStick() { const R = STICK.R; let x, y, kx, ky, a;
  if (JOY.active) { x = JOY.sx; y = JOY.sy; const dx = JOY.x - x, dy = JOY.y - y, d = Math.min(STICK.max, Math.hypot(dx, dy)), an = Math.atan2(dy, dx); kx = x + Math.cos(an) * d; ky = y + Math.sin(an) * d; a = 0.7; }
  else { [x, y] = stickCenter(0, MOB.portrait ? (MOB.gy + H * MOB.gs + MOB.vh) / 2 : MOB.vh); kx = x; ky = y; a = 0.4; }
  ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(kx, ky, STICK.knob, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
function mPortrait() { const { vw, vh, sa } = MOB; const play = screen === 'play', bandY = MOB.gy + H * MOB.gs;
  const w = Math.min(vw - 32, 380), h = play ? 190 : 52, x = (vw - w) / 2, y = play ? Math.min(vh - sa.b - h - 12, bandY + 16) : sa.t + 6;
  ctx.fillStyle = 'rgba(30,20,50,.95)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#c58cff'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  const icon = (ix, iy, s) => { ctx.save(); ctx.translate(ix, iy); ctx.rotate(-Math.PI / 2 * ((performance.now() / 1200) % 1 < 0.5 ? 0 : 1)); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(-s * 0.3, -s * 0.5, s * 0.6, s); ctx.restore();
    ctx.strokeStyle = '#c58cff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy, s * 0.72, -2.6, -0.6); ctx.stroke(); };
  const msg = L2('Girá el teléfono', 'Rotate your phone'), btnL = L2('Jugar igual', 'Play anyway'), ok = () => { MOB.portraitOk = true; if (G && G.portraitPause) { G.portraitPause = false; if (G.state === 'pause') G.state = 'play'; } };
  if (play) { icon(vw / 2, y + 44, 40); mt(msg, vw / 2, y + 100, 20, '#fff', 'center', w - 20); mt(L2('El juego está pausado', 'The game is paused'), vw / 2, y + 124, 16, '#bbb', 'center', w - 20); mBtn(vw / 2 - 90, y + 136, 180, 44, btnL, ok, { hl: true }); }
  else { icon(x + 26, y + 26, 26); mt(msg, x + 50, y + 32, 16, '#fff', 'left', w - 200); mBtn(x + w - 140, y + 4, 136, 44, btnL, ok, { hl: true }); } }
function mToasts(dt) { let y = MOB.sa.t + 70; const w = Math.min(300, MOB.vw * 0.42), x = MOB.vw - MOB.sa.r - 16 - w;
  for (const a of achToast) { a.t -= dt; ctx.fillStyle = 'rgba(20,10,30,.88)'; ctx.fillRect(x, y, w, 50); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, 49); mt(a.s, x + 8, y + 20, 16, '#ffd23f', 'left', w - 16); mt(a.sub || '', x + 8, y + 40, 16, '#ddd', 'left', w - 16); y += 56; }
  achToast = achToast.filter(a => a.t > 0); }
// mobile: remaining screens (achievements, recipe book, upgrades shop, full-version page, Check-In guest select)
function mFullArea() { const { vw, vh, sa } = MOB, top = mTop() + 52; return { x: sa.l + 12, y: top, w: vw - sa.l - sa.r - 24, h: vh - sa.b - top - 16 }; }
function mHeader(title, back, right) { const { vw } = MOB, top = mTop(); mBack(back); mt(title, vw / 2, top + 29, 20, '#f2c230', 'center', vw - 260); if (right) mt(right, vw - MOB.sa.r - 16, top + 28, 16, '#ffd23f', 'right', 120); }
function mCardText(lines, x, y, w, h) { let yy = y; for (const [s, col, max] of lines) { if (!s) continue; if (yy > y + h - 16) break; yy += wrapTxt(s, x + w / 2, yy, w - 14, 16, col, 'center', Math.max(1, Math.min(max || 3, Math.floor((y + h - yy) / 20)))) + 4; } }
function mAch() { mBg(); mHeader(tr('LOGROS'), 'menu', '🏆 ' + Object.keys(META.ach).length + '/' + D.achievements.length);
  mGrid(D.achievements.map(a => ({ a, fn: () => { } })), (it, x, y, w, h) => { const a = it.a, got = !!META.ach[a.id]; ctx.fillStyle = got ? '#2f3a26' : '#241c33'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = got ? '#3fdc5a' : '#554'; ctx.lineWidth = got ? 2 : 1; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    mt(got ? '✔' : '·', x + w / 2, y + 22, 18, got ? '#3fdc5a' : '#888', 'center'); mCardText([[a.name, got ? '#3fdc5a' : '#fff', 2], [a.desc, '#ccc', 3], [tr('Premio: ') + rewardText(a.reward), '#ffd23f', 3]], x, y + 36, w, h - 40); }, Object.assign(mFullArea(), { rowH: 200 }), true); }
function mBook() { mBg(); mHeader(tr('LIBRO DE RECETAS ').trim(), 'menu', Object.keys(META.book.fused).length + '/' + D.fusions.length);
  mGrid(D.fusions.map(f => ({ f, fn: () => { } })), (it, x, y, w, h) => { const f = it.f, s = bookState(f), known = s.fused || (s.wHalf && s.pHalf);
    ctx.fillStyle = s.fused ? '#2a1740' : '#1f1830'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = s.fused ? '#ffd23f' : (f.rare ? '#c58cff' : '#554'); ctx.lineWidth = s.fused ? 2 : 1; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    if (known) drawIcon(f.icon, x + w / 2 - 20, y + 8, 40); else { const c = SHEET.ui_receta_silueta ? 'ui_receta_silueta' : null; if (c) drawIcon(c, x + w / 2 - 20, y + 4, 40); else mt('?', x + w / 2, y + 38, 28, '#555', 'center'); }
    const r1 = s.wHalf ? f.recipe.w.map(id => D.weapons[id].evo.name).join(' + ') : (f.rare ? tr('Requiere dos') + ' ' + tr('armas maestras') : '???'), r2 = f.recipe.p ? (s.pHalf ? '+ ' + D.passives[f.recipe.p].name : '+ ???') : '';
    mCardText([[known ? f.name : '???', s.fused ? '#ffd23f' : '#fff', 2], [r1, '#c58cff', 3], [r2, '#c58cff', 2], [s.fused ? f.desc : '', '#ccc', 3]], x, y + 60, w, h - 64); }, Object.assign(mFullArea(), { rowH: 200 }), true); }
function mShop() { mBg(); mHeader(L2('MEJORAS', 'UPGRADES'), 'menu', '🔑 ' + META.keys);
  mGrid(D.shop.map(s => ({ s, fn: () => { const pr = shopPrice(s); if (pr != null && META.keys >= pr) { META.keys -= pr; META.shop[s.id]++; saveMeta(); sfx('key'); } else sfx('hurt'); } })), (it, x, y, w, h) => { const s = it.s, pr = shopPrice(s), lv = META.shop[s.id] || 0, can = pr != null && META.keys >= pr;
    ctx.fillStyle = '#241c33'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = can ? '#f2c230' : '#554'; ctx.lineWidth = can ? 2 : 1; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    mCardText([[s.name, '#fff', 2], [L2('Nivel ', 'Level ') + lv + '/' + s.price.length, '#ccc', 1]], x, y + 22, w, h - 70);
    ctx.fillStyle = pr == null ? '#3a3340' : (can ? '#f2c230' : '#3a3340'); ctx.fillRect(x + 8, y + h - 52, w - 16, 44); mt(pr == null ? 'MAX' : pr + ' 🔑', x + w / 2, y + h - 24, 18, can ? '#000' : '#999', 'center', w - 24); }, mFullArea(), true); }
function mFull() { mBg(); mHeader(tr('VERSIÓN COMPLETA'), 'menu'); const S = mSplit(), lk = D.characters.filter(c => !inDemoSet(c.id));
  mGrid(lk.map(c => ({ c, fn: () => { } })), (it, x, y, w, h) => { const c = it.c; ctx.fillStyle = '#241c33'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#554'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    const s = Math.max(1.5, Math.min((h - 44) / 34, (w - 16) / 32)); drawAnim(playerKey(c.id, null), x + w / 2, y + 8 + 32 * s, animFrame(false, performance.now() / 1000), false, s); mt(c.name, x + w / 2, y + h - 12, 16, playable(c.id) ? '#3fdc5a' : '#fff', 'center', w - 8); }, S.grid, true);
  const I = S.info; let y = I.y + 16; for (const l of [tr('11 personajes más, cada uno con su arma y bonus'), tr('4 niveles más, rescates y logros para desbloquear personajes'), tr('Tu progreso de la demo se conserva')]) { if (y > I.y + I.h - 80) break; y += wrapTxt('· ' + l, I.x, y, I.w, 16, '#ffd23f', 'left', MOB.portrait ? 2 : 3) + 6; }
  const u = FULL_URL(); mCTA(I, u ? L2('Conseguir', 'Get it') + ' ▶' : tr('Próximamente'), () => { track('full_version_click', { action: 'link', hasUrl: !!u, from: 'full_screen' }); if (u) PLATFORM.openLink(u); }, { hl: !!u, disabled: !u }); }
function mGuests() { mBg(); mHeader(tr('ELEGÍ HUÉSPED'), 'levels', 'Check-In'); const S = mSplit(), gs = D.checkin.guests;
  mGrid(gs.map((g, i) => ({ g, fn: () => { GUEST_SEL = i; } })), (it, x, y, w, h) => { const g = it.g, sel = gs[GUEST_SEL] === g; ctx.fillStyle = sel ? '#2a3a5a' : '#1a1f33'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = sel ? '#7ae8ff' : '#445'; ctx.lineWidth = sel ? 3 : 1; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    const s = Math.max(1.5, Math.min((h - 44) / 34, (w - 16) / 32)); drawAnim('pl_' + g.id, x + w / 2, y + 8 + 32 * s, animFrame(sel, performance.now() / 1000), false, s); mt(g.name, x + w / 2, y + h - 12, 16, '#fff', 'center', w - 8); }, Object.assign(S.grid, { rowH: 190 }), false);
  const g = gs[GUEST_SEL] || gs[0], I = S.info; let y = I.y + 20; if (SHEET[g.portrait]) ctx.drawImage(SHEET[g.portrait].img, I.x, y - 16, 48, 48); mt(g.name, I.x + (SHEET[g.portrait] ? 56 : 0), y + 12, 20, '#7ae8ff', 'left', I.w - 56); y += 44;
  wrapTxt(tr(g.bonusText), I.x, y, I.w, 16, '#ddd', 'left', MOB.portrait ? 2 : 5); mCTA(I, L2('Jugar', 'Play') + ' ▶', () => newRun(g.id, 'checkin')); }
function mobileFrame(raw) { MS = { screen, minText: 1e9, minTarget: 1e9 }; const d = MOB.dpr;
  if (screen === 'play' && G && G.state === 'play' && MOB.portrait && !MOB.portraitOk) { G.state = 'pause'; G.portraitPause = true; }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  const world = () => { ctx.setTransform(MOB.gs * d, 0, 0, MOB.gs * d, MOB.gx * d, MOB.gy * d); ctx.imageSmoothingEnabled = false; ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); BTN_CSS = false; };
  const ui = () => { ctx.setTransform(d, 0, 0, d, 0, 0); ctx.imageSmoothingEnabled = false; BTN_CSS = true; };
  ui();
  if (screen === 'menu') mTitle(); else if (screen === 'chars') mChars(); else if (screen === 'levels') mLevels();
  else if (screen === 'play' && G) { world(); renderWorld(); if (LV.id !== 'lobby') renderLevelTop(G.camX, G.camY); ctx.restore(); ui(); mHUD();
    if (G.state === 'levelup') mLevelUp(); else if (G.state === 'fusion') mFusion(); else if (G.state === 'over') mSummary(); else if (G.state === 'pause' && !G.portraitPause) mPause(); if (G.state === 'play' || G.portraitPause) mStick(); }
  else { const m2 = { ach: mAch, book: mBook, shop: mShop, full: mFull, guests: mGuests }[screen]; if (m2) m2(); }
  ui(); mToasts(raw); if (MOB.portrait && !MOB.portraitOk) mPortrait(); BTN_CSS = false;
  MS.gs = MOB.gs; MS.W = W; MS.vw = MOB.vw; MS.vh = MOB.vh; window.__ccMobileStats = MS; }
function mDown(e, p) { if (screen === 'play' && G && G.state === 'play' && stickZone(p) && !hitBtn(p)) { const [sx, sy] = stickCenter(p.cx, p.cy); Object.assign(JOY, { active: true, id: e.pointerId, sx, sy, x: p.cx, y: p.cy }); try { cv.setPointerCapture(e.pointerId); } catch (er) { } return; }
  TAP = { id: e.pointerId, p, moved: false, s0: MSC.chars }; }
function mMove(e, p) { if (JOY.active && e.pointerId === JOY.id) { JOY.x = p.cx; JOY.y = p.cy; return; } if (TAP && TAP.id === e.pointerId) { const dx = p.cx - TAP.p.cx, dy = p.cy - TAP.p.cy; if (Math.abs(dx) > 10 || Math.abs(dy) > 10) TAP.moved = true; if (TAP.moved && MSC.max > 0) MSC.chars = Math.max(0, Math.min(MSC.max, TAP.s0 - dx)); } }
function mUp(e) { if (TAP && TAP.id === e.pointerId) { if (!TAP.moved) clickQ.push(TAP.p); TAP = null; } }
window.__ccScroll = () => ({ v: Math.round(MSC.chars), max: Math.round(MSC.max) });
const MOBILE_API = { hasChars: true, get mob() { return MOB; }, portraitOk: () => { MOB.portraitOk = true; if (G && G.portraitPause) { G.portraitPause = false; if (G.state === 'pause') G.state = 'play'; } } };

let last = 0;
// music director: menu -> level track (missing -> mus_lobby) -> boss when the final boss spawns -> win/lose sting (0.5 s crossfades in audio.js)
let MUS_KEY = '';
function musicTick() { if (!window.MUSIC) return; let k;
  if (screen !== 'play' || !G) k = 'mus_menu'; else if (G.state === 'over') k = G.win ? 'sting_win' : 'sting_lose'; else if (G.boss && G.boss.alive && (G.boss.d.final || G.duenoSpawned)) k = 'mus_boss'; else k = 'mus_' + (G.ci ? 'checkin' : (LV && LV.id) || 'lobby');
  if (k === MUS_KEY) return; MUS_KEY = k; try { if (k.startsWith('sting_')) MUSIC.sting(k); else MUSIC.play(k); } catch (e) {} }
function frame(ts) {
  const raw = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  const steps = Math.max(1, Math.round(DBG.speed)); for (let i = 0; i < steps; i++) update(raw * DBG.speed / steps);
  processClicks(); buttons = [];
  if (MOB.on) mobileFrame(raw); else {
  ctx.setTransform(SC, 0, 0, SC, 0, 0); ctx.imageSmoothingEnabled = false;
  if (screen === 'menu') renderMenu(); else if (screen === 'levels') renderLevels(); else if (screen === 'guests') renderGuests(); else if (screen === 'ach') renderAch(); else if (screen === 'book') renderBook(); else if (screen === 'full') renderFull();
  else { renderWorld(); if (LV.id !== 'lobby') renderLevelTop(G.camX, G.camY); renderHUD(); if (G.state === 'levelup') renderLevelUp(); else if (G.state === 'pause') renderPause(); else if (G.state === 'fusion') renderFusion(); else if (G.state === 'over') renderSummary(); }
  renderToasts(raw); }
  const active = screen === 'play' && G && G.state === 'play' && !G.victory; if (active !== PLATFORM.playing) { if (active) PLATFORM.gameplayStart(); else PLATFORM.gameplayStop(); }
  musicTick();
  if (AU.mus) { const gv = audible() ? 0.18 : 0; if (AU.mus.gain.value !== gv) AU.mus.gain.value = gv; }
  if (DBG.speed !== 1 || DBG.t || DBG.god || DBG.dmg !== 1) txt('DEBUG x' + DBG.speed + (DBG.god ? ' god' : '') + (DBG.dmg !== 1 ? ' dmg' + DBG.dmg : ''), W - 4, H - 4, 6, '#f55', 'right');
  requestAnimationFrame(frame);
}

(async function boot() {
  resize(); await PLATFORM.init(); PLATFORM.loadingStart(); D = await loadData(); applyLang(); buildSprites(); buildExtraSprites(); for (const L of (D.levels || [])) L.art = (window.LEVEL_ART || {})[L.id] || null; if (D.checkin) { D.checkin.level.art = (window.LEVEL_ART || {}).checkin || null; CI_TL = Object.assign({}, D.timeline, { dueAt: D.checkin.bossAt, inspAt: 1e9, highSeason: 1e9, breathFrom: 1e9, breathTo: 1e9, lateFrom: 1e9, firstElite: 1e9, congaFrom: 1e9, eliteRegularFrom: 1e9 }); }
  LV = levelDef('lobby'); loadMeta(); await loadSheets(); if (D.checkin) for (const g of D.checkin.guests) if (SHEET[g.sheet]) SHEET['pl_' + g.id] = SHEET[g.sheet]; await loadUI();
  ENE = new Pool(D.timeline.maxEnemies + 60, () => ({})); PROJ = new Pool(500, () => ({})); PICK = new Pool(700, () => ({})); FX = new Pool(500, () => ({}));
  window.CC = { get G() { return G; }, get screen() { return screen; }, get META() { return META; }, enemies: () => ENE.count(), fusionEligible: () => fusionEligible(), doFusion: id => doFusion(D.fusions.find(f => f.id === id)), openChest: () => openChest(), slotsOpen: () => slotsOpen(), WS: id => WS(G.weapons.find(w => w.id === id)), sheets: () => Object.keys(SHEET), foodCount, choose, newRun, addWeapon: id => addWeapon(id), addPassive: id => addPassive(id), recalc: () => recalcPassives(), DBG };
  window.CC.setLang = setLang; window.CC.playable = id => playable(id); window.CC.grantAch = id => grantAch(id); window.CC.FULL = () => FULL(); window.CC.loadMeta = () => loadMeta(); window.CC.lang = () => LANG; window.CC.tr = tr; window.CC.D = () => D; Object.assign(window.CC, { get LV() { return LV; }, levelDef, levelPlayable, levelLockReason, unlockChar, checkinUnlocked, startLevel, newRunAt: (c, l) => newRun(c, l), endRun: w => endRun(w), MISSING_ART, get screenName() { return screen; }, setScreen: v => { screen = v; }, applyControl, inWater: (x, y) => inWater(x, y), hazards: () => G.hz, ciControlAlive: () => ciControlAlive(), solids: () => G.solids, spawn: (t, x, y) => spawnEnemy(t, x, y), startCheckin: () => startCheckin(), proj: () => PROJ.items, fireProj: o => fireProj(o), isDark: (x, y) => isDark(x, y), windVec: (x, y) => windVec(x, y), inRescueZone: (x, y, p) => inRescueZone(x, y, p), keyOf: id => META_KEY });
  Object.assign(window.CC, MOBILE_API);
  window.CC.enemyList = () => ENE.items; // read-only view for the QA debug autoplay (debug.js, ?debug=1 only)
  PLATFORM.loadingFinished();
  track('session_start', { device: ANALYTICS_DEV(), origin: (window.ANALYTICS && window.ANALYTICS.origin()) || null, returning: !!(window.ANALYTICS && window.ANALYTICS.returning), persistent: STORE.persistent, viewport: innerWidth + 'x' + innerHeight });
  requestAnimationFrame(frame);
})();
function ANALYTICS_DEV() { return window.ANALYTICS ? window.ANALYTICS.device() : 'unknown'; }
})();
