# Check-Out Chaos — Plan de monetización y validación (Day7, 16-oct-2026)

> Regla de este documento: cada dato externo lleva su fuente (consultada el 16-oct-2026). Lo que no tiene fuente está marcado **[SUPUESTO PROPIO, A CALIBRAR]**.

## Resultado

**Recomendación:** no monetizar todavía. Las próximas 2 a 4 semanas son para **validar la retención con costo casi cero**, usando canales web gratuitos. Hasta tener datos, todo lo demás se posterga.

1. **Semana 0-1:** sumar instrumentación mínima (unos 10 eventos) y publicar gratis en **itch.io** (web, “pagá lo que quieras” con mínimo $0). En paralelo, **mandarlo a CrazyGames (Basic Launch)**, que te da sin costo métricas de un público real de portal. Antes de mandarlo a CrazyGames hay que decidir si te interesa Poki (ver Riesgo).
2. **Semana 2-4:** leer las métricas contra los umbrales de abajo. Hay tres salidas posibles:
   - **Retiene bien en web** → Full Launch en CrazyGames con rewarded ads opt-in a través de su SDK, que es la única monetización web realista para un juego gratis.
   - **Retiene bien y la gente pide “más”** → abrir la página *Coming Soon* de Steam ($100) y medir wishlists, apuntando a una versión **premium de precio bajo** con más contenido. Es el modelo natural del género tipo Vampire Survivors.
   - **No retiene** → iterar el balance y el early game antes de gastar un dólar.
3. **Google Play queda para después.** Una cuenta personal nueva tiene que pasar un test cerrado de 12 testers durante 14 días antes de publicar, y además el juego necesita un pase de UX mobile. Es demasiado costo para la fase de validación.

**Modelo de ingresos recomendado (en orden):**
- **Web (CrazyGames/Poki):** juego gratis más **rewarded ads 100 % opt-in**. Por ejemplo: “ver un anuncio para revivir una vez por partida” o “x2 monedas al terminar la partida”. Nunca interstitials en medio de la partida, nunca ads obligatorios para progresar, y el botón siempre dice exactamente qué recibís.
- **Steam/itch (descarga):** **premium**, con una demo o la versión web como embudo. Los cosméticos (outfits) van **dentro** del premium o como un DLC “supporter” opcional y barato. Nada de loot boxes, monedas premium ni FOMO con temporizadores.
- **Cosméticos con pago real en web:** no por ahora. En CrazyGames los in-game purchases son solo por invitación y pasan por Xsolla.
- **DLC de contenido** (personajes/armas nuevas): solo si Steam muestra tracción, después del lanzamiento.

## Evidencia

### Lo que hay en el código (/workspace/checkout-chaos, revisado sin modificar nada)
| Tema | Estado |
|---|---|
| Analytics | **No hay.** Ni gtag, ni posthog, ni ningún endpoint. El único `fetch` carga `data.json`. |
| Guardado | Sí, en `localStorage` (meta v2 con migración desde v1, `game.js` ~l.138-156). Es local por navegador: no hay cuentas ni nube. |
| Outfits | Sí, existen “trajes/skins” (`data.js`, `game.js`, y sprites como `player_recepcionista_gala.png`). |
| Mobile | Hay soporte táctil: `pointerdown` más un joystick touch (`game.js` l.170/534), viewport `user-scalable=no` y `touch-action:none`. **No se probó en un dispositivo real.** |
| Tamaño | Unos 2.5 MB en total, la mayoría screenshots de documentación. El build jugable (html+js+json+sprites.js) ronda los 300 KB. Queda muy por debajo del límite de CrazyGames (50 MB inicial). Son 3 scripts sin bundler. |

