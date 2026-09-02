---
title: Quién lo tiene
summary: Las wallets más grandes, nombradas cuando se las puede identificar.
---

"¿Hay una sola wallet que lo tenga todo?" es la primera pregunta seria que cualquiera debería hacerse sobre un token, y un porcentaje no es una respuesta. La [página de datos](/es/stats/) publica las quince posiciones más grandes, con cada fila enlazada a la dirección.

## Cómo leer la tabla con honestidad

Dos de las entradas más grandes no son lo que parecen a primera vista, y por eso mismo están etiquetadas:

**La dirección de quema suele ser el mayor titular.** Esos tokens están destruidos, no en manos de nadie. Contarlos como la posición de una ballena invierte el sentido: es la fila más tranquilizadora de la tabla, no la más alarmante.

**El pool de liquidez suele estar cerca del principio.** Un pool tiene los tokens contra los que opera. Si no tuviera nada, no podrías comprar. Es infraestructura, no una posición.

Quita esas dos y lo que queda es la concentración real de titulares. En la última lectura, la mayor wallet individual genuina tenía alrededor del 3% del suministro.

## Lo que podemos y lo que no podemos decirte

Podemos decirte las direcciones, los saldos y cuáles son contratos. Todo eso está en la cadena. Una advertencia sobre esto último: varios de los mayores titulares figuran como contratos en un explorador, pero son wallets corrientes que usan la delegación descrita en [La cadena en la que funciona](/es/docs/the-chain/). Son personas, y una cifra de concentración que las clasifica como contratos está equivocada en la dirección favorable.

No podemos decirte quiénes son las personas detrás de esas direcciones. Nadie puede, sin su cooperación. Cualquier proyecto que afirme conocer la identidad de sus titulares o está haciendo KYC o está adivinando.

Tampoco podemos prometer que la distribución siga así. Un titular grande puede vender en cualquier momento, y ningún mecanismo del contrato lo impide. Ver [Riesgos](/es/docs/risks/).

## De dónde salen los datos

La lista de titulares se lee del explorador de bloques en el momento de la compilación y se guarda en este repositorio, actualizada a diario.

Se hace en la compilación por una razón concreta: el explorador está detrás de un desafío antibots y no envía cabecera CORS, así que un navegador no puede llamarlo. En lugar de fingir lo contrario o de enrutarlo por un servidor que no tenemos, la lista se obtiene una vez durante la compilación y la página indica la fecha en que se leyó.

Las direcciones que no se pueden identificar se muestran sin etiqueta, en lugar de con una adivinada.
