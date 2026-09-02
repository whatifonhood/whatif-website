---
title: Verifícalo tú mismo
summary: Los comandos exactos detrás de cada número, para que nunca tengas que creernos ninguno.
---

La página de inicio dice _no confíes en una página web — tampoco en esta._ Esta es la página que lo convierte en algo que puedes hacer.

Cada cifra de este sitio viene de una llamada pública, sin claves y de solo lectura. Nada de lo de abajo necesita una cuenta, una clave de API ni nuestro permiso. Pega cualquiera de ellas en una terminal.

La [página de datos](/es/stats/) lleva los mismos comandos bajo un panel llamado **Comprueba tú mismo cada cifra**, generados a partir de las mismas direcciones que usa el propio sitio — así que no pueden derivar hacia estar mal sin que el sitio esté mal de la misma manera.

## ¿El suministro es de verdad mil millones?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x18160ddd"},"latest"]}'
```

`0x18160ddd` es el selector de `totalSupply()`. La respuesta vuelve como wei en hexadecimal — divide entre 10^18. Debería leerse exactamente 1,000,000,000.

## ¿Alguien puede todavía cambiar el contrato?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x8da5cb5b"},"latest"]}'
```

`0x8da5cb5b` es `owner()`. Esta llamada **revierte** — `execution reverted` — porque la función no existe en este contrato.

Eso es un hecho más fuerte que una renuncia. Un contrato renunciado tuvo un dueño y lo cedió, y tienes que confiar en que se hizo bien. Este nunca tuvo la función, y acabas de probarlo.

## ¿Cuánto se ha quemado en realidad?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x70a08231000000000000000000000000000000000000000000000000000000000000dEaD"},"latest"]}'
```

`0x70a08231` es `balanceOf`, seguido de la dirección de quema rellenada a 32 bytes. Otra vez wei en hexadecimal, divide entre 10^18.

## Precio, liquidez y volumen

```
curl -s 'https://api.dexscreener.com/latest/dex/pairs/robinhood/0x39a200271525e9641e799127bdab299daef21953'
```

El precio está en `pairs[0].priceUsd`, la liquidez en `pairs[0].liquidity.usd` y el volumen de 24 horas en `pairs[0].volume.h24`.

## Número de titulares

```
curl -s 'https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1/info'
```

En `data.attributes.holders.count`.

## Los mayores titulares

```
curl -s 'https://robinhoodchain.blockscout.com/api/v2/tokens/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1/holders'
```

## ¿El lanzador se llevó de verdad el 11% en la transacción de lanzamiento?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt",
       "params":["0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c"]}'
```

Ese hash es el lanzamiento. Una transacción, dieciocho logs, y todo lo que hizo a $IF ocurrió dentro de ella. El log que hay que leer es el número 14 de la lista que devuelve el nodo: un `Transfer` en el contrato del token, `from` el pool `0x39A200271525E9641e799127bdAB299DAeF21953`, `to` el deployer `0x84F8E5a324466Deb7447048C014CF0245ce04afA`. Su campo `data` dividido entre 10^18 es 110,436,131.71 $IF, que es el 11.04% del suministro, comprado atómicamente antes de que nadie más pudiera operar.

El límite del 2% por wallet vigente en ese momento no se aplicó, porque el contrato eximía al deployer por nombre. [El lanzamiento](/es/docs/the-launch/) recorre el resto de los dieciocho logs.

## ¿El deployer todavía tiene algo?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x70a0823100000000000000000000000084F8E5a324466Deb7447048C014CF0245ce04afA"},"latest"]}'
```

`balanceOf` otra vez, esta vez con la dirección del deployer. Devuelve cero. El deployer volvió a comprar 674 $IF en algún momento después del lanzamiento y los movió de nuevo, y el saldo ha sido cero desde entonces. Eso es un hecho sobre una dirección y nada más: un saldo en cero no descarta otras wallets, y aquí nadie ha intentado agruparlas.

## ¿Quién tiene la posición de liquidez del lanzamiento?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt",
       "params":["0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c"]}'
```

