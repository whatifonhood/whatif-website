---
title: Introducción
summary: Qué es $IF, en las menos palabras que aún son ciertas.
---

$IF es una meme coin en Robinhood Chain. No tiene producto, ni ingresos, ni tesorería, ni una hoja de ruta de funciones que te deba. Es un token, una broma que se fue de las manos y una pregunta impresa en el costado.

Esa pregunta es **¿y si?**.

## Qué es este libro blanco

La mayoría de los libros blancos existen para que un token suene como una empresa. Este existe para lo contrario: para dejar por escrito qué es $IF en realidad, qué no es, y cómo comprobar ambas cosas sin creerte nada de esta página.

Hay dieciséis secciones. Tres explican la moneda. Tres demuestran los números. Cuatro desarman la cadena, el lanzamiento, la liquidez y la quema. Tres tratan de comprarla y conservarla. Tres dicen en voz alta las partes incómodas.

Si solo lees una, lee [Verifícalo tú mismo](/es/docs/verify-it-yourself/). Todo lo demás en este libro blanco se desprende de ahí.

## Qué no es $IF

No es un producto de inversión. Nadie aquí tiene licencia para asesorarte, y nada en este libro blanco es asesoramiento. No es una participación en un negocio, porque no hay negocio. No te da derecho a ingresos, a gobernanza ni a reclamar nada.

Tampoco es un intento de parecerse a esas cosas. Esa distinción es todo el sentido del proyecto, y la razón por la que este libro blanco dedica más espacio a lo que falta que a lo que se promete.

## Los tres hechos que importan

Estas son las afirmaciones que sostienen todo el proyecto. Cada una se puede comprobar en la cadena en menos de un minuto, y [Verifícalo tú mismo](/es/docs/verify-it-yourself/) te da el comando exacto para cada una.

1. **El suministro está fijado en mil millones.** `totalSupply()` devuelve exactamente eso, y no hay función de mint.
2. **El contrato no tiene dueño.** `owner()` no revierte porque hayamos renunciado a la propiedad — revierte porque esa función nunca estuvo ahí. Nadie puede pausarlo, actualizarlo ni acuñar tokens en él.
3. **Se han quemado tokens, de forma permanente.** Están en una dirección cuya clave privada no existe y no se puede construir.

Todo lo demás en este sitio es o bien una de esas tres cosas dicha de otra forma, o una herramienta para mirarlas.

## Quién escribió esto

Las mismas personas que quitaron de la portada las insignias de "LP bloqueada" y "propiedad renunciada" por falta de pruebas, y las reemplazaron por un panel que lee la cadena en vivo y muestra lo que encuentre — incluso cuando no puede encontrar nada.

Ese es el estándar al que se somete el resto de este libro blanco.
