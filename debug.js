// Check-Out Chaos — internal QA debug mode. OFF unless ?debug=1 (web) or the desktop wrapper is launched with CC_DEBUG=1 / --cc-debug.
// Gives invincibility (same as ?god=1) + an autoplay bot (kites enemies, auto-picks level-ups/fusions) + fps log every 10 s.
// Summary at the end of the run: window.__ccDebugReport (also logged as "[ccdebug] REPORT {...}").
(() => {
  'use strict';
  const Q = new URLSearchParams(location.search);
  if (Q.get('debug') !== '1') return;
  const CH = Q.get('char') || 'recep', AUTO = Q.get('autoplay') !== '0', AUTOSTART = Q.get('autostart') !== '0';
  const log = (...a) => console.log('[ccdebug]', ...a);
  const fps = { win: [], all: [], minAll: Infinity, lastTs: 0, winStart: 0, samples: [] };
  let started = false, reported = false, t0 = 0, keysDown = {};
  const key = (code, down) => { if (!!keysDown[code] === down) return; keysDown[code] = down; dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code })); };
  function steer(mx, my) { const th = 0.3; key('KeyD', mx > th); key('KeyA', mx < -th); key('KeyS', my > th); key('KeyW', my < -th); }
  let orbit = 0;
  function bot(CC, dt) {
    const G = CC.G; if (!G) return;
    if (G.state === 'levelup' && G.choices && G.choices.length) { CC.choose(0); return; }
    if (G.state === 'fusion' && G.fusionOpts && G.fusionOpts.length) { CC.doFusion(G.fusionOpts[0].id); return; }
    if (G.state !== 'play') { steer(0, 0); return; }
    const P = G.p, list = CC.enemyList ? CC.enemyList() : [];
    // repulsion from nearby enemies + slow orbit (kiting) so the crowd trails behind and weapons hit it
    let rx = 0, ry = 0; orbit += dt * 0.35;
    for (const e of list) { if (!e.alive) continue; const dx = P.x - e.x, dy = P.y - e.y, d2 = dx * dx + dy * dy; if (d2 < 140 * 140 && d2 > 1) { const w = 1 / d2; rx += dx * w; ry += dy * w; } }
    let mx = Math.cos(orbit) * 0.004 + rx, my = Math.sin(orbit) * 0.004 + ry;
    const B = G.boss && G.boss.alive ? G.boss : (G.mini && G.mini.alive ? G.mini : null);
    if (B) { // boss: orbit it at ~60px so weapons (mostly short range) keep hitting; god mode absorbs contact
      const dx = B.x - P.x, dy = B.y - P.y, d = Math.hypot(dx, dy) || 1, pull = (d - 60) / 60;
      mx = dx / d * pull - dy / d * 0.8; my = dy / d * pull + dx / d * 0.8; const m = Math.hypot(mx, my) || 1; steer(mx / m, my / m); return; }
    const dist = Math.hypot(P.x, P.y); if (dist > 600) { mx -= P.x / dist * 0.01; my -= P.y / dist * 0.01; } // stay near origin (rescue rooms/arenas)
    const m = Math.hypot(mx, my) || 1; steer(mx / m, my / m);
  }
  function report(CC, why) {
    if (reported) return; reported = true; steer(0, 0); const G = CC.G || {};
    const avg = fps.all.length ? fps.all.reduce((a, b) => a + b, 0) / fps.all.length : 0;
    const r = window.__ccDebugReport = { end: why, win: !!G.win, gameTime: Math.round(G.t || 0), wallSec: Math.round((performance.now() - t0) / 1000), kills: G.kills, level: G.lvl, char: G.char && G.char.id,
      stage: G.stage, fpsMin1s: Math.round(fps.minAll * 10) / 10, fpsAvg: Math.round(avg * 10) / 10, samples10s: fps.samples, build: window.BUILD_INFO || null, ua: navigator.userAgent };
    log('REPORT ' + JSON.stringify(r));
  }
  function tick(ts) {
    const CC = window.CC; requestAnimationFrame(tick);
    if (!CC || !CC.DBG) return;
    CC.DBG.god = true;
    if (!started && Q.get('unlockall') === '1' && !window.__ccUnlockAll && CC.META) { window.__ccUnlockAll = true; const D = CC.D(), M = CC.META; // QA only (?debug=1&unlockall=1): all levels won + all characters -> Check-In open (full build). Written to this profile's save.
      M.levelsWon = M.levelsWon || {}; for (const L of D.levels) M.levelsWon[L.id] = Math.max(1, M.levelsWon[L.id] || 0); M.unlocked = M.unlocked || {}; M.charUnlocks = M.charUnlocks || {}; for (const c of D.characters) { M.unlocked[c.id] = true; M.charUnlocks[c.id] = M.charUnlocks[c.id] || 'debug'; } log('unlockall: levels+characters unlocked'); }
    if (!started) { if (AUTOSTART && CC.screen === 'menu') { started = true; t0 = performance.now(); fps.winStart = ts; log('start run char=' + CH); try { if (CC.newRunAt) CC.newRunAt(CH, Q.get('level') || 'lobby'); else CC.newRun(CH); } catch (e) { log('newRun failed', e); } } return; }
    const dt = fps.lastTs ? (ts - fps.lastTs) / 1000 : 0; fps.lastTs = ts;
    if (dt > 0) fps.win.push(dt);
    // 1-second buckets -> fps; per 10 s: log min/avg
    if (ts - fps.winStart >= 10000 && fps.win.length) {
      const per = []; let acc = 0, n = 0; for (const d of fps.win) { acc += d; n++; if (acc >= 1) { per.push(n / acc); acc = 0; n = 0; } }
      const avg = fps.win.length / fps.win.reduce((a, b) => a + b, 0), min = per.length ? Math.min(...per) : avg;
      fps.all.push(avg); fps.minAll = Math.min(fps.minAll, min); const G = CC.G;
      const s = { t: G ? Math.round(G.t) : null, min: Math.round(min * 10) / 10, avg: Math.round(avg * 10) / 10, enemies: CC.enemies ? CC.enemies() : null, boss: G && G.boss && G.boss.alive ? Math.round(G.boss.hp) : null }; fps.samples.push(s);
      log(`fps t=${s.t}s min=${s.min} avg=${s.avg} enemies=${s.enemies}` + (s.boss != null ? ' bossHp=' + s.boss : '')); fps.win = []; fps.winStart = ts;
    }
    if (AUTO && !reported) bot(CC, Math.min(0.05, dt));
    const G = CC.G; if (!reported && (!G || G.state === 'over')) report(CC, G ? (G.win ? 'victory' : 'over') : 'left-run');
  }
  log('debug mode ON (god + ' + (AUTO ? 'autoplay' : 'manual') + ')'); requestAnimationFrame(tick);
})();
