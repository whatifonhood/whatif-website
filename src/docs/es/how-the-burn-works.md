---
title: Cómo funciona la quema en realidad
summary: Un motor de comisiones automatizado operado por un tercero quema $IF casi todos los días, y puede detenerse cuando ese tercero lo decida.
snapshot: '2026-09-02'
---

Durante mucho tiempo este libro blanco dijo que no había ninguna comisión que alimentara la quema. Eso estaba equivocado, y la corrección es lo bastante grande como para necesitar su propia página. Todas las cifras de abajo se leyeron de la cadena el 2 de septiembre de 2026, en el bloque `52,582,784` o alrededor de él.

Empieza por la versión llana. La quema no es manual. No es ocasional. No es inexplicada. Y no la hace esta comunidad, que no ha quemado nada en absoluto. Es un motor de comisiones automatizado y dependiente del volumen, operado por un tercero, y se ha disparado 423 veces.

## El mecanismo, paso a paso

Nada en el contrato del token $IF participa en esto. El token no tiene ninguna función de quema de ningún tipo. Todo esto ocurre en las cañerías del launchpad, una capa por encima del token.

1. Quienes operan pagan la comisión del 1% de Uniswap V3. La posición `70641`, la posición de lanzamiento bloqueada de forma permanente, abarca prácticamente todo el rango de precios, así que gana una parte de cada swap del pool principal.
2. El recolector de NOXA llama a `collectFees` en el locker. El locker barre los dos lados de las comisiones acumuladas y los saca de la posición.
3. El locker reparte lo recaudado según `protocolFeeShare`, que ahora mismo lee `100`. Por tanto la parte en cadena del creador sobre el lado del token es cero. Puedes verlo ocurrir: cada cobro emite una transferencia de IF de valor cero desde el locker hacia el deployer original.
4. El contrato de comisiones quema el lado IF hacia `0x000000000000000000000000000000000000dEaD` y se queda con el lado WETH, que paga las ganancias del creador y la propia tajada de NOXA.

Así que el lado token de la comisión se destruye y el lado ETH se monetiza. Del WETH recogido de esa posición, `18.2300` se han pagado al lanzador original como ganancias del creador y unos `61.34` los ha retenido NOXA.

## La evidencia

Se ha decodificado cada una de las 425 transferencias hacia la dirección de quema. 423 de ellas, que suman **93,449,234.06 IF**, vinieron de una sola dirección:

**`0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417`**

Esa dirección es el receptor de la comisión de protocolo de NOXA y su recolector de comisiones autorizado. Las otras dos transferencias son polvo de wallets corrientes: `2.84` IF y `0` IF.

Una cosa que conviene mirar sin ilusiones. Ese contrato de comisiones son 7,725 bytes de bytecode no verificado, desplegado por el dueño del locker. Su código fuente nunca se ha publicado, así que lo que hace se infiere de su comportamiento en la cadena y no de un código que alguien pueda leer.

## Qué cambió el segundo día

El reparto no ha sido siempre el que es ahora. En los primeros diez cobros, desde el 11 de julio 06:46 UTC hasta el 12 de julio 09:52 UTC, el contrato quemó el 80% del IF que recogió y envió el otro 20% a la wallet de comisiones original de NOXA:

**`0x71f2F1c2dc94cDaBFE29Cb355119f8683AE0969b`**

Allí fueron `14,468,370.53` IF. Por eso esa wallet sigue apareciendo en la [tabla de titulares](/es/stats/), con el 1.45% del suministro. No es una ballena misteriosa y no es una asignación del equipo. Es la tajada de comisiones de un launchpad de los dos primeros días.

Desde el 12 de julio en adelante se ha quemado el 100% del lado IF, en los 413 cobros siguientes.

## La forma de la quema en el tiempo

La quema sigue el volumen de operaciones, lo que significa que la mayor parte ocurrió cuando el volumen era más alto, lo que significa que la mayor parte ya quedó atrás.

| Periodo                | IF quemado | Parte del total quemado |
| ---------------------- | ---------- | ----------------------- |
| 11 Jul 2026, día uno   | 56,873,813 | 60.9%                   |
| Resto de julio         | 29,950,521 | 32.0%                   |
| Agosto                 | 6,541,732  | 7.0%                    |
| Septiembre hasta ahora | 83,171     | 0.1%                    |