El recibo del lanzamiento otra vez, leído para otra cosa. Los logs 7 a 9 son donde se acuña el NFT de posición `70641`. Los logs 11 y 12 son donde se mueve: un `Transfer` del NFT al `LaunchLocker` de NOXA, y el evento `PositionLocked` del propio locker. El campo `address` del log 12 es la dirección del locker — tómala de la cadena y no de nosotros, y luego ábrela en el explorador.

Para confirmar que hoy sigue siendo quien la tiene, pregunta al position manager — el contrato que emitió el NFT en los logs 7 a 9 — por `ownerOf` del token `70641`, que en hexadecimal es `0x113f1`. La pestaña de lectura del explorador lo hace sin terminal. La posición está en el locker desde el bloque en que se creó.

## ¿El locker puede llegar a soltarla?

No mediante nada que se haya publicado. Abre el locker en el explorador — la dirección está en el log 12 del recibo de lanzamiento de arriba — y lee su pestaña de contrato. No hay `transferFrom`, ni `safeTransferFrom`, ni `approve`, ni `setApprovalForAll`, ni `decreaseLiquidity` ni `burn`. Lo único que se puede llamar contra la posición es `collectFees`, que se lleva las comisiones acumuladas y deja el principal donde está.

Una función que no está no se puede llamar, y eso es algo fuerte que poder decir. También es el límite de lo que te da esta comprobación. El código fuente del locker está verificado como coincidencia parcial, igual que el del token, así que lo que estás leyendo es código fuente que compila al bytecode desplegado salvo por sus metadatos finales. Es código publicado, comprobado por ti. No es una auditoría, y aquí nadie ha hecho ninguna.

Esto no dice nada sobre la otra mitad de la profundidad del pool, que es LP corriente y puede irse en un solo bloque. [La liquidez y el bloqueo](/es/docs/liquidity-and-the-lock/) tiene ese reparto.

## ¿Todo lo que hay en la dirección de quema viene de un solo sitio?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getLogs","params":[{
       "address":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",null,
                 "0x000000000000000000000000000000000000000000000000000000000000dEaD"],
       "fromBlock":"0x3135298","toBlock":"0x3235298"}]}'
```

Eso pide cada `Transfer` a la dirección de quema en una ventana fija de alrededor de un millón de bloques, que en esta cadena es algo más de un día. Lee el segundo topic de cada resultado, que es el remitente. La dirección que hay que buscar es `0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417` — el contrato de comisiones de NOXA, y el origen de 423 de las 425 transferencias que se han hecho jamás a la dirección de quema. Las otras dos son polvo de wallets corrientes, 2.84 $IF entre las dos.

Amplía la ventana y el nodo te rechazará en vez de responder, así que todo el historial hay que leerlo por tramos. La [página de datos](/es/stats/) ya lo ha hecho y lista cada quema con un enlace a su transacción. [Cómo funciona la quema](/es/docs/how-the-burn-works/) explica qué está haciendo el contrato de comisiones.

## ¿La quema sigue llevándose el 100% del lado del token?

`protocolFeeShare` en el locker es el número que fija el reparto. Léelo desde la pestaña de lectura del explorador en el locker, el mismo contrato que en la sección anterior. Devuelve `100`.

Eso significa que todo el $IF que se barre de la posición bloqueada va al lado del protocolo, y la parte on-chain del creador en la pata del token es cero. Lo que el contrato de comisiones hace después con ello — que desde el 12 July 2026 ha sido quemar cada token — es comportamiento de ese contrato, y este número no lo fija. El código fuente del contrato de comisiones nunca se ha publicado, así que ese paso no se puede leer en absoluto. Solo se puede observar.

Léelo como una lectura y no como una promesa. El dueño del locker puede cambiar el número, y puede cambiar la dirección a la que se paga el lado del protocolo, sin preguntarle a nadie. Si cambia cualquiera de las dos cosas, aquí es donde lo verías primero.

## Si algún número no cuadra

Entonces el sitio está mal y nos gustaría saberlo. La cadena es la fuente de verdad; esta web es una comodidad puesta por encima.
