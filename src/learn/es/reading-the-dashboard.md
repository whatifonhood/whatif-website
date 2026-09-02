---
title: Cómo leer el panel de datos
summary: Qué significa cada cifra de la página de datos, y cuáles importan de verdad.
category: basics
order: 5
updated: 2026-08-31
---

La [página de datos](/es/stats/) muestra una docena de números. No todos son igual de útiles. Esto es lo que es cada uno, y cuáles cambiarían una decisión.

## Precio y capitalización de mercado

El precio por sí solo no dice casi nada: un token con mil millones de suministro y otro con un millón no son comparables por precio. La capitalización de mercado es el precio por el suministro, y es la cifra que sirve para comparar entre tokens.

Tenga en cuenta que la capitalización de mercado cuenta todos los tokens que existen, incluidos los que nadie puede vender. Por eso importa la quema, más abajo.

## Liquidez

**El número menos leído de la página.** La liquidez es cuánto valor hay en el pool de negociación. Determina cuánto se puede vender realmente sin mover el precio en contra propia.

Una comprobación útil: si su posición es una fracción significativa del pool, no se puede salir al precio que se ve. El gráfico es una imagen de lo que hicieron las operaciones pequeñas, no una promesa sobre lo que haría una grande.

## Volumen, compras y ventas

El volumen de veinticuatro horas es cuánto cambió de manos. Los recuentos de compras y ventas que aparecen debajo, y el gráfico de presión por hora, indican de qué dirección vino la presión.

Trate los _recuentos_ de operaciones con desconfianza en una cadena barata: cuesta muy poco generar muchos. El volumen en dólares es más difícil de falsear de forma convincente.

## Quemado

Tokens enviados a `0x…dEaD`, una dirección sin clave privada. Nada puede moverlos nunca. Esto no es una promesa hecha en un documento; es un saldo en la cadena, y la [curva de quema](/es/stats/) traza cada una de esas transacciones con un enlace a ella.

El suministro quemado ha desaparecido de verdad, y por eso vale la pena separarlo de la cifra en circulación.

## Titulares y concentración

El recuento de titulares es el número más débil de esta página: una persona puede tener mil carteras, y en una cadena barata eso no cuesta casi nada.

**La concentración es el número que importa.** El desglose muestra qué parte del suministro está en las diez carteras más grandes, en las veinte siguientes y en el resto. Un token en el que los diez primeros tienen la mayor parte está a una decisión de distancia de un día muy malo, tenga el aspecto que tenga el gráfico.

## Mayor compra y mayor venta

La mayor operación individual en cada dirección del último día, con un enlace a la transacción. Útil por la misma razón que la barra de concentración: indica si el movimiento del día fue de una cartera o de muchas.

La ventana se indica de forma explícita, porque la cifra proviene de una consulta filtrada por tamaño y no de una ventana de tiempo fija, y el periodo que cubre varía según lo activo que estuviera el mercado. Cuando la página no puede afirmar honestamente que cubre un día completo, dice lo que realmente tiene.

## El panel de comprobaciones

Contrato verificado, comprobación de honeypot, suministro fijo, dirección de quema. Esto lo afirman terceros, no nosotros, y cada punto enlaza al lugar donde se puede volver a comprobar.

Notará que aquí no hay ninguna afirmación sobre liquidez bloqueada ni sobre un contrato renunciado. Esas afirmaciones se retiraron de este sitio porque no pudimos aportar pruebas de ellas, y no volverán sin enlaces a transacciones.
