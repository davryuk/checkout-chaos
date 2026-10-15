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
