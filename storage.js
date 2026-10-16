// Safe storage: localStorage when available (incognito/iframes may throw), in-memory fallback otherwise.
(function () {
  const mem = new Map(); let ls = null;
  try { const k = '__cc_probe__'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); ls = window.localStorage; } catch (e) { ls = null; }
  window.STORE = {
    persistent: !!ls,
    get(k) { if (ls) { try { const v = ls.getItem(k); if (v != null) return v; } catch (e) { } } return mem.has(k) ? mem.get(k) : null; },
    set(k, v) { v = String(v); mem.set(k, v); if (ls) { try { ls.setItem(k, v); } catch (e) { } } },
    remove(k) { mem.delete(k); if (ls) { try { ls.removeItem(k); } catch (e) { } } },
    getJSON(k) { try { return JSON.parse(this.get(k)); } catch (e) { return null; } },
    setJSON(k, o) { try { this.set(k, JSON.stringify(o)); } catch (e) { } }
  };
})();
