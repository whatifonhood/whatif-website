---
title: La cadena en la que funciona
summary: Qué es Robinhood Chain, para qué se construyó y dos rarezas que hacen que los propios números de $IF parezcan equivocados hasta que las conoces.
---

$IF no eligió su cadena en ningún sentido significativo. Lo estampó un launchpad, en la red en la que ese launchpad resultaba funcionar. Pero la cadena decide qué puedes comprobar, qué herramientas te mostrarán tu saldo y cómo hay que leer dos de los números de este libro blanco. Así que vale la pena describirla con precisión.

## Qué es Robinhood Chain

Robinhood Chain es una layer 2 de Ethereum, construida por Robinhood con Offchain Labs sobre la pila de Arbitrum, que liquida en Ethereum. La red principal pública se abrió el 1 July 2026, anunciada en la conferencia "The World is Flat" de Robinhood en Londres, tras una testnet que había procesado más de 200 millones de transacciones.

Funciona bajo la licencia del Arbitrum Expansion Program, que destina el 10% de los ingresos netos del protocolo a Arbitrum: 8% a la ArbitrumDAO y 2% al Developer Guild.

Funcionar en una cadena que construyó Robinhood no es una relación con Robinhood. Es una red pública. Cualquiera puede desplegar en ella, y un launchpad lo hizo.

## Los datos que necesitarías para conectarte a ella

| Campo            | Valor                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| Chain ID         | `4663` (`0x1237`)                                                      |
| Token de gas     | ETH, comisión base `0.366` gwei en la instantánea del 2 September 2026 |
| Tiempo de bloque | `101.3` ms medidos, sobre `100,000` bloques en `10,134` segundos       |
| RPC              | `https://rpc.mainnet.chain.robinhood.com`                              |
| Explorador       | `https://robinhoodchain.blockscout.com`                                |

El tiempo de bloque es lo que conviene retener. Los bloques llegan unas diez veces por segundo, y eso es lo que hace que la primera rareza de más abajo sea confusa en lugar de evidente.

## Para qué se construyó la cadena, y qué apareció

El planteamiento de diseño eran activos del mundo real tokenizados: Stock Tokens reestructurados como títulos de deuda tokenizados, un AMM propio de Uniswap, Morpho para préstamos y USDG emitido por Paxos como la pata en dólares.

Lo primero que llegó fueron las memecoins. CoinDesk midió la diferencia en julio, cuando los activos del mundo real tokenizados en la cadena valían unos $12.66M y solo la memecoin CASHCAT había alcanzado un máximo de aproximadamente doce veces esa cifra.

$IF está en el lado memecoin de esa diferencia. Este libro blanco no va a describirlo como infraestructura.

## Dos rarezas que conviene conocer antes de comprobar nada

Las dos hacen que unos datos honestos parezcan un error. Si vas tú mismo a la cadena y encuentras un número que parece equivocado, probablemente sea una de estas dos.

### `block.number` devuelve una altura de Ethereum

Dentro de un contrato en esta cadena, `block.number` devuelve una altura de bloque de L1 de Ethereum, no la altura de L2.

El token $IF registra un bloque de lanzamiento de `25,507,001`. La transacción que lo lanzó estaba en realidad en el bloque de L2 `6,657,668`. Ninguna de las dos cifras es un error. Están contando cadenas distintas.

La consecuencia es que cualquier ventana que el token exprese "en bloques" está en bloques de L1 de unos doce segundos, no en bloques de L2 de una décima de segundo. La restricción de lanzamiento del token se fijó en `366` bloques, que son unos 73 minutos. Leída como bloques de L2 sería cuestión de segundos, y concluirías que la restricción apenas había existido. Sí existió, y [El lanzamiento](/es/docs/the-launch/) expone con precisión qué restringió mientras estuvo activa.

### Varios de los mayores titulares son wallets, no contratos

Algunos de los mayores titulares de $IF figuran como "contratos" en el explorador. Son personas. Son wallets con delegación EIP-7702, que son cuentas corrientes que se han apuntado a código de smart wallet: `SemiModularAccount7702` de Alchemy, `CaliburEntry` de Uniswap, `CoinbaseSmartWallet`.

Esto importa para una cosa concreta. El análisis de concentración debería contarlas como personas, porque es lo que son. Tratarlas como contratos del protocolo o como una especie de tesorería tergiversaría la distribución en la dirección de hacer que parezca mejor organizada de lo que está. La [tabla de titulares](/es/stats/) enlaza cada fila con su dirección, así que puedes abrir una y ver qué es en lugar de fiarte de la palabra que tiene al lado.

## La consecuencia honesta de una cadena nueva

Una cadena más nueva significa que menos herramientas la admiten. Algunos rastreadores de portafolio no mostrarán tu saldo de $IF, algunos exploradores no resolverán la dirección y en algunas wallets hay que añadir la red a mano. Es un inconveniente real más que una conspiración, y es el mismo punto que se hace en [El token](/es/docs/the-token/).

También hay una versión más dura. Menos herramientas significa además menos gente independiente mirando, que es parte de por qué este sitio lee sus cifras directamente de la cadena y enlaza cada una con la transacción de la que salió. La [página de datos](/es/stats/) es donde aterriza eso.

## Lo que esta página no te dice

Describe la cadena. No responde por ella.

La seguridad de una L2 descansa en su secuenciador y en su puente, y ninguno de los dos se ha revisado para este libro blanco. Nada de lo que hay aquí afirma que Robinhood Chain sea segura, descentralizada o duradera. Es una afirmación sobre qué es la cadena, en cuánto mide y dónde leerlo tú mismo.
