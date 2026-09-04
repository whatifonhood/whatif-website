---
title: El lanzamiento, y el lanzador
summary: Una transacción creó el token, el pool, el bloqueo y una compra del 11% para quien la envió.
---

$IF empezó como una sola transacción el 11 de julio de 2026. Esa transacción acuñó el suministro, creó el pool, bloqueó la posición de liquidez del lanzamiento y entregó a la dirección que la envió algo más del 11% de los tokens, todo de forma atómica. Esta página la relee en orden, porque es la parte del registro que un escéptico debería comprobar primero, y porque parte de lo que muestra no es favorecedor.

## Nadie escribió un contrato para What $IF

$IF no es código hecho a medida. Es el `LaunchToken` estándar de NOXA: un ERC-20 de OpenZeppelin con un pequeño bloque de restricciones de lanzamiento atornillado a `_update`. El mismo bytecode respalda decenas de miles de tokens en esta cadena. Una fábrica lo produjo en serie.

Eso corta por los dos lados, y las dos mitades merecen decirse. No hubo equipo de desarrollo, y no hay nada hecho a medida ni ingenioso en el token. Es también la razón por la que el contrato es tan limpio como es. `LaunchToken` no tiene dueño, ni roles, ni proxy ni vía de actualización, ni mint fuera del constructor, ni función de quema, ni lógica de impuestos alguna. Nadie escondió nada dentro porque nadie lo estaba escribiendo.

El código fuente en `0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1` es una **coincidencia parcial**, verificada el 14 de julio de 2026 a través de eth-bytecode-db y no de Sourcify. La fábrica que lo desplegó no está verificada en absoluto. NOXA nunca publicó esa build. Eso es un hecho sobre NOXA y no sobre $IF, y hay que decirlo así en lugar de pasarlo por alto.

## Una transacción, dieciocho logs

`0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c`

11 de julio de 2026, 04:32:42 UTC, bloque L2 `6,657,668`, 6,994,056 de gas. Quien la envió mandó 0.1705 ETH a la fábrica de NOXA y recibió de vuelta un token, un pool, una posición de LP bloqueada y el 11% del suministro en un solo paso atómico.

Lo que ocurrió dentro, en orden:

1. Se acuñaron los 1,000,000,000 IF completos a favor de la fábrica.
2. Se creó un pool IF/WETH en el nivel de comisión del 1%, en `0x39A200271525E9641e799127bdAB299DAeF21953`.
3. El pool se inicializó en el tick `204200` — el extremo más alto del rango, así que abrió con el 100% en IF y nada de WETH.
4. Todo el suministro se transfirió al pool como liquidez de un solo lado, sobre los ticks `[-887200, 204200]`.
5. Se emitió el NFT de posición `70641` por esa liquidez.
6. El NFT `70641` se transfirió al `LaunchLocker` de NOXA, que emitió `PositionLocked`.
7. `110,436,131.713888332` IF, el 11.044% del suministro, se transfirieron del pool al deployer.
8. Se envolvieron 0.17 ETH y se intercambiaron a través de `SwapRouter02` — la compra inicial atómica.

### Por qué 0.17 ETH compraron el 11% del suministro

Porque el pool se inicializó en el extremo más alto del rango de la posición. En Uniswap V3 eso significa todo token, nada de ETH, y un precio de apertura cercano a cero. El primer comprador recorre una curva casi vertical, así que una cantidad pequeña de ETH se lleva una porción grande del suministro.

Esta es la mecánica prevista del diseño de lanzamiento de NOXA, no un exploit. También es cierto que el precio de entrada del lanzador era estructuralmente inalcanzable para cualquiera que llegara un bloque más tarde. Las dos cosas se dan a la vez, y no deberías aceptar una versión de esta página que solo te cuente una de ellas.

## Las restricciones de lanzamiento, con precisión

El constructor fijó tres límites, y ninguno sigue vigente hoy.

