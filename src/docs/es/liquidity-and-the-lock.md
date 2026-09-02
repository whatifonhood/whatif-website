---
title: La liquidez, y qué está realmente bloqueado
summary: Una posición del pool principal no la puede retirar nadie; la otra mitad de la profundidad puede irse en un bloque.
---

$IF cotiza en un pool de Uniswap V3 que creó el launchpad en la misma transacción que creó el token. Una posición de ese pool está bloqueada de una forma que nadie puede deshacer. El resto de la profundidad no lo está. Esta página separa las dos cosas, porque esa diferencia es todo lo que suele estar haciendo la frase "liquidez bloqueada" cuando alguien la dice.

Todas las cifras de abajo se leyeron de la cadena el 2 September 2026, alrededor del bloque `52,582,784`. Los saldos de los pools se mueven. El bloqueo no.

## La posición de lanzamiento

El pool principal es `0x39A200271525E9641e799127bdAB299DAeF21953`, IF contra WETH, en el nivel de comisión del 1%.

En el lanzamiento, todo el suministro entró en ese pool como una sola posición de Uniswap V3 que abarca los ticks `[-887200, 204200]`, que es casi exactamente el rango completo que permite el protocolo. El NFT de la posición, el número `70641`, se transfirió al contrato `LaunchLocker` de NOXA en la misma transacción que lo acuñó, que [El lanzamiento](/es/docs/the-launch/) lee log por log.

Ese contrato ahora tiene el NFT, y su ABI publicada no tiene forma de soltarlo. Ni transfer. Ni approve. Ni `decreaseLiquidity`. Ni burn. Lo único que se puede llamar contra la posición es `collectFees`, que barre las comisiones de trading acumuladas y deja el principal exactamente donde está. [Cómo funciona la quema](/es/docs/how-the-burn-works/) sigue esas comisiones hasta donde acaban.

Así que esta mitad merece decirse con toda su fuerza: **la posición de lanzamiento está bloqueada de forma permanente, y eso incluye estar bloqueada frente a NOXA.** No es un bloqueo por tiempo, ni un vesting, ni un compromiso que alguien asumió. No hay función que llamar.

Dos cosas lo matizan, y ambas tienen que ver con quien publicó el código, no con el bloqueo. El código fuente verificado del locker en el explorador es una coincidencia parcial y no completa, así que lo que se está leyendo es código que coincide con el bytecode desplegado en las partes que el explorador pudo hacer coincidir. Y el dueño del locker, una wallet corriente, todavía puede redirigir a dónde van las comisiones recaudadas. No puede mover, reducir ni deshacer la posición en sí.

## Lo que el bloqueo no cubre

Aquí viene la corrección, y importa más que la buena noticia de arriba.

En la instantánea, la liquidez activa del pool principal era `71,612,362,060,397,110,157,213`, de la cual la posición `70641` aportaba `36,819,258,015,569,838,458,222`. La liquidez activa es la unidad propia de Uniswap para medir cuánta profundidad hay disponible al precio actual. No es una cifra en dólares, y la proporción es la parte que vale la pena retener:

- **51.4%** de la liquidez activa del pool principal es la posición de lanzamiento bloqueada de forma permanente.
- **48.6%** son posiciones corrientes de Uniswap, propiedad de wallets corrientes.

En palabras simples: aproximadamente la mitad de la profundidad contra la que operas la pusieron ahí personas que pueden retirarla en un solo bloque, sin avisar y sin pedir permiso. Nunca se comprometieron a no hacerlo. Si la retiraran, el impacto en el precio de tu venta empeoraría de inmediato, y la mitad bloqueada sería lo que quedaría sosteniendo el mercado.

Eso es normal. Un token que solo cotiza en DEX atrae a proveedores de liquidez externos, y los proveedores de liquidez externos se van cuando las comisiones dejan de compensar. Pero no es lo que un lector minorista entiende al oír "la liquidez está bloqueada", y por eso este sitio no usa esas palabras. La formulación aquí es **"la posición de lanzamiento está bloqueada de forma permanente"**, y está elegida para ser exactamente tan estrecha como la evidencia.

## Los siete pools

$IF tiene liquidez en siete pools activos, que suman unos $446,000 entre todos. Alrededor del 85% está en el pool principal.

| Pool               | Liquidez | Volumen 24h | Creado      |
| ------------------ | -------- | ----------- | ----------- |
| Uniswap V3 IF/WETH | $378,958 | $387,004    | 11 Jul 2026 |
| Uniswap V3 IF/USDG | $56,782  | $201,745    | 6 Aug 2026  |
| Uniswap V4 IF/ETH  | $6,811   | $21,545     | 31 Aug 2026 |
| Uniswap V4 IF/USDG | $3,433   | $481        | 23 Jul 2026 |
| Giga IF/USDG       | $231     | $956        | 28 Aug 2026 |
| Uniswap V4 IF/ETH  | $56      | $42         | 28 Aug 2026 |
| Uniswap V4 IF/ETH  | $8       | $4          | 27 Aug 2026 |

La segunda fila es la interesante. El pool IF/USDG en Uniswap V3 lo creó el 6 August alguien ajeno al launchpad, y ahora concentra alrededor de un tercio de todo el volumen de $IF, contra la stablecoin en dólares propia de Robinhood Chain. Nada de eso está bloqueado. Es liquidez de la comunidad en sentido literal: una persona eligió ponerla ahí y puede elegir sacarla.

El bloqueo cubre una posición en un pool. No tiene nada que ver con los otros seis.

## La retención de comisión del protocolo

Un detalle del pool principal que es fácil pasar por alto y fácil de comprobar. La comisión de protocolo de Uniswap está activada ahí. `slot0.feeProtocol` devuelve `102`, lo que significa que un sexto de la comisión de swap del 1% se retiene en ambos lados de cada operación antes de que los proveedores de liquidez vean nada de ella, y se acumula para el dueño de la fábrica V3 en lugar de para las posiciones.

En la instantánea, ese saldo contenía `0.0028` WETH y `2,314` IF.

Esas cantidades son triviales hoy, y la razón para mencionarlas no es el tamaño. Es que el lado IF de esa retención son ingresos por comisiones que la posición bloqueada nunca gana, y por tanto nunca quema. La quema se alimenta de lo que llega a la posición después de que el protocolo se lleve su sexto.

## Qué hacer con esto

Compruébalo tú mismo en lugar de creerte el párrafo de arriba. El ID de la posición, la dirección del pool y el rango de ticks están todos en esta página, y cada uno de ellos se resuelve en el explorador de bloques.

Luego lee [Riesgos](/es/docs/risks/), que expone la consecuencia del lado vendedor sin suavizarla: aproximadamente la mitad de la profundidad negociable puede irse en cualquier momento, y los mercados poco profundos se mueven con fuerza en ambas direcciones.
