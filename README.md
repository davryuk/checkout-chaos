# Check-Out Chaos — MVP jugable (navegador)

Survivor estilo Vampire Survivors con temática hotel. Canvas puro (sin Phaser, sin build step, sin dependencias, funciona offline).

## Correr
- **Directo:** abrir `index.html` (file://). Usa `data.js` como fallback de datos.
- **Server estático:** `cd /workspace/checkout-chaos && python3 -m http.server 8000` → http://localhost:8000 (lee `data.json`).

## Controles
- Mover: WASD / flechas, o arrastrar en pantalla (joystick táctil flotante). Ataque automático.
- Level-up: click o `1`/`2`/`3`, `R` = reroll. Pausa: `Esc` / `P` / botón `II` (con toggle de sonido).
- Menú: `1-4` elegir personaje, `Enter` jugar; click en bloqueados para comprar con llaves. Resumen: `Enter` otra run, `M` menú.

## Debug (params de URL)
| Param | Efecto |
|---|---|
| `?speed=10` | acelera el tiempo de juego x10 (substeps) |
| `?t=540` | arranca la run en el segundo 540 (jefe a las 9:30 = 570) |
| `?god=1` | sin daño recibido |
| `?dmg=6` | multiplicador de daño del jugador |

Ej.: `index.html?t=565&speed=4&god=1&dmg=6` → jefe + victoria en ~15 s reales. Ojo: `?t>=300` desbloquea Botones (la condición es "llegar a 5:00"). Reset de progreso: `localStorage.removeItem('checkoutChaos.meta.v1')`.

## Archivos
`index.html`, `game.js` (todo el juego), `data.json` (personajes/armas/pasivos/enemigos/timeline/tienda), `data.js` (copia embebida para file:// — mantener en sync).

## Hecho
- Run 10 min con timeline del spec (0-2 Apurados; 2-4 +Valijas, élite min 3; 4-6 +Quejas, densidad x2; 6-8 conga de Despedida + élite cada 60s; 8-10 densidad máx; La Inspección a las 9:30 → vencerla = victoria).
- 5 enemigos + jefe con comportamiento: Apurado rápido, Turista tanque que empuja, Queja en línea recta que atraviesa, Karen élite → 3 Quejas al morir (+3 llaves), conga que sigue al líder, Inspección: abanico de 9 checklists + invoca huéspedes.
- 4 personajes con arma/bonus propio; Botones se desbloquea sobreviviendo 5 min, Cocinero con 500 kills totales (o comprándolos con llaves).
- 6 armas (niv 1-5) y 4 pasivos, máx 4+4, level-up de 1 entre 3, reroll.
- Propinas = XP con imán, llaves = moneda meta (élites, jefe, 1.2% drop). Tienda: +Vida, +Daño, +Reroll. Todo en localStorage.
- Pooling de enemigos, proyectiles, pickups y FX desde el inicio.
- Sprites pixel 32x32 generados por código (uniforme distinto por rol, siluetas distintas por enemigo), escala nearest-neighbor. Lobby tileado infinito.
- SFX + música en loop sintetizados con WebAudio (arrancan con el primer input).
- Resumen final: tiempo, kills, llaves, desbloqueos.

## Pendiente / conocido
- Balance no playtesteado por humanos (solo bot headless); la curva es una primera estimación.
- Sin animaciones de walk reales (bob de 1px), sin arte final ni sprites de armas evolucionadas.
- Colisiones O(n·m) simples (OK hasta ~420 enemigos en desktop; perfilar en móviles low-end).
- Sin evoluciones de armas, sin settings de volumen, sin i18n.

## Arte (Paleta, art/)
- `art/*.png` (sheets 1x6: idle0, idle1, walk0-3) se embeben como data URIs en `sprites.js`. Tras cambiar el arte: `python3 build_sprites.py`.
- Walk (~8 fps) al moverse, idle (~2.5 fps) quieto, flip horizontal mirando a la izquierda. Jefe 64x64. Nearest-neighbor.
- Armas, pickups, íconos y tiles siguen generados por código (no hay arte para eso).
- Mantenimiento y Conserje están en `sprites.js` pero no son jugables (no figuran en la selección).

## Co-op (base)
`G.players[]` (hoy 1); `G.p` = alias a `players[0]`. Input como datos: `readInput(slot)` → `{mx,my}` en `player.input`; el render solo lee estado. Pendiente para co-op: armas/XP por jugador, cámara compartida, targeting de enemigos al jugador más cercano.

## v2 (15 min)
- 0-10 igual que v1; 10:00 La Inspección = mini-jefe. 10-15 Temporada Alta (+60% HP, +15% vel, élites c/40s); 12:00 Karens de a pares, Despedidas c/30s, Mucama Fantasma; 14:00-14:15 respiro; 15:00 Dueño del Hotel (espiral de billetes → 4 Abogados → <30% embestida con aviso 1s). Vencerlo = victoria.
- Comida curativa, evoluciones automáticas a nivel 5, 14 logros (trajes/llaves/desbloqueos, pantalla `L`, traje `T`), 14 personajes. Save v2 en `checkoutChaos.meta.v2`, migra el v1 sin borrarlo.
- Todo el balance en `data.json`; `python3 build_sprites.py` regenera `sprites.js` y `data.js`.
- Test full run: `index.html?speed=12&god=1&dmg=8`.

## v3
- Armas nv1-8 (nv2 efecto A, nv4 efecto B, nv5 evolución automática, nv6 +25% daño, nv7 +1 proyectil/+20% área, nv8 maestría -20% cd). 22 armas, todas con evolución. 16 pasivos nv1-5.
- Slots 4+4 → 8+8 (se abren a nv 10/18/26/34). 4 opciones por level-up (Gerente 5), 2 rerolls + 1 descarte (`X`). XP +30% desde min 10, Despedidas x5. Cofres de élite (20% x3).
- Fusiones: arma evolucionada nv8 + pasivo nv5 (raras: 2 evoluciones nv8) → cofre violeta → FUSIONAR/NO. 15 normales + 4 raras, máx 3 por run, 1 rara. Libro de Recetas (`B` en el menú). Save v3 (migra v1/v2).
- `python3 build_sprites.py` incluye automáticamente todo PNG nuevo de art/ (clave = nombre de archivo).

## Portal prep (i18n · 16:9 · analytics · platform adapter · ZIP builds)
- **Languages ES/EN.** UI strings use the Spanish literal as the key: `tr('...')`, with the table in `i18n/en_ui.json`. Data text (names and descriptions) comes from the EN overlay in `i18n/en_data.json`, keyed by path (e.g. `weapons.timbre.name`). `python3 build_strings.py` generates `strings.js`. Language order: `?lang=`, then the saved choice (`checkoutChaos.lang`), then `navigator.language`. Switch with the `es | EN` button in the menu or the `I` key.
- **16:9.** Fixed logical view of 640x360, letterboxed and centered. The backing store is an integer multiple, so scaling stays nearest-neighbor. Handles safe-area insets and `user-select:none`, and shows a "rotate your phone" hint in portrait.
- **Storage.** `storage.js` (`STORE`) uses localStorage when it is writable and falls back to memory otherwise (incognito, blocked storage, sandboxed iframes).
- **Analytics.** `analytics.js` provides `track(event, props)`, which queues events in `ANALYTICS.log`. It does nothing by default; add `?analytics=console` to log events, or call `ANALYTICS.setAdapter(fn)` for a real backend. It uses an anonymous ID (`checkoutChaos.anonId`). Events: session_start, run_start, run_end, minute_reached (5/10/15), level_up_choice, fusion_made, character_unlocked, achievement_unlocked, wishlist_click, plus rewarded_offer_shown and rewarded_accepted (reserved for when ads exist).
- **Platform.** `platform.js` selects none, poki or crazygames via `?platform=` or `window.BUILD_PLATFORM`. The SDK script is only injected for poki or crazygames. It reports loading start/finished, and gameplayStart/Stop whenever real gameplay starts or stops (menu, pause, level-up, fusion and game over all count as stopped). It honors CrazyGames `muteAudio`. Ads are stubs only. The wishlist button appears only when `data.json links.wishlist` is set. On Poki it goes through `PokiSDK.openExternalLink`.
- **Builds.** Run `python3 build_dist.py` to produce `dist/checkout-chaos-{poki,crazygames,web}.zip`. Each has `index.html` at the root, relative paths only, and no art folder (sprites are embedded).

## Demo edition
- `data.json edition.FULL_VERSION` defaults to `false` (demo). Builds can override it with `window.BUILD_FULL_VERSION=true` via `python3 build_dist.py --full`, which writes `*-full.zip`; those are not for release.
- In the demo only `edition.demoCharacters` are playable: Recepcionista, Housekeeping and Botones. The other 11, Cocinero included, show 🔒 "Disponible en la versión completa / Available in the full version". They can't be bought with keys.
- Achievements still award keys and costumes in the demo. An achievement that unlocks a character records it in `META.earned` instead, and its reward text says "(versión completa)". When FULL_VERSION is true those earned characters unlock automatically, and keys work at the usual prices.
- Migration: the first time a save from before the demo loads, every character it already owned is copied to `META.legacy`, and those stay playable in the demo. Cocinero used to be a free starter, so every pre-demo save keeps it.
- The menu has a "Versión completa / Full version" button that opens a screen with a link from `links.fullVersion` (empty = "Coming soon"). It sends `full_version_click` with `{action: 'open_screen' | 'link'}`.
- The "Plantel Completo" achievement (unlock all 10) can't be completed in the demo.