### Canales (requisitos verificados)
| Canal | Costo | Plazo | Requisitos clave | Fuente |
|---|---|---|---|---|
| **itch.io** | $0. Revenue share abierto: vos elegís qué % se queda itch | Inmediato | Página más upload HTML5. Límite blando de 20 proyectos | https://itch.io/docs/creators/faq |
| **CrazyGames** | $0 | Basic Launch: mínimo 7 días y 500 plays, termina sí o sí a los 21 días. Después, Full Launch si las métricas dan | Basic: inicial ≤50 MB, PEGI12, sin ads externos, SDK opcional, **sin monetización**. Full: SDK más evento GameplayStart, ads solo por SDK, entrar directo a jugar, progreso ligado a la cuenta CG. **Revenue share sin % publicado** (se calcula mensual según usuarios y rendimiento de ads). No exclusivo por defecto; exclusividad web opcional de 2 meses que suma +50 % de compensación | https://docs.crazygames.com/requirements/intro/ · https://docs.crazygames.com/ · https://files.crazygames.com/documents/developer_terms_20250818.pdf |
| **Poki** | $0 | Curado a mano, sin plazo publicado | Submit con descripción y 3 screenshots. Deal preferido: **exclusividad web por 5 años** (incluye Discord y YouTube Playables; deja libres Steam, stores y consolas). 50/50 en tráfico que trae Poki, 100 % del tráfico directo. Si el juego ya está en otros portales web: solo una licencia fija, sin revenue share | https://developers.poki.com/guide/share · https://developers.poki.com/guide/revenue-deal-types · https://sdk.poki.com/ |
| **Steam** | **$100 por app** (recuperable después de $1.000 de ingreso bruto ajustado) | Pedir la revisión de la página Coming Soon **≥7 días hábiles antes**. La página Coming Soon tiene que estar visible **≥2 semanas** antes del lanzamiento | Assets de branding, descripción, idealmente un trailer. Wrapper de escritorio (Electron o Tauri; Tauri genera binarios más chicos) | https://partner.steamgames.com/doc/gettingstarted/appfee · https://partner.steamgames.com/doc/store/coming_soon |
| **Google Play** | **$25 por única vez** | Cuentas personales creadas después del 13-nov-2023: **test cerrado con ≥12 testers activos 14 días seguidos**, y después la revisión de acceso a producción (“usualmente ≤7 días”) | Wrapper TWA (Bubblewrap) o Capacitor, política de contenido y clasificación por edad | https://support.google.com/googleplay/android-developer/answer/6112435 · https://support.google.com/googleplay/android-developer/answer/14151465 |

Otros canales posibles, **no verificados en esta pasada**: GameDistribution, Newgrounds y YouTube Playables (este último cae dentro de la exclusividad de Poki).

### Instrumentación mínima (taxonomía de eventos)
`session_start` (device, origen/portal, nuevo o recurrente) · `run_start` (personaje, outfit) · `run_end` (motivo: muerte, victoria o abandono; minuto alcanzado; nivel; nº de fusiones) · `minute_reached` (5, 10, 15) · `level_up_choice` (arma u opción elegida) · `fusion_made` · `character_unlocked` · `achievement_unlocked` · `rewarded_offer_shown` / `rewarded_accepted` (cuando haya ads) · `wishlist_click` (link a Steam). Para el ID alcanza con uno anónimo en localStorage, sin datos personales. Si se suma una herramienta externa (ByteBrew, que CrazyGames recomienda, o PostHog/Plausible), hace falta un aviso de privacidad (la doc de CrazyGames lo exige si se recolectan datos más allá de su SDK).

### Umbrales de decisión
**No conseguí benchmarks externos verificables** para D1/D7, duración de sesión, completion rate ni wishlist→venta en este género. No los busqué con fuente primaria y no voy a citar cifras de memoria. Todos los umbrales que siguen son **[SUPUESTO PROPIO, A CALIBRAR]**. Están pensados para la decisión de “invertir más o iterar”, no para afirmar que el juego anda bien:
| Métrica | Seguir invirtiendo | Iterar | Frenar o repensar |
|---|---|---|---|
| D1 (web) | ≥30 % | 15-30 % | <15 % |
| D7 (web) | ≥10 % | 4-10 % | <4 % |
| Duración media de sesión | ≥15 min | 8-15 | <8 |
| % de run_start que llega al min 5 | ≥70 % | 50-70 | <50 (problema de early game) |
| % de run_start que completa los 15 min | 10-35 % (roguelite: perder es normal) | <10 % o >60 % (balance) | — |
| Runs por usuario el día 1 | ≥2 | 1.3-2 | <1.3 |
| Click a wishlist / usuarios únicos | ≥3 % | 1-3 % | <1 % |
| Rewarded opt-in (cuando haya) | lo mido, sin meta: nunca optimizar forzando | — | — |
Muestra mínima para decidir: ~500 usuarios por canal **[SUPUESTO]**. Coincide con el umbral de 500 plays del Basic Launch de CrazyGames, que sí tiene fuente. CrazyGames ya muestra en su dashboard retención, playtime y gameplay conversion.

