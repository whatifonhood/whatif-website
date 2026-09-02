---
title: El token
summary: El contrato, la cadena, el pool y lo que cada una de esas cosas significa en realidad.
---

$IF es un token ERC-20 desplegado en Robinhood Chain. Todo lo que sigue es público y cualquiera con conexión a internet puede leerlo.

## El contrato

**`0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1`**

Ese es el único $IF. No hay un segundo contrato, ni un "V2", ni una versión puenteada emitida por nosotros. Un token con el mismo nombre y una dirección distinta no es este proyecto — mira [Wallets y custodia](/es/docs/wallets-and-custody/) para saber por qué eso importa más de lo que parece.

Es un contrato de token estándar llamado `LaunchToken`, compilado con Solidity 0.8.30. No fue escrito para este proyecto. Es la plantilla de serie que un launchpad llamado NOXA estampaba para cada token que desplegaba, algo que se cubre en [El lanzamiento](/es/docs/the-launch/).

El código fuente en el explorador de bloques es una **coincidencia parcial**, verificada el 14 July 2026 a través de eth-bytecode-db en lugar de Sourcify. Una coincidencia parcial significa que el código publicado compila al mismo bytecode de ejecución que el contrato desplegado, pero no a un artefacto idéntico byte por byte. Así que la lógica que puedes leer es la lógica que está corriendo. Lo que no demuestra es que este archivo fuente exacto — los mismos comentarios, los mismos ajustes — sea el que se compiló, que es lo que establece una coincidencia total. NOXA nunca publicó la build que permitiría obtenerla. Ese es un hecho sobre el launchpad y no sobre el token, y es mejor decirlo aquí que descubrirlo después.

El contrato no tiene dueño, ni roles de administrador, ni proxy, ni vía de actualización. No hay nadie que pueda renunciar ni nada a lo que actualizarlo. Tampoco tiene ninguna función de quema de ningún tipo: cada $IF destruido hasta ahora se envió a la dirección muerta desde fuera del token, algo que [Cómo funciona la quema](/es/docs/how-the-burn-works/) explica por completo.

Lo único no estándar que llegó a hacer fue una ventana de restricción de lanzamiento que expiró de forma permanente unos 73 minutos después del despliegue, el 11 July 2026. [La cadena](/es/docs/the-chain/) explica por qué esa ventana se cuenta en bloques de Ethereum y no en bloques de Robinhood Chain.

## La cadena

Robinhood Chain es una red EVM. En la práctica eso significa que $IF se comporta como cualquier token de estilo Ethereum: funcionan las mismas wallets, el mismo formato de dirección, la misma forma de leer saldos.

Estar en una cadena más nueva tiene una consecuencia honesta que conviene decir: menos herramientas la admiten de las que admiten Ethereum. Algunos rastreadores de portafolio no mostrarán tu saldo, y algunos exploradores no resolverán la dirección. Eso es un inconveniente real, no una conspiración.

## El suministro

**1,000,000,000 $IF.** Fijo.

Fijo aquí significa algo concreto y comprobable: `totalSupply()` devuelve ese número, y el contrato no tiene ninguna función que pueda aumentarlo. No es "prometemos no acuñar" — no hay ningún mint que llamar.

Esto importa porque un suministro que se infla es la forma más silenciosa en que un token puede diluir a quienes lo tienen. Un titular no puede verlo con facilidad; solo ve caer el precio y supone que lo decidió el mercado. [El suministro y la quema](/es/docs/supply-and-burn/) tiene las cifras y el método.

## El pool

**`0x39A200271525E9641e799127bdAB299DAeF21953`**

Ese es el pool de Uniswap V3 donde se opera $IF. También es uno de los mayores titulares de $IF, lo cual es normal y conviene entender: un pool mantiene los tokens contra los que opera. No es una ballena, y tratarlo como tal interpreta muy mal la distribución.

La página [Quién lo tiene](/es/docs/who-holds-it/) etiqueta esa fila como el pool por la misma razón, en vez de dejar que parezca una ballena.

## Qué está bloqueado y qué no

Podemos decirte que el pool existe, dónde está y cuánto hay en él. Ahora también podemos decirte quién tiene la posición de liquidez, algo que durante mucho tiempo no pudimos.

La posición de lanzamiento es el NFT de posición `70641` de Uniswap V3. Lo tiene el contrato `LaunchLocker` de NOXA, cuya interfaz publicada no contiene ningún método para transferir la posición, reducir su liquidez ni retirar el principal. Nadie puede sacarla, NOXA incluida. Eso no es un temporizador que expira.

Tampoco es toda la liquidez. En la última instantánea, la posición `70641` aportaba el 51.4% de la liquidez activa del pool principal. El otro 48.6% es LP ordinaria de terceros que puede retirarse en un solo bloque, y los seis pools más pequeños en los que se opera $IF están completamente desbloqueados. [La liquidez y el bloqueo](/es/docs/liquidity-and-the-lock/) tiene la posición, el titular y la aritmética.

"LP bloqueada" sin nada detrás es la afirmación falsa más común de este mercado, y por eso este libro blanco dice que la posición de lanzamiento está bloqueada de forma permanente, y no que la liquidez esté bloqueada. Lo primero es una afirmación sobre una posición que puedes ir a comprobar. Lo segundo te diría que la profundidad que hay bajo el precio no puede irse, y aproximadamente la mitad sí puede.
