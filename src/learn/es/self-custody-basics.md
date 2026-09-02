---
title: Fundamentos de la autocustodia
summary: Qué es realmente una cartera, qué hace la frase de recuperación y los errores que no se pueden revertir.
category: safety
order: 2
updated: 2026-08-31
---

Una cartera de criptomonedas no guarda sus monedas. Las monedas son anotaciones en un registro contable público; la cartera guarda la clave que demuestra que esas anotaciones son suyas. Esa distinción explica casi todo lo demás sobre cómo se comportan las carteras.

## La frase de recuperación es la cartera

Al crear una cartera se le entregan doce o veinticuatro palabras. Esas palabras generan la clave. Cualquiera que tenga las palabras tiene la cartera: en cualquier dispositivo, en cualquier aplicación, para siempre. Perderlas significa perder el acceso de forma permanente, y no hay nadie a quien reclamar.

Por lo tanto:

- **Anótelas en papel.** Una captura de pantalla vive en una galería de fotos que se sincroniza con una cuenta en la nube protegida por una contraseña que alguien puede restablecer.
- **Nunca las escriba en un sitio web.** La aplicación de su cartera se las pedirá cuando restaure el acceso. Ninguna otra cosa se las pedirá nunca de forma legítima.
- **Guarde una segunda copia en otro lugar.** Los incendios y las inundaciones son más comunes que los hackeos.

## Caliente y fría

Una cartera caliente está conectada a internet: una extensión de navegador o una aplicación de teléfono. Es cómoda y es la que se usa para operar en el día a día. Una cartera fría es un dispositivo de hardware que firma transacciones sin exponer la clave.

La regla sensata es aburrida: mantenga en la cartera caliente lo que esté operando activamente, y en hardware todo aquello cuya pérdida le disgustaría.

## El gas, y por qué falla una transacción

Cada acción en una cadena cuesta una comisión, pagada en el token nativo de la cadena: en Robinhood Chain eso es ETH. Si su cartera tiene tokens pero no ETH, no puede moverlos, porque no puede pagar para moverlos.

Deje siempre una pequeña cantidad de ETH. Es la forma más común en que la gente se queda temporalmente atascada.

## Las aprobaciones se acumulan

Operar en un exchange descentralizado implica conceder a un contrato permiso para gastar un token en su nombre. Ese permiso persiste después de la operación. Con el tiempo, una cartera acumula una lista de aprobaciones, y cualquiera de esos contratos todavía puede actuar sobre ella.

Revisar y revocar aprobaciones antiguas de vez en cuando bien vale los diez minutos, sobre todo en una cartera que se ha usado en muchos sitios.

## Pruebe con una cantidad pequeña

Antes de enviar algo importante a una dirección nueva, una cadena nueva o un puente nuevo, envíe primero una cantidad pequeña y confirme que llega. Las transacciones son definitivas. No hay línea de soporte, ni reversión, ni contracargo.

## La contrapartida, dicha sin rodeos

La autocustodia significa que ninguna institución puede congelar sus fondos, y también significa que ninguna institución puede recuperarlos. Las dos mitades son reales. Quien le diga que la segunda mitad no es un costo serio está vendiéndole algo.