Hubo quemas en 51 de los 53 días entre el lanzamiento y la instantánea del 2 de septiembre de 2026, así que el motor funciona de forma constante. Simplemente funciona con mucho menos combustible. El volumen ha caído aproximadamente dos órdenes de magnitud respecto a la semana del lanzamiento, y al ritmo actual el suministro se quema alrededor de un 0.014% al día.

Acumulado en la posición y a la espera del siguiente barrido en el momento de la instantánea: `65,950` IF y `0.1967` WETH. Esa es la próxima quema, y se puede leer en vivo en lugar de aceptarla por confianza.

## Quién es NOXA, y qué significa eso

NOXA es el launchpad que estampó el token. Las fechas importan, porque explican por qué la configuración de comisiones nunca se ha renegociado.

El `LaunchLocker` se desplegó el 16 de junio de 2026, dos semanas antes de que abriera la mainnet pública de Robinhood Chain, con la parte del protocolo fijada en 65. El día de la mainnet, el 1 de julio, la parte se subió de 65 a 100 y se autorizó como recolector el contrato de comisiones actual. $IF se lanzó el 11 de julio bajo esa configuración. Ese mismo día, NOXA anunció que dejaría de aceptar nuevos lanzamientos de tokens. Dos días después su web se apagó, y el 14 de julio publicó que ya no cobraría comisiones y que redirigiría el 100% de los ingresos a los creadores.

Esa declaración y el estado en la cadena no cuadran. Hasta el cobro más reciente, el 1 de septiembre 21:14 UTC, `protocolFeeShare` sigue leyendo `100`, y el log `ProtocolFeeUpdated` del locker no muestra ningún cambio desde el 1 de julio.

Encajan dos lecturas, y nada en la cadena decide entre ellas. O bien el anuncio nunca se aplicó a este locker, o bien se aplicó al lado token y no al lado ETH, ya que el 12 de julio es exactamente cuando el lado IF dejó de retenerse en parte y pasó a quemarse por completo. Tómalo como interpretación, no como hecho.

Nadie sabe quién está detrás de NOXA. Ninguna fuente revisada lo establece. El dueño del locker es una cuenta de propiedad externa a secas y el contrato de comisiones es bytecode no verificado.

## Qué puede salir mal

Esta sección pertenece aquí tanto como pertenece a [Riesgos](/es/docs/risks/), porque un mecanismo vale solo lo que valga aquello de lo que depende.

**La quema puede detenerse en cualquier momento, y nada en la cadena lo impediría.** Necesita un keeper de un tercero, vivo, que siga llamando a `collectFees`. Si eso se apaga, las comisiones simplemente se acumulan dentro de la posición, sin quemar y sin cobrar, todo el tiempo que nadie lo llame.

**El dueño del locker puede cambiar las condiciones.** Esa dirección es `0x7E035Fb048a31e0481b88074557415b1C187242B`. Puede cambiar la parte de la comisión, cambiar el receptor y autorizar o revocar recolectores. No puede mover ni deshacer la posición de LP, que es la parte que sigue bloqueada. La comunidad no tiene voz en nada de esto y no recibiría aviso.

**Solo el deployer original puede redirigir la ranura del creador.** `setFeeRedirect` para $IF solo lo puede llamar esa dirección, y nunca se ha fijado. Si alguna vez se negociara una parte de la comisión, esa es la única función que habría que llamar, y solo el lanzador puede llamarla.

**El operador es anónimo y no rinde cuentas.** Ver arriba.

## Qué no significa esto

No significa que el suministro sea deflacionario en ningún sentido prometido. Nada en el contrato del token obliga a una sola de estas quemas. El motor existe porque un launchpad lo configuró así y lo dejó funcionando, no porque $IF tenga una garantía.

Tampoco significa que un suministro más pequeño valga más. Esa parte no ha cambiado y nunca cambiará: quemar mueve el denominador, no la demanda.

Lo que queda es una descripción llana. Un launchpad cerró y dejó funcionando un motor que destruye el lado token de la comisión. El mecanismo es real, está funcionando y pertenece a otra persona que puede detenerlo. Esas cosas van en la misma frase, o la frase está mal. El total quemado en vivo está en la [página de datos](/es/stats/); la aritmética del suministro está en [El suministro y la quema](/es/docs/supply-and-burn/); qué está bloqueado y qué no está en [La liquidez y el bloqueo](/es/docs/liquidity-and-the-lock/).
