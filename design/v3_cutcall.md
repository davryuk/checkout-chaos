# Check-Out Chaos v3 (diseño de Cutcall, con ajuste del CEO)

AJUSTE: la evolución sigue siendo automática al nivel 5, SIN pasivo requerido (lo pidió Dave). La columna "pasivo para evolución" no se usa. Las fusiones sí usan sus recetas.

Armas máximo nivel 8, pasivos máximo nivel 5.
Niveles de arma: nv1 base; nv2 efecto A; nv3 +20% daño; nv4 efecto B; nv5 EVOLUCIÓN; nv6 +25% daño; nv7 +1 proyectil o +20% área; nv8 MAESTRÍA (-20% enfriamiento, el arma brilla y habilita la fusión).
Fusión: evolución nv8 + pasivo nv5 de la receta hace brillar en violeta el próximo cofre de élite, y ahí elegís FUSIONAR o NO. Si fusionás, el arma y el pasivo desaparecen, queda la habilidad nueva y se libera un slot de pasivo. Fusión rara: dos evoluciones nv8, libera un slot de arma. Máximo 2 fusiones por run; la habilidad fusionada no sube de nivel. 16 armas en total.

| Arma | Efecto A (nv2) | Efecto B (nv4) | Evolución |
| Timbre | +15% radio | +1 pulso | Campana de Gerencia |
| Carrito | +1 rebote | +1 carrito | Carrito Turbo |
| Valija | +1 valija | +velocidad | Equipaje Perdido |
| Sartén | +1 sartén | +radio de órbita | Batería de Cocina |
| Spray | +duración de la nube | ralentiza | Fumigación Total |
| Tarjeta-Llave | +1 tarjeta | atraviesa +1 | Llave Maestra |
| Cóctel | +1 botella | fuego +1 s | Barra Libre: 4 botellas, el fuego se expande |
| Silbato | +empuje | aturde +0,5 s | Alarma de Incendio: onda 360° cada 3 s |
| Piedras | +1 piedra | quemadura | Sauna: aura de calor grande, cura 1 de vida por kill |
| Bastón | +30° de arco | +daño a élites | Portón de Seguridad: golpe 360° que empuja |
| Auto | -1 s de enfriamiento | +1 auto | Limusina: atraviesa toda la pantalla y deja aceite |
| Llave Inglesa | +1 llave | charco más grande | Caja de Herramientas: lluvia de 5 herramientas |
| Linterna | +alcance | +ancho del cono | Reflector: cono 360° lento que gira |
| Cuchillos | +1 cuchillo | atraviesa | Juego de Cuchillos: 8 en abanico que vuelven |
| Memo | +radio de explosión | marca 2 | Despido Masivo: las explosiones encadenan |
| Billetes | +área | +frecuencia | Lluvia de Oro: cada billete da 1 propina |

Pasivos (nv1-5, cada nivel suma lo mismo): Café Doble -6% enfriamiento; Uniforme Planchado +1 armadura; Propina Generosa +10% XP; Zapatos Cómodos +6% velocidad. NUEVOS: Llavero Extra (+1 proyectil en nv2, nv4 y nv5); Plano del Hotel +8% área; Reloj Fichador +10% duración; Cama King +0,2 vida/s; Seguro Médico +12% vida máxima; Amuleto del Conserje +5% suerte (crítico y drops).

Fusiones normales:
- Recepción 24 hs = Campana de Gerencia + Reloj Fichador: campana gigante fija que sigue sonando donde estabas; hasta 3 en el mapa.
- Tren de Lavandería = Carrito Turbo + Plano del Hotel: fila de 6 carritos que te sigue como una serpiente.
- Cinta del Aeropuerto = Equipaje Perdido + Llavero Extra: cinta circular de valijas que gira alrededor tuyo.
- Cocina Infernal = Batería de Cocina + Cama King: anillo de fuego; cada kill adentro te cura.
- Cuarentena = Fumigación Total + Seguro Médico: zona verde grande; los enemigos adentro pierden 2% de vida/s y no atacan.
- Sistema de Seguridad = Llave Maestra + Amuleto del Conserje: puertas que se cierran en línea, crítico asegurado.
- Fiesta en la Terraza = Barra Libre + Zapatos Cómodos: dejás fuego al correr; cuanto más rápido, más fuego.
- Evacuación = Alarma de Incendio + Uniforme Planchado: cada 8 s empuja a todos los enemigos al borde de la pantalla.
- Spa de Lujo = Sauna + Propina Generosa: los enemigos dentro del aura dan XP doble.
- Valet Parking VIP = Limusina + Café Doble: 3 limusinas cada 3 s en direcciones distintas.
- Inventario Anual = Despido Masivo + Plano del Hotel: cada 10 s marca toda la pantalla y la hace explotar.
- Black Friday = Lluvia de Oro + Amuleto del Conserje: billetes por toda la pantalla, 10% de chance de cofre.
Raras:
- Banquete de Bodas = Batería de Cocina + Juego de Cuchillos: mesa giratoria que dispara cubiertos en espiral y cura 1 por kill.
- Apagón = Reflector + Portón de Seguridad: cada 15 s se apaga la pantalla 4 s y todo lo que queda fuera de tu luz recibe daño enorme.
- Check-Out Forzado = Llave Maestra + Limusina: cada 12 s elimina al 20% de los enemigos normales en pantalla (no afecta jefes).

Libro de Recetas: pantalla del menú con 15 tarjetas que arrancan en silueta con ???. La primera evolución de un arma revela esa mitad de sus recetas, y llevar el pasivo a nv5 revela la otra mitad. Las raras solo dicen "Requiere dos armas maestras", más tips crípticos en la pantalla de carga. La primera vez que hacés una fusión: +100 llaves, animación y la tarjeta se ilumina. Logros: Aprendiz (1 fusión, 200 llaves), Sommelier (6, Traje Bartender), Chef de Cocina (las 12 normales, 1000 llaves), Leyenda del Hotel (las 15, traje dorado animado). El cofre brilla violeta para fusión y dorado para evolución.

Prioridad: 1) niveles 6-8 y pasivos 1-5 con los 6 nuevos; 2) evoluciones de las 10 armas restantes; 3) fusiones normales y libro; 4) raras. Todo en JSON.

AJUSTE 2 (Dave): los slots por run pasan a 8 armas + 8 pasivos (antes 4+4). Cutcall agrega más armas y pasivos; esa tabla va a estar en v3_extra.md. Con 8 slots, mantener el máximo de 2 fusiones por run salvo que Cutcall lo cambie.