### Estimación de ingresos
**No la hago.** CrazyGames no publica su % ni su eCPM, y Poki define los términos caso por caso. Tampoco verifiqué fuentes confiables de ventas o wishlists en Steam para juegos comparables. Cualquier número sería inventado. Cuando haya datos de retención reales, se puede estimar con los ingresos que muestre el dashboard de CrazyGames o con las wishlists de Steam.

## Siguiente acción
1. **(Dave decide)** ¿Poki sí o no? Si sí, mandarlo a Poki **antes** de publicarlo en cualquier portal web, porque si ya está en otro portal Poki ofrece solo una licencia fija. ¿Cuenta la página de GitHub Pages? No está claro (ver Riesgo).
2. Implementar los ~10 eventos (1-2 días), sumar un aviso de privacidad y un link de “Wishlist/seguinos”.
3. QA en 2 o 3 teléfonos reales (joystick, rendimiento con muchos enemigos, orientación).
4. Publicar en itch.io y mandarlo a CrazyGames Basic Launch (o a Poki, según el punto 1).
5. Semana 3-4: leer los umbrales y pasar por la puerta de decisión. Si da verde, pagar Steam ($100) y abrir Coming Soon (con ≥7 días hábiles de revisión).
6. Google Play solo después, y solo si los datos mobile de los portales muestran buen engagement.

## Riesgo
- **Exclusividad de Poki:** publicar primero en CrazyGames o itch puede cerrar el deal con revenue share de Poki. No verifiqué si que el juego ya esté en GitHub Pages o itch cuenta como “otra plataforma web”. Hay que preguntarle a Poki por escrito.
- **Balance sin probar:** las métricas pueden salir bajas por un problema de tuning y no porque el concepto no sirva. Por eso hay que leer `minute_reached` y `run_end` antes de concluir.
- **Partidas de 15 min contra el público de portales web**, que suele preferir sesiones cortas **[SUPUESTO, sin fuente]**. Puede castigar la gameplay conversion.
- **Guardado local:** si el jugador borra el navegador pierde el progreso. Para Full Launch en CrazyGames hay que ligar el progreso a su cuenta (es un requisito).
- **Mobile no verificado en dispositivo real.**
- **Ética y cumplimiento:** ads solo opt-in y etiquetados; nada de dark patterns. PEGI12 en CrazyGames (revisar el tono del humor, por ejemplo “Karen”).
- Todos los umbrales son supuestos propios y la estimación de ingresos queda pendiente a propósito.

---

## Portales web: pagos y requisitos (verificado 16-oct-2026)

> Todo lo de esta sección sale de páginas oficiales consultadas hoy. "**No publicado**" significa que la fuente oficial no da el dato, y no hay que completarlo con estimaciones.

### CrazyGames
**Hosting:** CrazyGames hostea los archivos que subís al Developer Portal y los sirve por su CDN. También acepta un iframe desde dominio propio, pero esos juegos solo generan ingresos si tienen el SDK integrado. No hace iframe de juegos alojados en otros portales. Fuente: https://docs.crazygames.com/faq/

**Pago y reparto:**
| Etapa | Cuánto se cobra | Fuente |
|---|---|---|
| Basic Launch | Nada. Los ads están deshabilitados y no hay revenue share | https://docs.crazygames.com/requirements/ads/ |
| Full Launch | Revenue share **sin % publicado**. Se calcula todos los meses según usuarios que llegan al juego, rendimiento de ads e interés de anunciantes (Terms 5.4) | https://files.crazygames.com/documents/developer_terms_20250818.pdf |

- Para cobrar en Full Launch hace falta: SDK integrado, cero ads externos, ninguna marca de otro portal y un juego original (FAQ).
- Exclusividad: es opcional. Si optás por 2 meses de exclusividad web, la compensación sube un 50 % (Terms 5.5). Sin esa opción, el acuerdo no es exclusivo.
- Pago: mensual desde €100 acumulados (lo que no llega pasa al mes siguiente), por transferencia o PayPal. Fuente: https://docs.crazygames.com/faq/
- **No publicado:** el %, el eCPM y los formularios de impuestos (no los verifiqué).

