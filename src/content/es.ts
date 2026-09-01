import type { SiteCopy } from './types.ts';

/**
 * Spanish.
 *
 * The wordplay lands better here than in any other language: "¿Y si…?" is the
 * natural Spanish "what if", and `$IF` stands in for "si" without help. So the
 * hero reads "¿Y $IF esta es la buena?" and the marquee keeps the same rhythm
 * as the English.
 *
 * Neutral Spanish, leaning Latin American — "tú" throughout, no "vosotros",
 * and no regional slang, because the audience is spread across both sides of
 * the Atlantic.
 */
export const es: SiteCopy = {
  htmlLang: 'es',

  nav: {
    links: [
      { label: 'La tesis', href: '#thesis' },
      { label: 'Los números', href: '#numbers' },
      { label: 'Cómo comprar', href: '#buy' },
      { label: 'Preguntas', href: '#faq' },
    ],
    toolsLabel: 'Herramientas',
    tools: {
      ask: { label: 'Hazte una pregunta mejor', blurb: 'Un millón de formas de dudar' },
      pfp: { label: 'Encuentra tu moneda', blurb: 'Cuatro rarezas, una es tuya' },
      machine: { label: 'La Máquina What $IF', blurb: 'Lo que habrías ganado' },
      memes: { label: 'La bóveda', blurb: 'Róbalos, son gratis' },
      stats: { label: 'Datos', blurb: 'Cada número, en vivo' },
      holdings: { label: 'Consulta de wallet', blurb: 'Sin conectar nada' },
      learn: { label: 'Aprende', blurb: 'Seguridad, bases y pruebas' },
      roadmap: { label: 'Novedades', blurb: 'Lo último, primero' },
      brand: { label: 'Marca', blurb: 'Logos y material gráfico' },
    },
    toolGroups: { data: 'Los números', play: 'Juega', assets: 'Recursos', read: 'Lee' },
    languageMenu: 'Idioma',
    buy: 'Compra $IF',
    pfp: 'Encuentra tu moneda',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    languageLabel: 'Idioma',
  },

  hero: {
    liveOn: 'En vivo en Robinhood Chain',
    titleLead: '¿Y',
    titleTail: 'esta es la buena?',
    description:
      'La meme coin para los eternamente curiosos. ¿Y si hubieras entrado antes? ¿Y si hubieras aguantado? ¿Y si esta es la buena?',
    buy: 'Compra $IF',
    chart: 'Gráfico',
    statsNote: 'En vivo desde la cadena. Se actualiza cada vez que cargas la página.',
  },

  posts: {
    eyebrow: 'Desde la timeline',
    heading: { lead: 'La gente sigue', accent: 'preguntando.' },
    intro:
      'Lo que publica la comunidad. Se muestra aquí, no se incrusta — sin rastreadores, sin iframes.',
    follow: 'Síguenos en X',
  },

  marquee: [
    '¿Y $IF',
    'hubieras entrado antes?',
    '¿Y si',
    'hubieras aguantado?',
    '¿Y si',
    'esta es la buena?',
    '¿Y si',
    'nunca vendemos?',
    '¿Y si',
    'llega a mil millones?',
  ],

  cosmic: {
    kicker: '¿Y si',
    statements: [
      '¿Y si pudiera salvar una vida?',
      '¿Y si un solo deseo curara el cáncer?',
      '¿Y si el amor nos sobreviviera a todos?',
      '¿Y si una sola voz terminara una guerra?',
      '¿Y si los rotos fueran los que construyen?',
      '¿Y si la esperanza nunca fue la mentira?',
      '¿Y si el sueño de un niño reescribiera el mañana?',
      '¿Y si la piedad pudiera más que el poder?',
      '¿Y si recordáramos cada nombre?',
      '¿Y si la noche más oscura guardara el amanecer?',
      '¿Y si perdonar fuera la cura?',
      '¿Y si nadie tuviera que llorar solo?',
    ],
  },

  thesis: {
    eyebrow: 'La tesis',
    heading: { lead: 'Una pregunta.', accent: 'Potencial infinito.' },
    intro:
      '$IF no es un token de utilidad. No es gobernanza. Es ese pensamiento de las 3 de la mañana que todos hemos tenido, acuñado en la cadena más nueva del juego.',
    pillars: [
      {
        title: 'Todo empieza con una pregunta',
        body: 'Cada operación de la que te arrepentiste empezó con un "¿y si?". $IF se toma la pregunta lo bastante en serio como para ponerla en una cadena.',
      },
      {
        title: 'Construido en Robinhood Chain',
        body: 'Bloques rápidos, gas barato y el nombre que arrastró a toda una generación al mercado. Robinhood también empezó siendo un "¿y si?".',
      },
      {
        title: 'Ya quemado, y para siempre',
        body: '{burned} $IF — {burnedPercent} del suministro — están en una dirección de quema cuyas claves no tiene nadie. Eso no es una promesa: es un saldo que puedes leer tú mismo.',
      },
      {
        title: 'Verifícalo todo',
        body: 'El contrato, el pool, la quema y el número de holders son públicos. Enlazamos cada uno. No confíes en una página web — tampoco en esta.',
      },
    ],
  },

  numbers: {
    eyebrow: 'Los números',
    heading: { lead: 'Sin trucos.', accent: 'Solo las cuentas.' },
    intro:
      'Mil millones de tokens, un contrato público y una dirección de quema que cualquiera puede auditar. De esos tokens en los que esta sección es corta.',
    contractLabel: 'Dirección del contrato',
    verifyNote: 'Compara cada carácter con nuestro X y nuestro Telegram antes de comprar.',
    copy: 'Copiar',
    copied: 'Copiado',
    viewOnExplorer: 'Ver en Blockscout',
    stats: {
      price: 'Precio',
      marketCap: 'Capitalización',
      liquidity: 'Liquidez',
      volume: 'Volumen 24 h',
      supply: 'Suministro total',
      burned: 'Quemado',
      holders: 'Holders',
      chain: 'Cadena',
    },
    burnHeadline: 'quemados e irrecuperables',
    burnBody:
      'Enviados a 0x…dEaD, una dirección sin clave privada. Nadie puede mover esos tokens — ni el equipo, ni tú, ni nadie.',
    asOf: 'a fecha de',
    live: 'En vivo',
  },

  buy: {
    eyebrow: 'Arma tu bolsa',
    heading: { lead: 'Tres pasos.', accent: 'Ya está.' },
    intro: 'Necesitas una wallet, algo de ETH en Robinhood Chain y treinta segundos. Esto es todo.',
    steps: [
      {
        title: 'Consigue una wallet',
        body: 'MetaMask, OKX o Trust en la computadora. Robinhood Wallet en el teléfono. Cualquiera de ellas añadirá Robinhood Chain por ti la primera vez que entres a una página que la use.',
        action: 'Descargar MetaMask',
      },
      {
        title: 'Lleva ETH a Robinhood Chain',
        body: 'Retira ETH desde la app de Robinhood y elige la red Robinhood Chain. ¿Tienes ETH en otra cadena? Robinhood publica las rutas de puente.',
        action: 'Guía de puentes',
      },
      {
        title: 'Haz el swap en Uniswap',
        body: 'Se abre con $IF ya seleccionado en Robinhood Chain. Compara la dirección de esa página con la de arriba antes de confirmar.',
        action: 'Cambiar en Uniswap',
      },
    ],
    venuesTitle: 'Síguelo, grafícalo, verifícalo',
    venues: [
      { label: 'Uniswap', blurb: 'El pool principal IF/WETH.' },
      { label: 'DexScreener', blurb: 'Precio y liquidez en vivo.' },
      { label: 'CoinGecko', blurb: 'Datos de mercado e historial.' },
      { label: 'CoinMarketCap', blurb: 'Ranking y suministro.' },
      { label: 'Blockscout', blurb: 'El contrato en sí.' },
    ],
    safetyNote:
      'Esta página nunca te pedirá conectar una wallet, firmar un mensaje ni escribir una frase semilla. Si alguna página que dice ser $IF lo hace, no somos nosotros.',
  },

  pfpTeaser: {
    eyebrow: 'El pool',
    heading: { lead: 'Encuentra la moneda', accent: 'que eres tú.' },
    body: 'Monedas $IF hechas a mano en cuatro rarezas. Un toque, sale la tuya, la pones de foto de perfil. Sin wallet, sin registro, sin nada que conectar.',
    cta: 'Abrir el generador',
  },

  vaultTeaser: {
    eyebrow: 'La bóveda',
    heading: { lead: 'Todos los memes.', accent: 'Gratis para robar.' },
    body: 'Todos los memes que hemos hecho, en máxima resolución, listos para publicar. Para eso están. Haz clic derecho con responsabilidad.',
    cta: 'Abrir la bóveda',
  },

  ecosystem: {
    eyebrow: 'Ecosistema',
    heading: { lead: 'Herramientas que', accent: 'sí usamos.' },
    intro: 'Cómo operamos, seguimos y verificamos $IF. Cada enlace abre el sitio real.',
    blurbs: {
      Uniswap: 'Cambia ETH por $IF en el DEX principal de la cadena.',
      DexScreener: 'Precio, liquidez y cada operación en vivo.',
      CoinGecko: 'Historial de precios, capitalización, datos de la comunidad.',
      CoinMarketCap: 'Ranking, suministro y datos de mercado.',
      Blockscout: 'El contrato, los holders, la quema.',
      MetaMask: 'La wallet EVM que casi todos ya tienen.',
      'Robinhood Wallet': 'Soporta Robinhood Chain de forma nativa, en tu teléfono.',
    },
  },

  roadmap: {
    eyebrow: 'Los inversores no dejan de preguntar',
    heading: { lead: 'Entonces…', accent: '¿hoja de ruta?' },
    fileName: 'if_hoja_de_ruta_final_v3.pdf',
    lastEdited: '1 página · última edición: nunca',
    quarters: ['T1 — y si', 'T2 — y si', 'T3 — seguimos preguntando', 'T4 — memes, seguramente'],
    stamp: 'Seguimos preguntando.',
    footnote: 'Sin hoja de ruta. Sin utilidad. Sin promesas. Solo con fines de entretenimiento.',
  },

  faq: {
    eyebrow: 'No hay preguntas tontas',
    heading: { lead: 'Preguntas,', accent: 'respondidas.' },
    items: [
      {
        q: '¿Qué es $IF?',
        a: '$IF es una meme coin en Robinhood Chain construida alrededor de la única pregunta que todo trader se hace a las 3 de la mañana: ¿y si? No hay hoja de ruta de producto ni utilidad. Hay una pregunta, una comunidad y un gráfico.',
      },
      {
        q: '¿Cómo llevo ETH a Robinhood Chain?',
        a: 'Aquí es donde se traba casi todo el mundo la primera vez. La ruta más simple es retirar ETH desde la app de Robinhood y seleccionar la red Robinhood Chain. Si tu ETH está en otra cadena, Robinhood documenta los puentes que llegan hasta ella. En cualquier caso, deja un poco de ETH para el gas.',
      },
      {
        q: '¿Dónde lo compro?',
        a: 'En Uniswap sobre Robinhood Chain, usando la dirección del contrato que aparece en esta página. El mercado más profundo es el pool IF/WETH. Compara siempre la dirección carácter por carácter — las meme coins atraen imitadores, y un solo carácter equivocado manda tu dinero a un desconocido.',
      },
      {
        q: '¿Cómo sé que tengo el token correcto?',
        a: 'La única dirección que publicaremos jamás es 0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1, y aparece completa en esta página, en nuestro perfil de X y en nuestro Telegram. Si un sitio te muestra una versión abreviada, o una distinta, ciérralo.',
      },
      {
        q: '¿Hay algún impuesto?',
        a: 'El contrato de $IF no añade nada por encima de tu operación. El 1 % que verás citado en el pool principal es la comisión propia de Uniswap, que va a quienes aportan liquidez — no a nosotros. El contrato es público en Blockscout; léelo en lugar de creerle a una página web.',
      },
      {
        q: '¿Qué se ha quemado?',
        a: '{burned} $IF — {burnedPercent} del suministro total — están en 0x…dEaD, una dirección sin clave privada. Esos tokens no podrán moverse nunca más. Es un saldo en vivo en el explorador de bloques, no una afirmación en un documento.',
      },
      {
        q: '¿Dónde está la comunidad?',
        a: 'En X somos @WhatIFonHOOD y en Telegram t.me/WhatIFonHoodChain. Los dos están activos y los dos los llevan personas que tienen la moneda. Todos somos el dev.',
      },
      {
        q: '¿$IF es una inversión?',
        a: 'No. Es una meme coin sin valor intrínseco, sin promesas del equipo y sin hoja de ruta. Los precios bajan con la misma facilidad con la que suben, y la mayoría de las meme coins terminan en cero. Nunca gastes más de lo que perderías sin que te quite el sueño.',
      },
    ],
  },

  footer: {
    heading: { lead: '¿Y', accent: 'te unieras?' },
    subtitle: 'El gráfico está justo ahí. La pregunta está justo aquí.',
    buy: 'Compra $IF',
    telegram: 'Únete a Telegram',
    follow: 'Síguenos en X',
    chart: 'Gráfico',
    canonical: 'El único sitio oficial es whatifonhood.com. Todo lo demás es otra persona.',
    disclaimer:
      '$IF es una meme coin sin valor intrínseco y sin ninguna expectativa de retorno financiero. Nada de lo que hay aquí es asesoramiento financiero. Investiga por tu cuenta.',
    builtBy: 'Todos somos el dev.',
  },

  pages: {
    memes: {
      title: 'La Bóveda',
      heading: { lead: 'Todos los memes.', accent: 'Gratis para robar.' },
      intro:
        'Todos los memes de $IF, en máxima resolución, sin marca de agua y sin necesidad de dar crédito. Publícalos, imprímelos, remézclalos. Para eso están.',
      download: 'Descargar',
      all: 'Todos',
      searchLabel: 'Buscar memes',
      empty: 'Nada coincide con eso. Prueba con otra palabra.',
      count: 'memes',
    },
    brand: {
      title: 'Marca',
      heading: { lead: 'Las marcas,', accent: 'y cómo usarlas.' },
      intro:
        'Una marca, tres signos: la moneda identifica al token, el personaje identifica al mundo, el logotipo identifica al nombre. Toma lo que necesites.',
      download: 'Descargar',
      kitNote:
        'Logos, el avatar, logotipos vectoriales, banners, la hoja de referencia del personaje y las poses en transparente — con la paleta, la tipografía y las reglas en un léeme.',
      rulesTitle: 'Tres cosas que importan',
      rules: [
        'La moneda siempre conserva su borde. Eso es lo que la hace leerse como moneda.',
        'Nunca compongas la dirección del contrato en una tipografía de display, y nunca la recortes.',
        'Nada de la pluma de Robinhood. Escribe “en Robinhood Chain” en su lugar.',
      ],
    },
    stats: {
      title: 'Datos',
      heading: { lead: 'Cada número,', accent: 'en vivo.' },
      intro: 'Precio, liquidez, suministro y la quema — leídos directamente desde Robinhood Chain.',
      sourceNote:
        'El precio, la liquidez y el volumen vienen de DexScreener; los holders y la concentración de GeckoTerminal; la quema se lee directamente de la cadena. Todo se actualiza solo mientras esta pestaña esté abierta.',
      poolLabel: 'Pool principal',
      openExplorer: 'Abrir el contrato',
      openChart: 'Abrir el gráfico',
      timeframes: { day: '24 H', week: '7 D', month: '30 D', quarter: '90D', all: 'TODO' },
      resizeChart: 'Arrastra para redimensionar el gráfico',
      zoomIn: 'Acercar',
      zoomOut: 'Alejar',
      resetZoom: 'Restablecer',
      average: 'Media',
      chartHint: 'Rueda para acercar · arrastra para mover · doble clic para restablecer',
      chartTypes: { candles: 'Velas', line: 'Línea' },
      logScale: 'Log',
      chartTitle: 'Precio',
      feedTitle: 'Últimas operaciones',
      biggestBuy: 'Mayor compra',
      buys: 'Compras',
      sells: 'Ventas',
      buyLabel: 'Compra',
      sellLabel: 'Venta',
      viewTx: 'Ver',
      loading: 'Leyendo la cadena…',
      failed:
        'No se pudo acceder a los datos de mercado en este momento. Las cifras de arriba son de la última compilación.',
      feedNote: 'Las operaciones más recientes en el pool IF/WETH.',
      biggestSell: 'Mayor venta',
      windowHours: 'en las últimas {hours} horas',
      holdersTitle: 'Holders',
      concentration: 'Quién lo tiene',
      bands: { top10: 'Top 10', next20: '11–30', next20More: '31–50', rest: 'Todos los demás' },
      holdersUpdated: 'recontado',
      pressureTitle: 'Presión de compra y venta',
      pressureNote: 'Volumen por hora del último día. Compras arriba, ventas abajo.',
      burnHistoryTitle: 'Cada quema',
      burnHistoryNote: 'Leído de la cadena. Cada escalón es una transacción que puedes abrir.',
      trustTitle: 'Comprobaciones que cualquiera puede hacer',
      trustNote:
        'Dos de estas las certifican terceros, no nosotros; las otras dos las lee esta página directamente del contrato al cargar. Cada una enlaza a donde puedes verificarlo tú mismo, y una comprobación que no se pudo leer lo dice en vez de mostrarse como superada.',
      checks: {
        verified: 'Listado verificado',
        honeypot: 'Prueba de honeypot',
        supply: 'Suministro fijo, sin función de emisión',
        burn: 'La dirección de quema no tiene clave privada',
      },
      checkPass: 'Superada',
    },
    machine: {
      title: 'La Máquina What $IF',
      heading: { lead: '¿Y $IF hubieras', accent: 'entrado antes?' },
      intro:
        'Elige una moneda que se te escapó, un monto y una fecha. La máquina hace la cuenta que llevas tiempo evitando.',
      coinLabel: 'La moneda que se te escapó',
      searchPlaceholder: 'Busca una moneda — bitcoin, doge, pepe…',
      noResults: 'No hay nada con ese nombre en el conjunto.',
      loadFailed:
        'No se pudieron cargar los precios de esa moneda ahora mismo. Prueba con otra o inténtalo en un momento.',
      emptyState: 'Elige una moneda, un monto y un mes. La máquina hace el resto.',
      investedLabel: 'Pusiste',
      worthLabel: 'Hoy valdría',
      boughtLabel: 'Habrías tenido',
      entryLabel: 'Precio entonces',
      todayLabel: 'Precio ahora',
      coinCount: 'Precios mensuales, desde que cada moneda empezó a cotizar.',
      amountLabel: 'Lo que habrías puesto',
      dateLabel: 'Cuándo',
      calculate: 'Calcular',
      resultLead: 'Hoy valdría',
      multiplier: 'multiplicador',
      shareText: (amount, coin, month, value, multiple) =>
        `¿Y $IF hubiera puesto ${amount} en ${coin} en ${month}?\n\n${value}. ${multiple}.\n\nSeguimos preguntando.`,
      verdicts: {
        dodged: 'De esa te salvaste.',
        fine: 'Habrías quedado bien.',
        ouch: 'Mejor no lo pienses.',
        painful: 'Esa todavía duele.',
        unbearable: 'No le cuentes esto a nadie.',
      },
      shareOnX: 'Publícalo en X',
      pivot: '¿Y $IF no te pierdes la próxima?',
      pivotCta: 'Compra $IF',
      disclaimer:
        'Cuentas aproximadas sobre precios históricos, con fines de entretenimiento. Los precios pasados no predicen nada.',
    },
    pfp: {
      title: 'Generador de PFP',
      heading: { lead: 'Encuentra la moneda', accent: 'que eres tú.' },
      intro:
        'Toca generar, sale una moneda $IF, la pones de foto de perfil. Sin wallet, sin registro, sin nada que conectar.',
      subline: 'Cuatro rarezas. Cada tirada es gratis.',
      generate: 'Genera mi $IF',
      again: 'Otra vez',
      hint: 'Un toque. No se guarda nada fuera de tu propio navegador.',
      tiers: { common: 'Común', uncommon: 'Poco común', rare: 'Rara', legendary: 'Legendaria' },
      found: (found, total) => `Encontradas ${found} de ${total}`,
      showPool: 'Ver todas las monedas',
      hidePool: 'Ocultar monedas',
      locked: 'Aún no encontrada',
      download: 'Descargar PNG',
      shareCard: 'Tarjeta para compartir',
      postOnX: 'Publicar en X',
      shareText: (name, tier) => `Me salió ${name} — ${tier}.\n\n¿Y $IF esta eres tú?`,
      odds: 'de probabilidad',
      openGenerator: 'Saca la tuya',
    },
    ask: {
      title: 'Hazte una pregunta mejor',
      eyebrow: 'El generador',
      heading: { lead: '¿Y $IF', accent: 'cualquier cosa?' },
      intro:
        'Toda la moneda es una sola pregunta. Aquí la tienes, una y otra vez, y nunca exactamente la misma.',
      again: 'Otra pregunta',
      copyLink: 'Copiar enlace',
      copied: 'Copiado.',
      linkCopied: 'Enlace copiado.',
      today: 'La pregunta de hoy',
      answerLabel: 'Tu respuesta',
      answerPlaceholder: 'Di lo que piensas. Va en la tarjeta.',
      postOnX: 'Publicar en X',
      download: 'Descargar tarjeta',
      possibilities: 'preguntas posibles',
      hint: 'pulsa espacio para otra',
      shareText: '{question}\n\nSeguimos preguntando.',
    },
    learn: {
      title: 'Aprende',
      eyebrow: 'Aprende',
      heading: { lead: 'Entiende', accent: 'lo que haces.' },
      intro:
        'Cómo funciona esto, cómo mantener tu dinero a salvo y cómo verificar por ti mismo cada afirmación de este sitio. La seguridad primero.',
      backToIndex: 'Todas las páginas',
      next: 'Siguiente:',
      previous: 'Anterior:',
      categories: { safety: 'Mantente a salvo', basics: 'Lo básico', token: 'Este token' },
      updatedLabel: 'Actualizado',
    },
    roadmap: {
      title: 'Hoja de ruta',
      eyebrow: 'Hoja de ruta',
      heading: { lead: 'Lo que está hecho,', accent: 'y lo que viene.' },
      intro:
        'Todo lo que se ha lanzado se queda en esta página. Una hoja de ruta que solo enseña el futuro es una lista de deseos.',
      open: 'Échale un vistazo',
      statuses: {
        building: 'En construcción ahora',
        next: 'Lo siguiente',
        later: 'Más adelante',
        shipped: 'Ya lanzado',
      },
      shippedCount: 'cosas lanzadas hasta ahora',
      note: 'No se promete ninguna fecha para lo que aún no ha ocurrido. Esto es una meme coin, y una fecha es la promesa más fácil de romper en cripto — lo lanzado lleva fecha porque ya pasó.',
    },
    holdings: {
      title: 'Consulta de wallet',
      eyebrow: 'Tu bolsa',
      heading: { lead: '¿Y $IF', accent: 'lo revisaras?' },
      intro:
        'Pega cualquier dirección y mira lo que tiene. Sin conectar wallet, sin firmar, sin nada que aprobar.',
      inputLabel: 'Dirección de wallet',
      check: 'Consultar',
      privacy:
        'Un saldo es información pública en un registro público, así que esto solo lo lee — lo mismo que hace un explorador de bloques. La dirección la escribes tú, nunca se le pide a una wallet. No se guarda nada, y no se envía nada a ningún sitio salvo a la cadena.',
      download: 'Descargar tarjeta',
      postOnX: 'Publicar en X',
      shareText: 'Tengo {tokens} {symbol}.\n\nSeguimos preguntando.',
      bands: {
        whale: 'Ballena',
        shark: 'Tiburón',
        holder: 'Holder',
        curious: 'Curioso',
        empty: 'Vacía',
      },
      verdicts: {
        whale: 'El gráfico se mueve cuando tú te mueves.',
        shark: 'Eso sí que es una posición.',
        holder: 'Estás dentro. Bien dentro.',
        curious: 'Empezar es empezar.',
        empty: 'Aquí todavía no hay nada. ¿Y $IF eso cambiara?',
      },
      errors: {
        empty: 'Pega una dirección primero.',
        ens: 'Ese tipo de nombres no se resuelve en Robinhood Chain. Usa la dirección 0x.',
        txHash: 'Eso parece un hash de transacción, no una dirección — es el doble de largo.',
        prefix: 'Una dirección empieza por 0x.',
        shape: 'Esa dirección no es válida. Tienen 42 caracteres y empiezan por 0x.',
        network: 'No se pudo acceder a la cadena ahora mismo. Inténtalo en un momento.',
      },
    },
    notFound: {
      title: 'Página no encontrada',
      eyebrow: '404',
      heading: { lead: '¿Y $IF esta página', accent: 'nunca existió?' },
      intro: 'No existió. Aquí no se ha movido nada — esta dirección nunca fue nuestra.',
      tryThese: 'Estas sí existen',
    },
    meme: {
      intro: 'Máxima resolución, sin marca de agua, sin necesidad de dar crédito. Llévatelo.',
      description: (title, series) =>
        `${title} — un meme de $IF de la serie ${series}. Máxima resolución, libre de publicar, sin dar crédito.`,
      download: 'Descargar',
      postOnX: 'Publicar en X',
      more: 'Más de',
      backToVault: 'Volver a la bóveda',
      shareText: (title) => `${title}\n\nSeguimos preguntando.`,
    },
  },

  common: {
    skipToContent: 'Saltar al contenido',
    externalLink: 'se abre en una pestaña nueva',
  },
};
