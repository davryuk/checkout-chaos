// Minimal analytics: track(event, props) -> queue. No SDK, no network by default.
// Default sink is a no-op (add ?analytics=console to log). Plug a real backend with ANALYTICS.setAdapter(fn).
(function () {
  const Q = new URLSearchParams(location.search), S = window.STORE;
  const ID_KEY = 'checkoutChaos.anonId';
  let anon = S.get(ID_KEY), returning = !!anon;
  if (!anon) { anon = 'a-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); S.set(ID_KEY, anon); }
  const session = 's-' + Math.random().toString(36).slice(2, 10);
  const queue = [], log = [], MAX = 500;
  let adapter = Q.get('analytics') === 'console' ? (e => console.log('[track]', e.event, e.props)) : null;
  function flush() { if (!adapter) return; while (queue.length) { const e = queue.shift(); try { adapter(e); } catch (err) { } } }
  function track(event, props) {
    const e = { event, props: Object.assign({}, props || {}), ts: Date.now(), anonId: anon, sessionId: session,
      platform: (window.PLATFORM && window.PLATFORM.name) || 'none', lang: window.LANG || null };
    log.push(e); if (log.length > MAX) log.shift();
    queue.push(e); if (queue.length > MAX) queue.shift(); flush(); return e;
  }
  function device() { const ua = navigator.userAgent || '', touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 1, m = Math.min(screen.width, screen.height);
    if (/iPad|Tablet/i.test(ua) || (touch && m >= 600)) return 'tablet'; if (/Mobi|Android|iPhone/i.test(ua) || (touch && m < 600)) return 'mobile'; return 'desktop'; }
  function origin() { let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { }
    return { portal: (window.PLATFORM && window.PLATFORM.name) || 'none', host: location.hostname || 'file', referrer: ref }; }
  window.ANALYTICS = { track, flush, log, queue, anonId: anon, returning, device, origin,
    setAdapter(fn) { adapter = typeof fn === 'function' ? fn : null; flush(); } };
  window.track = track;
})();
