---
title: Referencia
summary: Direcciones, enlaces y las palabras que usa este libro blanco.
---

Todo en una página, para copiar y para comprobar.

## Direcciones

| Qué                          | Dirección                                    |
| ---------------------------- | -------------------------------------------- |
| Contrato de $IF              | `0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1` |
| Pool IF/WETH, Uniswap V3, 1% | `0x39A200271525E9641e799127bdAB299DAeF21953` |
| Dirección de quema           | `0x000000000000000000000000000000000000dEaD` |

La dirección del contrato es la que importa. Compara los últimos seis caracteres con esta página o con el explorador antes de comprar nada — mira [Cómo comprar](/es/docs/how-to-buy/).

El pool IF/WETH del 1% es el pool principal — creado en la transacción de lanzamiento, y en el que está la posición bloqueada. No es el único pool; el resto están listados en [La liquidez y el bloqueo](/es/docs/liquidity-and-the-lock/).

## El lanzamiento y el bloqueo

| Qué                                  | Valor                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| Transacción de lanzamiento           | `0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c`               |
| Bloque de lanzamiento, L2            | `6657668`, 11 July 2026, 04:32:42 UTC                                              |
| Posición de liquidez del lanzamiento | NFT de Uniswap V3 `70641`, ticks `[-887200, 204200]`                               |
| Titular del NFT `70641`              | El `LaunchLocker` de NOXA, según los logs 11 y 12 de la transacción de lanzamiento |
| Deployer, que envió el lanzamiento   | `0x84F8E5a324466Deb7447048C014CF0245ce04afA`                                       |

La posición `70641` es la que está bloqueada de forma permanente. [El lanzamiento](/es/docs/the-launch/) lee la transacción log por log; [La liquidez y el bloqueo](/es/docs/liquidity-and-the-lock/) dice qué cubre el bloqueo y qué no.

## Los contratos de NOXA

NOXA es el launchpad que estampó el token y que todavía opera la quema. Ninguna fuente que hayamos revisado establece quién controla estas direcciones: el dueño del locker es una wallet a secas, y el contrato de comisiones es bytecode sin verificar desplegado por ella.

| Qué                                                                                         | Dirección                                    |
| ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Contrato de comisiones, del que ha salido cada quema                                        | `0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417` |
| Wallet de comisiones original, a la que se pagó la tajada del 20% en $IF el 11–12 July 2026 | `0x71f2F1c2dc94cDaBFE29Cb355119f8683AE0969b` |
| Dueño del `LaunchLocker`                                                                    | `0x7E035Fb048a31e0481b88074557415b1C187242B` |

[Cómo funciona la quema](/es/docs/how-the-burn-works/) explica qué hace cada una dentro del mecanismo.

## El token

|                      |                              |
| -------------------- | ---------------------------- |
| Nombre, en la cadena | `What If`                    |
| Símbolo              | `IF`                         |
| Cadena               | Robinhood Chain              |
| Estándar             | ERC-20                       |
| Suministro total     | 1,000,000,000, fijo          |
| Decimales            | 18                           |
| Nombre del contrato  | `LaunchToken`                |
| Compilador           | Solidity 0.8.30              |
| Función de dueño     | ninguna — `owner()` revierte |

El `name` y el `symbol` propios del contrato son `What If` e `IF`. Este libro blanco los escribe como What $IF y $IF, que es la convención del ticker y no un token distinto. El explorador te mostrará el primer par.

## La cadena

|              |                                           |
| ------------ | ----------------------------------------- |
| Red          | Robinhood Chain                           |
| ID de cadena | `4663` (`0x1237`)                         |
| Token de gas | ETH                                       |
| RPC público  | `https://rpc.mainnet.chain.robinhood.com` |
| Explorador   | `https://robinhoodchain.blockscout.com`   |

[Verifícalo tú mismo](/es/docs/verify-it-yourself/) muestra las llamadas que puedes hacer contra ese RPC; [La cadena](/es/docs/the-chain/) cubre lo que significa para ti funcionar sobre una L2.

## Dónde mirar

- **Explorador de bloques** — [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com/token/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1)
- **Operar** — [Uniswap](https://app.uniswap.org/swap?outputCurrency=0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1&chain=robinhood)
- **Gráficos** — [DexScreener](https://dexscreener.com/robinhood/0x39a200271525e9641e799127bdab299daef21953)
- **Este sitio** — [whatifonhood.com](https://whatifonhood.com)

## Las únicas cuentas que somos nosotros

- **X** — [@WhatIFonHOOD](https://x.com/WhatIFonHOOD)
- **Telegram** — [t.me/WhatIFonHoodChain](https://t.me/WhatIFonHoodChain)

Cualquier otra cosa no somos nosotros. Nunca te escribiremos primero por mensaje directo, nunca pediremos una frase de recuperación y nunca te pediremos que conectes una wallet.

## Glosario

**Quema** — enviar tokens a una dirección desde la que nadie puede gastar, retirándolos de la circulación de forma permanente.

**Dirección del contrato** — la identidad única del token en la cadena. La única forma fiable de distinguir un token real de una copia con el mismo nombre.

**Gas** — la comisión que se paga en el token nativo de una cadena para que una transacción se incluya. Sin ella, no pasa nada.

**Pool de liquidez** — un contrato que tiene dos tokens contra los que la gente opera. Su saldo es lo que te permite comprar o vender.

**Capitalización de mercado** — el precio multiplicado por el suministro. Una cifra derivada, no dinero que exista en ningún sitio.

**Frase de recuperación** — las palabras que _son_ tu wallet. Cualquiera que las tenga es dueño de todo lo que hay en ella.

**Autocustodia** — tener tus propias claves, sin ninguna empresa capaz de congelar, revertir ni restaurar nada.

**Deslizamiento** — la diferencia entre el precio que viste y el precio que obtuviste, causada por el movimiento del mercado mientras se ejecuta tu operación.

**Suministro total** — todos los tokens que existen. Fijo aquí, y comprobable con una sola llamada.

## Leer este libro blanco sin conexión

Cada página es HTML simple y no necesita scripts para leerse. Imprime o guarda cualquiera de ellas; nada está detrás de un inicio de sesión y nada se carga desde un tercero.