- **Wallet máxima del 2%.** `maxWalletBps` era 200, es decir 20,000,000 IF, y se aplicaba a todos salvo a la fábrica, al deployer y al pool.
- **Límite por transacción: ninguno en la práctica.** `maxTxBps` estaba fijado en 10000, que es el 100% del suministro. Las compras se contabilizaban por `tx.origin` contra el 110% de eso, un techo de 1.1 mil millones de tokens. No podía activarse.
- **El bloque de lanzamiento estaba cerrado.** En el propio bloque de lanzamiento, cualquier compra desde el pool revertía, salvo para la fábrica de lanzamiento y el deployer.

`restrictionBlocks` era 366, y esos son bloques de L1 de unos doce segundos, no los bloques de L2 de 101 ms de la cadena. Todo ello expiró de forma permanente alrededor de las 05:45 UTC del 11 de julio de 2026. Hoy no queda ningún privilegio residual en el token, para nadie.

## Qué fue de los 110.44M

El deployer en `0x84F8E5a324466Deb7447048C014CF0245ce04afA` recibió `110,436,131.71` IF a las 04:32:42 y vendió hasta el último token en unos sesenta segundos, en cinco transacciones, todas por el mismo router, todas de vuelta al pool del que los tokens acababan de salir.

| Venta     | IF vendidos        | Cuota    | WETH recibidos |
| --------- | ------------------ | -------- | -------------- |
| 1         | 55,218,065.86      | 50.0%    | 0.233739       |
| 2         | 13,804,516.46      | 12.5%    | 0.049099       |
| 3         | 10,353,387.35      | 9.4%     | 0.040792       |
| 4         | 15,530,081.02      | 14.1%    | 0.059348       |
| 5         | 15,530,081.02      | 14.1%    | 0.056404       |
| **Total** | **110,436,131.71** | **100%** | **0.439381**   |

El coste fue de 0.17 ETH más una comisión de lanzamiento de 0.0005 ETH. Lo obtenido fueron 0.439381 WETH. En neto, el snipe dejó unos 0.269 ETH — unos $640 al precio del ETH del día en que se leyeron estas cifras, 2 de septiembre de 2026.

Esa cifra es más pequeña de lo que sugiere la forma de la historia, y es la exacta. El deployer recompró 674 IF en algún momento posterior y los movió a otra parte. Desde entonces el saldo es cero. Esta dirección ha lanzado exactamente un token en la fábrica de NOXA, en toda su historia.

## La cifra más grande

El titular honesto no es el snipe. Es el flujo de comisiones.

El contrato de comisiones de NOXA ha pagado a `0x84F8E5a324466Deb7447048C014CF0245ce04afA` **18.2300 WETH** en ganancias de creador sobre las comisiones de trading de $IF, unos $43,500 en esa misma lectura del 2 de septiembre. Eso es lo que el lanzador original ha sacado de este proyecto, y llegó por las cañerías del launchpad y no por el token. [Cómo funciona la quema](/es/docs/how-the-burn-works/) describe ese mismo flujo de comisiones, porque la parte en IF es la que se quema.

## Qué frases no sobreviven a esto

Se dicen cuatro cosas sobre lanzamientos de $IF como este, y ninguna es defendible aquí.

- "Sin insiders."
- "El deployer nunca tuvo tokens."
- "Todos tuvieron el mismo acceso al lanzamiento."
- "Sin wallet de dev."

La versión exacta cabe en una frase: el lanzador se llevó una compra atómica del 11.04% que el contrato eximía explícitamente del límite por wallet, la vendió entera en menos de un minuto con una ganancia de unos 0.27 ETH, desde entonces no ha tenido nada, y ha cobrado unos 18.2 WETH en comisiones de creador del launchpad.

Todo eso es cierto del lanzamiento. El sitio, las herramientas y las redes se construyeron después, por personas que dicen haber aparecido una vez que el desarrollador original ya se había ido. Eso es una afirmación sobre quién es quién, y la cadena no la resuelve. Lo que la cadena sí dice es más estrecho: este deployer no tiene nada, y nunca ha lanzado otro token. Un saldo en cero no descarta wallets relacionadas, y nadie ha intentado agruparlas. Da por sentado el lanzamiento, y por no demostrada la separación. [Lo que no afirmamos](/es/docs/what-we-do-not-claim/) es donde vive el resto de las frases que faltan.
