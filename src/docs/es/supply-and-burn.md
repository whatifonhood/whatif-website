---
title: El suministro y la quema
summary: Mil millones, fijo, con una cantidad medible destruida de forma permanente.
---

Dos números describen toda la política monetaria de $IF, y ambos se leen de la cadena en lugar de afirmarse aquí.

## Suministro total

**1,000,000,000 $IF**, y no puede subir.

El contrato expone `totalSupply()`, que devuelve `0x033b2e3c9fd0803ce8000000` — mil millones con dieciocho decimales. No hay función de mint, así que esto no es una política que alguien esté eligiendo cumplir. Es una propiedad del código.

## Qué se ha quemado

Quemar un token significa enviarlo a una dirección desde la que nadie puede gastar. La convención es `0x000000000000000000000000000000000000dEaD` — una dirección elegida porque es un destino válido cuya clave privada no se puede derivar. Los tokens enviados ahí no están "bloqueados" ni "guardados en reserva". Son inalcanzables, de forma permanente, para todo el mundo, nosotros incluidos.

El saldo quemado actual se lee en vivo en la [página de datos](/es/stats/), y cada quema individual aparece listada con un enlace a la transacción que la produjo. En una instantánea tomada el 2 de septiembre de 2026 era de 93,449,236.90 $IF, es decir el 9.3449% del suministro. De las 425 transferencias que componen ese total, dos vinieron de wallets corrientes y suman 2.84 $IF entre las dos. Las otras 423 vinieron de un único contrato de comisiones, que es el mecanismo descrito más abajo.

De ahí se siguen dos cosas, y vale la pena ser preciso sobre cuál es cuál:

- **El suministro circulante es realmente menor.** Esa parte es aritmética.
- **Un suministro menor no hace que un token valga más.** Esa parte no es aritmética, y quien te diga lo contrario te está vendiendo algo. La quema cambia el denominador, no la demanda.

## Por qué el historial de quemas se reconstruye desde los eventos

La forma obvia de mostrar un historial de quemas es preguntarle a la cadena "cómo se veía este saldo el mes pasado". Los nodos públicos no responden a eso — no son nodos de archivo, y una petición de estado histórico no devuelve nada en lugar de devolver un error.

Así que el historial se construye al revés: cada `Transfer` hacia la dirección de quema se lee de los propios logs de la cadena, una vez, y se guarda en este repositorio. Después el sitio lo completa con todo lo que haya ocurrido desde entonces. Eso significa que la curva de quema se reconstruye a partir de evidencia primaria, y cada punto de ella enlaza a la transacción de la que salió.

## Qué alimenta la quema, y qué no significa

Una versión anterior de esta página decía que no había quema automática en cada operación, ni comisión que la alimentara, ni calendario. La cláusula del medio estaba equivocada, y corregirla importa más que cualquier otra cosa en esta página.

Hay una comisión que la alimenta. $IF se opera en un pool de Uniswap V3 con una comisión del 1%, y la posición de liquidez del lanzamiento gana una parte de esa comisión en cada swap que pasa por el pool. Esa posición está bloqueada de forma permanente, así que su principal no lo puede retirar nadie, nosotros incluidos. No es la única liquidez del pool; [La liquidez y el bloqueo](/es/docs/liquidity-and-the-lock/) cubre el resto, y la distinción importa.

Un keeper operado por el launchpad que creó el token barre la comisión acumulada de esa posición. Ha habido 423 barridos, el primero el 11 de julio de 2026 y el más reciente el 1 de septiembre de 2026. En los primeros diez, el launchpad quemó el 80% del $IF que recogió y se quedó con el resto. En los 413 desde el 12 de julio de 2026 ha quemado el lado $IF por completo. [Cómo funciona la quema](/es/docs/how-the-burn-works/) expone las direcciones, el reparto y a dónde va el lado ETH de la comisión.

Así que la quema es mecánica y depende del volumen, y decir que no era nada estaba mal. Lo que sigue siendo cierto es más estrecho. No está en el contrato del token, así que nada en la cadena la obliga. No es por operación: las comisiones se acumulan en la posición y se barren por lotes. No es un calendario, y no está en nuestras manos ejecutarla. Si ese keeper se apaga, las comisiones simplemente se acumulan sin barrer y la quema se detiene, sin aviso y sin recurso.

El volumen también fija el tamaño, y el volumen ha caído mucho desde la semana del lanzamiento. Alrededor de la instantánea del 2 de septiembre de 2026, el suministro se encogía en torno a un 0.014% al día. Ese es un mecanismo real que produce un número pequeño, y no es una razón para esperar un precio.
