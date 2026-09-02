---
title: Lo que no afirmamos
summary: Las frases que esperarías encontrar aquí, y por qué falta cada una.
---

La mayor parte de este libro blanco trata de lo que $IF es. Esta página es el espacio negativo, porque en este mercado las afirmaciones que un proyecto se niega a hacer dicen más que las que hace.

Cada punto de abajo es algo que podríamos escribir, que ayudaría a la moneda, y que no estamos escribiendo — porque no podemos evidenciarlo, o porque la cadena dice que no es cierto.

## "La liquidez está bloqueada"

Ausente como afirmación rotunda, y sustituida por la versión más estrecha que podemos probar.

Lo que este libro blanco sí afirma: la posición del lanzamiento está bloqueada de forma permanente. Es el NFT de posición de Uniswap V3 `70641`, lo tiene el `LaunchLocker` de NOXA, y la interfaz publicada del locker no tiene método de transferencia, ni de aprobación, ni de reducción de liquidez, ni de quema. No hay ninguna función que alguien pueda llamar para sacar ese principal — ni nosotros, ni NOXA, ni la dirección que es dueña del locker.

Lo que este libro blanco sigue negándose a afirmar es la versión de tres palabras. En la última instantánea esa posición aportaba el 51.4% de la liquidez activa del pool principal. El otro 48.6%, más todo lo que hay en los seis pools más pequeños, es LP corriente que sus dueños pueden retirar en un solo bloque.

Así que aproximadamente la mitad de la profundidad contra la que operas puede irse sin aviso. "La liquidez está bloqueada" te dejaría suponer lo contrario, y esa suposición sería obra nuestra y no del mercado. [La liquidez y el bloqueo](/es/docs/liquidity-and-the-lock/) tiene la posición, los pools y el reparto.

## "Propiedad renunciada"

Ausente, y sustituida por algo mejor.

Renunciar implica que hubo un dueño que cedió el control — y tendrías que confiar en que eso ocurrió correctamente. En este contrato, `owner()` revierte porque **la función nunca estuvo ahí**. Nadie puede pausarlo, actualizarlo ni emitir sobre él, y puedes confirmarlo tú mismo en unos diez segundos.

Quitamos la insignia de renuncia y pusimos la lectura en vivo en su lugar.

## "Auditado"

Ausente. No se ha encargado ninguna auditoría de seguridad de terceros.

El contrato es un token estándar, su código fuente en el explorador es una coincidencia parcial, y puedes leerlo entero. No todo lo que lo rodea se puede leer siquiera: el contrato de comisiones del launchpad, que ha ejecutado todas las quemas, es bytecode no verificado cuyo código fuente nunca se ha publicado. Ninguna de esas dos cosas es una auditoría, y ninguna se presenta como tal.

## "Sin wallet de dev, sin insiders"

Ausente como descripción del lanzamiento, valga lo que valga como descripción del proyecto hoy.

La frase exacta es más larga, y preferimos escribir la larga. El lanzador se llevó una compra del 11.04% en la misma transacción que creó el token, exento del límite por wallet por el propio contrato, lo vendió todo en menos de 60 segundos con una ganancia neta de unos 0.269 ETH, no ha tenido nada desde entonces, y el launchpad le ha pagado unos 18.23 WETH en comisiones de creador. Las personas que llevan el proyecto ahora dicen que llegaron después de que el desarrollador original se hubiera ido. Nada en la cadena contradice eso, y nada en la cadena lo establece tampoco: las direcciones no son identidades, y no se ha intentado agruparlas. No se ofrece aquí como defensa de la frase anterior.

[El lanzamiento](/es/docs/the-launch/) lo expone log por log, incluida la exención en el contrato.

## "La quema es impulsada por la comunidad"

Ausente, porque es falso. Todas las quemas hasta ahora las ha ejecutado el contrato de comisiones de NOXA, que barre la comisión de trading de la posición bloqueada y quema el lado $IF de ella — todo él, desde el 12 July 2026. Ha funcionado 423 veces. Esta comunidad no ha quemado nada.

Decirlo no es modestia. Es la diferencia entre una historia que puedes comprobar y una que no, y también es el riesgo: la quema pertenece al keeper de otra gente y se detiene el día que ese keeper se detenga. [Cómo funciona la quema](/es/docs/how-the-burn-works/) explica el mecanismo y qué aspecto tendría su final.

## Objetivos de precio, previsiones, "el próximo 100x"

Ausentes, de forma permanente. Nadie lo sabe, y cualquiera que te diga que sí está vendiendo.

## Una hoja de ruta de utilidad

Ausente. No hay ningún producto en camino que haga que el token sea necesario para algo.

La [hoja de ruta](/es/roadmap/) lista cosas construidas para el sitio — herramientas, páginas, traducciones. Todo lo que hay en ella y ya se ha entregado se queda en ella, así que el registro de lo que se prometió frente a lo que llegó es permanente y comprobable.

## Alianzas, listados, respaldos

Ausentes salvo que sean verificables de forma independiente en el momento de escribir esto. Ninguna asociación implícita con Robinhood más allá de funcionar en Robinhood Chain, que es una red pública en la que cualquiera puede desplegar.

## Una tesorería, una asignación al equipo, un calendario de vesting

Ausentes, porque no existe tal estructura que describir. La [tabla de titulares](/es/stats/) muestra la distribución real, incluidas las wallets que no podemos identificar.

## Por qué molestarse

Porque lo único que puede ofrecer una moneda sin producto es que nunca te mintió. Eso solo vale algo si se sostiene cuando mentir sería útil — que es precisamente aquí, en la página donde irían las afirmaciones.