**Requisitos técnicos** (https://docs.crazygames.com/requirements/technical/ · https://docs.crazygames.com/requirements/intro/):
- **Tamaño:** total ≤250 MB, descarga inicial ≤50 MB, ≤20 MB para aparecer en la home mobile. Máximo 1500 archivos. Rutas solo relativas.
- **SDK:** opcional en Basic Launch (si se integra, hay que disparar `gameplayStart`). Obligatorio en Full Launch: eventos gameplay start/stop, más el módulo Data para progreso y el módulo User si aplica.
- **Navegadores:** tiene que andar en Chrome y Edge. En Safari y en Chromebooks de 4 GB se deshabilita si funciona mal.
- **Controles:** mouse, teclado y touch (si soporta mobile).
- **Orientación:** landscape en desktop. La orientación mobile se configura en el submit y la plataforma se encarga de pedir que se gire el dispositivo. Hay que agregar `user-select:none` y respetar las safe areas de su app.
- **Idioma:** el juego **tiene que tener soporte en inglés**. Su ausencia figura entre los motivos de rechazo en QA (FAQ).
- **Contenido:** PEGI-12 y nada dirigido a niños.
- **Ads (Full Launch):** solo por SDK. Midgame entre etapas, máximo 1 cada 3 minutos, y lo controla la plataforma. Rewarded opcional, sin encadenar, sin aparecer en pantalla de juego activo, y con el botón de "continuar sin ver" del mismo tamaño y estilo. Tiene que ser jugable con AdBlock activo.
- **Formato de subida:** el portal acepta subir los archivos del build. **No encontré una regla publicada sobre zip.**

### Poki
**Hosting:** Poki hostea el build que se sube a Poki for Developers (o al Poki Inspector, que acepta una carpeta con index.html). Bloquea todas las requests externas salvo las que apruebe por CSP. Fuentes: https://developers.poki.com/guide/adding-your-game · https://developers.poki.com/guide/external-resources-policy

**Pago:**
| Modalidad | Cómo se cobra | Fuente |
|---|---|---|
| Uso de la plataforma y fase de testeo | Gratis, y Poki no paga nada durante los tests (Terms 14-16) | https://app.poki.dev/20260622_Poki_for_Developers_Terms_and_Conditions.pdf |
| **Exclusiva web** (deal preferido) | 5 años "indicativos". 50/50 sobre jugadores que trae Poki y 100 % para vos del tráfico directo (búsqueda, bookmarks, redes, comunidad propia). La exclusividad cubre web, Discord y YouTube Playables, y deja libres Steam, tiendas de apps y consolas | https://developers.poki.com/guide/revenue-deal-types · https://sdk.poki.com/ |
| **No exclusiva** | Licencia fija de pago único, sin revenue share. Es la opción si el juego ya está en otras plataformas web o tiene un encaje nicho. **El monto no está publicado** | https://developers.poki.com/guide/revenue-deal-types |

- **No publicado:** monto mínimo de pago, calendario de pagos, métodos de cobro y requisitos fiscales. Los términos reales dependen de cada contrato.

**Requisitos técnicos** (https://sdk.poki.com/requirements):
- **Plataformas:** desktop, mobile y tablet son obligatorios. En mobile tiene que cubrir toda la pantalla (portrait, landscape o ambos) y forzar controles touch en tablet.
- **Proporción:** **16:9**, escalando a 640x360, 836x470 o 1031x580.
- **Modo incógnito:** tiene que seguir jugable, con `localStorage` envuelto en try/catch.
- **Requests y marca:** cero requests externas, sin splash screens ni links salientes (los links pasan por `PokiSDK.openExternalLink`).
- **Ads:** sin ads externos y jugable con ad blocker. **SDK obligatorio**: `gameplayStart` en el primer input, `gameplayStop` en cada pausa o menú, y `commercialBreak` o `rewardedBreak`. Sin timers propios para ads. En rewarded: botón normal del mismo tamaño o más grande, el rewarded nunca verde y siempre con 🎬, nunca bloqueando progreso.
- **Monetización:** **IAP no disponible.** Hay que quitar cualquier UI de compra o de "quitar ads".
- **Tamaño:** **sin límite duro publicado.** La guía pide carga de menos de 10 s. La cifra de 5 MB iniciales / 8 MB totales la vi citada en un sitio de terceros (portalready.world) y no la confirmé en la fuente oficial.
- **Idioma:** la localización es recomendada para juegos con mucho texto. No es obligatoria.
- **Thumbnails:** estáticos y animados, necesarios para el global release.
- **Formato:** **no encontré una regla publicada de zip ni de cantidad de archivos.**

### itch.io
**Hosting:** itch hostea el HTML5 en su CDN y lo muestra en un iframe. Fuente: https://itch.io/docs/creators/html5

**Comisión:** open revenue share, de 0 % a 100 % a elección del dev, con **10 % por defecto**. A eso se suma la comisión del procesador de pago (en general $0.30 + 2.9 %). Ejemplo oficial: una venta de $10 deja $8.41 neto. Fuente: https://itch.io/docs/creators/payments
- Los juegos HTML5 **solo pueden recibir donaciones**. Para vender acceso hay que publicarlo como "Downloadable" (misma fuente html5).

**Cobrar desde Argentina** (https://itch.io/docs/creators/payments):
- **Modo "Collected by itch.io" (Payouts):**
  - itch es el merchant of record y se ocupa del IVA de la UE.
  - Pagos en USD, retirables por **PayPal o Payoneer**.
  - Mínimo de $5. Los fondos quedan disponibles 7 días después de cada venta, y la revisión tarda al menos 7 días (normalmente 10 a 14).
  - Una única "tax interview" con número de identificación fiscal (puede ser el local) y un cargo único de $3 por verificar la identidad.
  - **Retención por defecto del 30 %**, que se reduce solo si existe un tratado con EE.UU. **Argentina no tiene tratado de impuesto a la renta con EE.UU.** Esto lo leí en una fuente secundaria (https://omnivoo.com/blog/irs-tax-treaty-withholding-rates-by-country-2026) y **no lo verifiqué en el sitio del IRS**.
  - Una fuente secundaria sugiere que un trabajo hecho íntegramente fuera de EE.UU. podría no ser renta de fuente estadounidense. **Es un tema para hablar con un contador**, no un hecho verificado.
- **Modo "Direct to you":**
  - Stripe directo **solo está listado para EE.UU., Canadá, Irlanda y Reino Unido**, así que no aparece disponible para Argentina.
  - PayPal directo puede requerir cuenta business en algunas regiones. **No verifiqué si una cuenta PayPal argentina puede recibir y retirar en este modo.**
  - En este modo el dev es el merchant of record y se ocupa del IVA.
- **Conclusión práctica:** la vía con más chances es Payouts con Payoneer o PayPal, asumiendo que pueden retener hasta el 30 %. Hay que confirmar con un contador.

**Requisitos técnicos** (https://itch.io/docs/creators/html5):
- **Formato:** ZIP con `index.html` en la raíz (no acepta .rar, .7z ni .tar.gz), o un solo archivo .html.
- **Límites:** ≤1000 archivos, ≤500 MB descomprimido, ≤200 MB por archivo, rutas de ≤240 caracteres. Los nombres distinguen mayúsculas y van en UTF-8. Rutas relativas y recursos externos solo por HTTPS.
- **Mobile:** con el flag "Mobile Friendly" activado, en el teléfono se abre en pantalla completa. **No encontré una regla de orientación publicada.**
- **Sin SDK ni ads obligatorios.** No hay requisito de idioma publicado.
- **Límites de cuenta:** soft limit de 20 proyectos y unos 10 archivos por página para cuentas nuevas (FAQ: https://itch.io/docs/creators/faq).

### Qué implica para Check-Out Chaos (comparado con el código actual)
- **Idioma:** el juego está en español. **CrazyGames exige inglés** para pasar QA, así que hay que localizarlo antes de enviarlo.
- **Tamaño:** el build jugable ronda los 300 KB en 3 scripts más data.json. Cumple holgadamente en los tres portales, aunque conviene empaquetarlo sin los screenshots del repo.
- **Proporción:** Poki pide 16:9. Hay que verificar que el canvas escale así.
- **localStorage:** ya está dentro de try/catch (`game.js` ~l.144-156), lo que cumple el requisito de modo incógnito de Poki.
- **Cero requests externas:** el único `fetch` pide `data.json` con ruta relativa, así que cumple.
- **Exclusividad de Poki:** si se elige Poki, hay que mandarlo antes de subirlo a CrazyGames o itch. Si ya está en otra plataforma web, Poki solo ofrece la licencia fija.
