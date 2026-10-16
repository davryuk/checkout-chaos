// Platform adapter: none | poki | crazygames. Chosen by ?platform= or window.BUILD_PLATFORM (set by the dist build).
// SDK scripts are injected only for poki/crazygames. No ads wired yet (commercialBreak/rewardedBreak stubs only).
(function () {
  const q = new URLSearchParams(location.search).get('platform');
  const name = ['poki', 'crazygames', 'none'].includes(q) ? q : (window.BUILD_PLATFORM || 'none');
  const SRC = { poki: 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js', crazygames: 'https://sdk.crazygames.com/crazygames-sdk-v3.js' };
  let playing = false, ready = false;
  const P = { name, muted: false, ready: false, playing: false, events: [],
};
  function note(ev) { P.events.push(ev); }
  function sdk() { if (name === 'poki') return window.PokiSDK || null; if (name === 'crazygames') return (window.CrazyGames && window.CrazyGames.SDK) || null; return null; }
  let chain = Promise.resolve(); // SDK calls run in order, only after init() resolves (never before the SDK has booted)
  function safe(fn) { chain = chain.then(() => { try { fn(); } catch (e) { } }); }
  function inject(src) { return new Promise(res => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); }); }
  P.init = async function () {
    if (name === 'none') { ready = P.ready = true; return; }
    let done; chain = new Promise(r => done = r); const real = (async () => {
    const ok = await inject(SRC[name]);
    if (ok && name === 'poki' && window.PokiSDK) await window.PokiSDK.init().catch(() => { });
    if (ok && name === 'crazygames' && window.CrazyGames && window.CrazyGames.SDK) {
      await window.CrazyGames.SDK.init().catch(() => { });
      try { const g = window.CrazyGames.SDK.game; P.muted = !!(g.settings && g.settings.muteAudio); g.addSettingsChangeListener(s => { P.muted = !!s.muteAudio; }); } catch (e) { }
    }
    ready = P.ready = !!sdk(); note('init:' + (ready ? 'ok' : 'fail')); })();
    real.finally(done);
    // Don't hold the game hostage to a slow/blocked SDK: continue after 4 s; queued SDK calls still run once init settles.
    await Promise.race([real, new Promise(r => setTimeout(r, 4000))]);
  };
  P.loadingStart = function () { note('loadingStart'); const s = sdk(); if (s && name === 'crazygames') safe(() => s.game.loadingStart()); };
  P.loadingFinished = function () { note('loadingFinished'); const s = sdk(); if (!s) return;
    if (name === 'poki') safe(() => s.gameLoadingFinished()); if (name === 'crazygames') safe(() => s.game.loadingStop()); };
  P.gameplayStart = function () { if (playing) return; playing = P.playing = true; note('gameplayStart'); const s = sdk(); if (!s) return;
    if (name === 'poki') safe(() => s.gameplayStart()); if (name === 'crazygames') safe(() => s.game.gameplayStart()); };
  P.gameplayStop = function () { if (!playing) return; playing = P.playing = false; note('gameplayStop'); const s = sdk(); if (!s) return;
    if (name === 'poki') safe(() => s.gameplayStop()); if (name === 'crazygames') safe(() => s.game.gameplayStop()); };
  P.happytime = function () { const s = sdk(); if (s && name === 'crazygames') safe(() => s.game.happytime()); };
  // Outbound links: Poki forbids direct external links; route through its SDK. Others open a new tab.
  P.openLink = function (url) { if (!url) return false; const s = sdk();
    if (name === 'poki') { if (s && s.openExternalLink) { safe(() => s.openExternalLink(url)); return true; } return false; }
    safe(() => window.open(url, '_blank', 'noopener')); return true; };
  // Ads placeholders (not wired yet): always resolve without showing anything.
  P.commercialBreak = () => Promise.resolve(false); P.rewardedBreak = () => Promise.resolve(false);
  window.PLATFORM = P;
})();
