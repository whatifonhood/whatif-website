---
title: Riesgos
summary: Las formas en que aquí pierdes dinero, dichas sin rodeos en lugar de enterradas.
---

Esta página no es un descargo de responsabilidad puesto para cubrirnos. Si lees una sola página antes de comprar, lee esta.

**Puedes perder todo lo que pongas.** Compromete solo dinero cuya pérdida total no cambiaría nada importante de tu vida.

## El precio puede irse a cero

El precio de una meme coin se sostiene por completo en que otras personas la sigan queriendo. No hay ingresos debajo, ni un activo que la respalde, ni un suelo.

La mayoría de los tokens de esta categoría acaban sin valor en la práctica. No es un derrumbe dramático — la atención se va a otra parte, el volumen se seca, y lo que queda es un gráfico que nadie mira. Ese es el desenlace corriente, no el raro.

## El sesgo de supervivencia está actuando sobre ti

Conoces las monedas que se multiplicaron por cien. Nunca has oído hablar de las miles que no lo hicieron, porque nadie escribió un hilo sobre esas.

Eso distorsiona enormemente las probabilidades percibidas. Toda historia que te llega ya viene filtrada por el éxito, por el hecho mismo de que valía la pena contarla.

Toda la premisa de esta moneda — _y si hubieras comprado antes_ — funciona con exactamente esa distorsión. Nos parece más honesto nombrarla que explotarla en silencio, pero nombrarla no la apaga.

## La liquidez es escasa

Los mercados pequeños se mueven con fuerza en ambas direcciones. Una compra que en otro sitio pasaría desapercibida puede mover este precio de forma notable, y una venta también.

En la práctica: puede que no puedas salir al precio que ves. El deslizamiento es la parte visible de eso; la parte invisible es que una venta lo bastante grande puede no encontrar compradores en absoluto.

## Concentración

Un puñado de wallets tiene una parte significativa, como muestra en detalle [Quién lo tiene](/es/docs/who-holds-it/). Cualquiera de ellas puede vender en cualquier momento, sin aviso, y nada en el contrato lo impide.

La distribución es razonable para los estándares de este mercado. Eso no es lo mismo que segura.

## Solo alrededor de la mitad de la liquidez está bloqueada

Esta página decía antes que no podíamos mostrarte quién controla la posición de liquidez. Ahora sí podemos, así que aquí está.

La posición de lanzamiento, el NFT de posición `70641` de Uniswap V3, la tiene el contrato locker del launchpad. Ese contrato no tiene ningún método para transferirla, aprobarla, reducir su liquidez ni quemarla. El principal no lo puede retirar nadie, incluido el launchpad que lo puso ahí. [La liquidez y el bloqueo](/es/docs/liquidity-and-the-lock/) muestra cómo leer eso por ti mismo.

El riesgo no desapareció. Se movió. En la última instantánea, la posición bloqueada aportaba el 51.4% de la liquidez activa del pool principal. El otro 48.6% son posiciones corrientes en manos de gente corriente, igual que toda la liquidez de los seis pools más pequeños. Alrededor de la mitad de la profundidad contra la que venderías se puede retirar en un solo bloque, por gente que no tiene ninguna obligación de dejarla ahí, sin aviso.

Eso es normal para un token que solo se opera en un DEX. También es distinto de lo que "liquidez bloqueada" le sugiere a quien lee deprisa, y por eso este libro blanco no usa esa frase por sí sola.

## La quema depende de un keeper que puede detenerse

Nada en el contrato de $IF quema nada. La quema son ingresos por comisiones: las comisiones de trading se acumulan en la posición de lanzamiento bloqueada, el recolector del launchpad las barre, y el lado $IF del barrido se envía a la dirección muerta. [Cómo funciona la quema](/es/docs/how-the-burn-works/) expone el camino entero.

Cada paso de eso, salvo la acumulación de comisiones, necesita que alguien llame a una función. Si el keeper del launchpad deja de llamarla, las comisiones se acumulan en la posición y se quedan ahí, sin quemar y sin reclamar, indefinidamente. Nada en la cadena obliga a esa llamada, y nadie te debe un anuncio antes de que se detenga.

Conviene saber esto en ese contexto: el launchpad dejó de aceptar nuevos lanzamientos el mismo día en que se lanzó $IF, y su sitio web se apagó dos días después. Los barridos han continuado de todos modos, el más reciente el 1 September 2026. Continuar no es lo mismo que estar obligado a continuar.

## Las comisiones se pueden apuntar a otra parte

El dueño del locker es una única wallet corriente. No puede tocar la posición bloqueada, pero sí puede cambiar el reparto de comisiones y el destinatario de las comisiones, y entre esos dos ajustes pueden enviar el 100% de las comisiones futuras a cualquier dirección que elija.

Son dos llamadas a funciones. Sin votación, sin aviso, sin apelación. La quema se alimenta de ese flujo, así que redirigir el flujo termina la quema, y te enterarías después, mirando la cadena.

## Hay partes de la maquinaria que no se pueden leer

El código fuente del token $IF está publicado en el explorador como coincidencia parcial y no como coincidencia exacta, y el del locker también. El contrato de comisiones del launchpad es bytecode sin verificar. Su fábrica no está verificada en absoluto.

Ese es un hecho sobre el launchpad y no sobre $IF, y así debe leerse: nadie publicó esas builds. La consecuencia para ti es la misma en cualquier caso. Parte de aquello sobre lo que corre la quema solo se puede comprobar mirando lo que hace, no leyendo lo que dice.

## Nadie sabe quién está detrás del launchpad

Ninguna fuente que hayamos revisado establece quiénes son. El dueño del locker es una dirección a secas. El contrato de comisiones es bytecode sin verificar desplegado por esa misma dirección. Todo aquello de lo que depende la quema pasa por personas a las que nadie puede poner nombre.

Al decirlo no estamos alegando nada. Estamos diciendo que si la quema se detiene o las comisiones se mueven, no hay a quién preguntar ni nadie que responda. Decide lo que la quema vale para ti con eso a la vista.

## Riesgo regulatorio y de plataforma

Las normas sobre tokens varían según el país y cambian. Los exchanges deslistan. Las wallets y los exploradores dejan de dar soporte a cadenas. Cualquiera de esas cosas puede afectar a tu capacidad de operar o incluso de ver lo que tienes, con independencia del token en sí.

## Tus propios errores

La forma más común en que la gente pierde dinero aquí no es un movimiento del mercado. Es comprar el contrato equivocado, perder una frase de recuperación, o firmar algo que no leyó. [Wallets y custodia](/es/docs/wallets-and-custody/) cubre cada una.

Ninguna de esas cosas es reversible. No hay servicio de atención ni contracargo.

## Nada de lo que hay aquí es asesoramiento

Nadie de los implicados tiene licencia para asesorarte, y este libro blanco no es una recomendación para comprar, conservar ni vender nada. Es una descripción de lo que esta cosa es.
