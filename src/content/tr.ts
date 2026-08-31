import type { SiteCopy } from './types.ts';

export const tr: SiteCopy = {
  htmlLang: 'tr',

  nav: {
    links: [
      { label: 'Fikir', href: '#thesis' },
      { label: 'Rakamlar', href: '#numbers' },
      { label: 'Nasıl alınır', href: '#buy' },
      { label: 'SSS', href: '#faq' },
    ],
    toolsLabel: 'Araçlar',
    tools: {
      pfp: { label: 'Kendi paranı bul', blurb: 'Dört nadirlik, biri senin' },
      machine: { label: 'What $IF Makinesi', blurb: 'Ne kazanacaktın' },
      memes: { label: 'Kasa', blurb: 'Çalması serbest' },
      maker: { label: 'Meme yapıcı', blurb: 'On saniyede bir tane yap' },
      stats: { label: 'Veriler', blurb: 'Her rakam canlı' },
      brand: { label: 'Marka', blurb: 'Logolar ve görseller' },
    },
    buy: '$IF Al',
    pfp: 'Kendi paranı bul',
    openMenu: 'Menüyü aç',
    closeMenu: 'Menüyü kapat',
    languageLabel: 'Dil',
  },

  hero: {
    liveOn: 'Robinhood Chain üzerinde yayında',
    titleLead: 'Ya',
    titleTail: 'bu o ise?',
    description:
      'Sonsuz meraklılar için bir meme coin. Ya daha önce alsaydın? Ya elinde tutsaydın? Ya bu gerçekten o ise?',
    buy: '$IF Al',
    chart: 'Grafik',
    statsNote: 'Veriler zincirden geliyor, sayfayı her açtığında yenilenir.',
  },

  marquee: [
    'Ya $IF',
    'daha önce alsaydın?',
    'Ya',
    'elinde tutsaydın?',
    'Ya',
    'bu o ise?',
    'Ya',
    'hiç satmasaydık?',
    'Ya',
    'bir milyara ulaşırsa?',
  ],

  cosmic: {
    kicker: 'Ya',
    statements: [
      'Ya bir hayat kurtarabilseydim?',
      'Ya bir dilekle kanseri yenebilseydim?',
      'Ya aşk hepimizden uzun yaşasaydı?',
      'Ya tek bir ses bir savaşı bitirebilseydi?',
      'Ya kırılanlar inşa edenler olsaydı?',
      'Ya umut hiç yalan olmasaydı?',
      'Ya bir çocuğun hayali yarını yeniden yazsaydı?',
      'Ya merhamet güçten daha kuvvetli olsaydı?',
      'Ya her ismi hatırlasaydık?',
      'Ya en karanlık gece şafağı saklasaydı?',
      'Ya affetmek çare olsaydı?',
      'Ya kimse yalnız yas tutmasaydı?',
    ],
  },

  thesis: {
    eyebrow: 'Fikir',
    heading: { lead: 'Tek bir soru.', accent: 'Sonsuz ihtimal.' },
    intro:
      '$IF bir fayda tokeni değil, yönetişim tokeni de değil. Herkesin gece 3’te aklına gelen o düşüncenin, oyundaki en yeni zincire kazınmış hâli.',
    pillars: [
      {
        title: 'Her şey bir soruyla başlar',
        body: 'Pişman olduğun her işlem “ya olsaydı?” ile başladı. $IF bu soruyu zincire yazacak kadar ciddiye alıyor.',
      },
      {
        title: 'Robinhood Chain üzerine kurulu',
        body: 'Hızlı bloklar, ucuz gas ve bir nesli piyasaya çeken isim. Robinhood da bir “ya olsaydı” olarak başlamıştı.',
      },
      {
        title: 'Yüzde dokuzu şimdiden gitti',
        body: '93 milyondan fazla $IF, anahtarı kimsede olmayan bir yakma adresinde duruyor. Bu bir söz değil — kendi gözünle okuyabileceğin bir bakiye.',
      },
      {
        title: 'Her şeyi kendin doğrula',
        body: 'Kontrat, havuz, yakılan miktar ve cüzdan sayısı tamamen açık; hepsine link verdik. Hiçbir siteye güvenme — buna dâhil.',
      },
    ],
  },

  numbers: {
    eyebrow: 'Rakamlar',
    heading: { lead: 'Hile yok.', accent: 'Sadece matematik.' },
    intro:
      'Bir milyar token, açık bir kontrat ve herkesin denetleyebileceği bir yakma adresi. Bu bölümün kısa olmasının sebebi bu.',
    contractLabel: 'Kontrat adresi',
    verifyNote: 'Almadan önce her karakteri X ve Telegram hesabımızdakiyle karşılaştır.',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    viewOnExplorer: "Blockscout'ta gör",
    stats: {
      price: 'Fiyat',
      marketCap: 'Piyasa değeri',
      liquidity: 'Likidite',
      volume: '24s hacim',
      supply: 'Toplam arz',
      burned: 'Yakılan',
      holders: 'Cüzdan',
      chain: 'Zincir',
    },
    burnHeadline: 'yakıldı ve geri alınamaz',
    burnBody:
      'Özel anahtarı olmayan 0x…dEaD adresine gönderildi. Bu tokenleri kimse kıpırdatamaz — ekip de, sen de, hiç kimse.',
    asOf: 'şu tarihte',
    live: 'Canlı',
  },

  buy: {
    eyebrow: 'Çantanı doldur',
    heading: { lead: 'Üç adım.', accent: 'Hepsi bu.' },
    intro:
      'Bir cüzdana, Robinhood Chain üzerinde biraz ETH’ye ve otuz saniyeye ihtiyacın var. Tamamı aşağıda.',
    steps: [
      {
        title: 'Bir cüzdan edin',
        body: 'Bilgisayarda MetaMask, OKX veya Trust; telefonda Robinhood Wallet. Robinhood Chain’i kullanan bir sayfayı ilk açtığında cüzdanın ağı eklemeyi kendisi önerecek.',
        action: 'MetaMask edin',
      },
      {
        title: "Robinhood Chain'e ETH getir",
        body: 'Robinhood uygulamasından ETH çek ve ağ olarak Robinhood Chain’i seç. ETH’in başka bir zincirde mi? Robinhood köprü yollarını kendi dokümanlarında yayınlıyor.',
        action: 'Köprüleme rehberi',
      },
      {
        title: "Uniswap'ta takas et",
        body: 'Robinhood Chain üzerinde $IF önceden seçili olarak açılır. Onaylamadan önce oradaki adresi yukarıdakiyle karşılaştır.',
        action: "Uniswap'ta takas et",
      },
    ],
    venuesTitle: 'Takip et, grafiğe bak, doğrula',
    venues: [
      { label: 'Uniswap', blurb: 'Ana IF/WETH havuzu.' },
      { label: 'DexScreener', blurb: 'Canlı fiyat ve likidite.' },
      { label: 'CoinGecko', blurb: 'Piyasa verisi ve geçmiş.' },
      { label: 'CoinMarketCap', blurb: 'Sıralama ve arz.' },
      { label: 'Blockscout', blurb: 'Kontratın kendisi.' },
    ],
    safetyNote:
      'Bu site senden asla cüzdan bağlamanı, bir mesaj imzalamanı veya kurtarma kelimelerini girmeni istemez. $IF olduğunu söyleyip bunu isteyen bir sayfa varsa, o biz değiliz.',
  },

  pfpTeaser: {
    eyebrow: 'Havuz',
    heading: { lead: 'Sana ait olan', accent: 'parayı bul.' },
    body: 'El yapımı $IF paraları, dört nadirlik seviyesi. Bir kez dokun, kendininkini al, profil fotoğrafın yap. Cüzdan yok, kayıt yok, bağlanacak hiçbir şey yok.',
    cta: 'Üreteci aç',
  },

  vaultTeaser: {
    eyebrow: 'Kasa',
    heading: { lead: 'Her meme.', accent: 'Çalması serbest.' },
    body: 'Yaptığımız her meme, tam çözünürlükte, paylaşmaya hazır. Zaten bunun için varlar. Sağ tıkla, sorumluca.',
    cta: 'Kasayı aç',
  },

  ecosystem: {
    eyebrow: 'Ekosistem',
    heading: { lead: 'Gerçekten', accent: 'kullandığımız araçlar.' },
    intro: '$IF’i böyle alıp satıyor, takip ediyor ve doğruluyoruz. Her link gerçeğine gider.',
    blurbs: {
      Uniswap: 'Zincirin ana DEX’inde ETH’yi $IF’a çevir.',
      DexScreener: 'Canlı fiyat, likidite ve her işlem.',
      CoinGecko: 'Fiyat geçmişi, piyasa değeri, topluluk verileri.',
      CoinMarketCap: 'Sıralama, arz ve piyasa verisi.',
      Blockscout: 'Kontrat, cüzdanlar ve yakılanlar.',
      MetaMask: 'Çoğu kişide zaten olan EVM cüzdanı.',
      'Robinhood Wallet': 'Telefonda Robinhood Chain’i doğrudan destekler.',
    },
  },

  roadmap: {
    eyebrow: 'Yatırımcılar sorup duruyor',
    heading: { lead: 'Peki…', accent: 'yol haritası?' },
    fileName: 'if_roadmap_final_v3.pdf',
    lastEdited: '1 sayfa · son düzenleme: hiçbir zaman',
    quarters: [
      'Ç1 — ya olsaydı',
      'Ç2 — ya olsaydı',
      'Ç3 — hâlâ soruyoruz',
      'Ç4 — meme, muhtemelen',
    ],
    stamp: 'Hâlâ soruyoruz.',
    footnote: 'Yol haritası yok. Fayda yok. Söz yok. Yalnızca eğlence amaçlıdır.',
  },

  faq: {
    eyebrow: 'Aptalca soru yoktur',
    heading: { lead: 'Sorular,', accent: 'yanıtlandı.' },
    items: [
      {
        q: '$IF nedir?',
        a: '$IF, Robinhood Chain üzerinde, her yatırımcının gece 3’te kendine sorduğu tek soru etrafında kurulmuş bir meme coin: ya olsaydı? Ürün yol haritası yok, fayda vaadi yok. Bir soru, bir topluluk ve bir grafik var.',
      },
      {
        q: "Robinhood Chain'e ETH nasıl getirilir?",
        a: 'Yeni başlayanların çoğu burada takılıyor. En basit yol, Robinhood uygulamasından ETH çekip ağ olarak Robinhood Chain’i seçmek. ETH’in başka bir zincirdeyse, ona ulaşan köprüleri Robinhood kendi dokümanlarında listeliyor. Her hâlükârda gas için biraz ETH bırak.',
      },
      {
        q: 'Nereden alınır?',
        a: 'Robinhood Chain üzerindeki Uniswap’tan, bu sayfadaki kontrat adresini kullanarak. En derin piyasa IF/WETH havuzu. Adresi mutlaka karakter karakter karşılaştır — meme coin’ler taklitçi çeker ve tek bir yanlış karakter paranı bir yabancıya gönderir.',
      },
      {
        q: 'Doğru tokeni aldığımı nasıl anlarım?',
        a: 'Yayınlayacağımız tek adres 0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1 ve bu sayfada, X profilimizde ve Telegram’ımızda tam hâliyle görünür. Bir site sana kısaltılmış ya da farklı bir adres gösteriyorsa, kapat.',
      },
      {
        q: 'Vergi var mı?',
        a: '$IF kontratı işlemenin üstüne hiçbir şey eklemiyor. Ana havuzda göreceğin %1, Uniswap’ın kendi komisyon kademesidir ve likidite sağlayanlara gider, bize değil. Kontrat Blockscout’ta açık — bir sitenin sözüne güvenmek yerine kendin oku.',
      },
      {
        q: 'Ne kadarı yakıldı?',
        a: '93 milyondan fazla $IF — toplam arzın %9’undan fazlası — özel anahtarı olmayan 0x…dEaD adresinde duruyor. Bu tokenler bir daha asla hareket edemez. Bu, bir belgedeki iddia değil, blok gezgininde canlı duran bir bakiye.',
      },
      {
        q: 'Topluluk nerede?',
        a: 'X: @WhatIFonHOOD, Telegram: t.me/WhatIFonHoodChain. İkisi de aktif ve ikisini de parayı tutan insanlar yürütüyor. Herkes geliştiricidir.',
      },
      {
        q: '$IF bir yatırım mı?',
        a: 'Hayır. İçsel değeri, ekip vaadi ve yol haritası olmayan bir meme coin. Fiyat yükseldiği kadar kolay düşer ve meme coin’lerin çoğu sıfırda biter. Tamamını kaybetmeyi rahatça göze alamayacağın bir miktarı asla koyma.',
      },
    ],
  },

  footer: {
    heading: { lead: 'Ya', accent: 'katılsaydın?' },
    subtitle: 'Grafik orada. Soru burada.',
    buy: '$IF Al',
    telegram: "Telegram'a katıl",
    follow: "X'te takip et",
    chart: 'Grafik',
    canonical: 'Tek resmî site whatifonhood.com. Geri kalan her şey başkasına ait.',
    disclaimer:
      '$IF, içsel değeri olmayan ve finansal getiri beklentisi taşımayan bir meme coin’dir. Buradaki hiçbir şey yatırım tavsiyesi değildir. Kendi araştırmanı yap.',
    builtBy: 'Herkes geliştiricidir.',
  },

  pages: {
    memes: {
      title: 'Kasa',
      heading: { lead: 'Her meme.', accent: 'Çalması serbest.' },
      intro:
        'Her $IF meme’i, tam çözünürlükte, filigransız, atıf gerekmeden. Paylaş, bastır, yeniden karıştır. Zaten bunun için varlar.',
      download: 'İndir',
      all: 'Hepsi',
      searchLabel: 'Meme ara',
      empty: 'Eşleşen bir şey yok. Başka bir kelime dene.',
      count: 'meme',
    },
    brand: {
      title: 'Marka',
      heading: { lead: 'İşaretler', accent: 've kullanımı.' },
      intro:
        'Tek marka, üç işaret: para tokeni, karakter dünyayı, kelime işareti ismi tanımlar. Neye ihtiyacın varsa al.',
      download: 'İndir',
      kitNote:
        'Logolar, avatar, vektör kelime işaretleri, bannerlar, karakter referans sayfası ve şeffaf pozlar — palet, tipografi ve kurallar bir readme dosyasında.',
      rulesTitle: 'Önemli üç şey',
      rules: [
        'Para her zaman kenar çerçevesini korur. Onu para gibi gösteren şey odur.',
        'Kontrat adresini asla bir başlık fontuyla dizme ve asla kısaltma.',
        'Robinhood tüyü kullanılmaz. Yerine “on Robinhood Chain” yaz.',
      ],
    },
    stats: {
      title: 'Veriler',
      heading: { lead: 'Her rakam,', accent: 'canlı.' },
      intro: 'Fiyat, likidite, arz ve yakılanlar — doğrudan Robinhood Chain’den.',
      sourceNote:
        'Fiyat, likidite ve hacim DexScreener’dan; yakılan miktar doğrudan zincirden okunuyor. İkisi de bu sayfayı açtığında yenilenir.',
      poolLabel: 'Ana havuz',
      openExplorer: 'Kontratı aç',
      openChart: 'Grafiği aç',
      timeframes: { day: '24S', week: '7G', month: '30G', all: 'TÜMÜ' },
      chartTypes: { candles: 'Mum', line: 'Çizgi' },
      logScale: 'Log',
      chartTitle: 'Fiyat',
      feedTitle: 'Son işlemler',
      biggestBuy: 'En büyük alım',
      buys: 'Alım',
      sells: 'Satım',
      buyLabel: 'Alım',
      sellLabel: 'Satım',
      viewTx: 'Gör',
      loading: 'Zincir okunuyor…',
      failed: 'Piyasa verisine şu an ulaşılamadı. Yukarıdaki rakamlar son derlemeden geliyor.',
      feedNote: 'IF/WETH havuzundaki en son işlemler.',
      biggestSell: 'En büyük satış',
      windowHours: 'son {hours} saat içinde',
      holdersTitle: 'Sahipler',
      concentration: 'Kimin elinde',
      bands: { top10: 'İlk 10', next20: '11–30', next20More: '31–50', rest: 'Diğer herkes' },
      holdersUpdated: 'yeniden sayıldı',
      pressureTitle: 'Alım ve satım baskısı',
      pressureNote: 'Son bir günün saatlik hacmi. Alımlar yukarı, satımlar aşağı.',
      burnHistoryTitle: 'Her yakım',
      burnHistoryNote: 'Zincirden okundu. Her basamak açabileceğin bir işlem.',
      trustTitle: 'Herkesin yapabileceği kontroller',
      trustNote:
        'Bunları biz değil, üçüncü taraflar doğruluyor. Her biri kendi kontrol edebileceğin yere bağlanıyor.',
      checks: {
        verified: 'Listeleme doğrulandı',
        honeypot: 'Honeypot kontrolü',
        supply: 'Sabit arz, mint fonksiyonu yok',
        burn: 'Yakım adresinin özel anahtarı yok',
      },
      checkPass: 'Geçti',
    },
    machine: {
      title: 'What $IF Makinesi',
      heading: { lead: 'Ya daha önce', accent: 'alsaydın?' },
      intro: 'Kaçırdığın bir coin, bir miktar ve bir tarih seç. Kaçındığın o hesabı makine yapsın.',
      coinLabel: 'Kaçırdığın coin',
      searchPlaceholder: 'Coin ara — bitcoin, doge, pepe…',
      noResults: 'Bu isimde bir şey yok.',
      emptyState: 'Bir coin, bir miktar ve bir ay seç. Gerisini makine yapar.',
      investedLabel: 'Koyduğun',
      worthLabel: 'Bugün ederdi',
      boughtLabel: 'Elinde olurdu',
      entryLabel: 'O günkü fiyat',
      todayLabel: 'Şimdiki fiyat',
      coinCount: 'Her coin işlem görmeye başladığından beri aylık fiyatlarla.',
      amountLabel: 'Koyacağın miktar',
      dateLabel: 'Ne zaman',
      calculate: 'Hesapla',
      resultLead: 'Bugün şu kadar ederdi',
      multiplier: 'kat',
      shareText: (amount, coin, month, value, multiple) =>
        `Ya ${month} tarihinde ${coin} için ${amount} koysaydım?\n\n${value}. ${multiple}.\n\nHâlâ soruyoruz.`,
      verdicts: {
        dodged: 'Bundan yırtmışsın.',
        fine: 'Fena olmazdı.',
        ouch: 'Düşünmemeye çalış.',
        painful: 'Bu hâlâ acıtıyor.',
        unbearable: 'Bunu kimseye anlatma.',
      },
      shareOnX: "X'te paylaş",
      pivot: 'Ya bir sonrakini kaçırmasaydın?',
      pivotCta: '$IF Al',
      disclaimer:
        'Geçmiş fiyatlar üzerinden kaba bir hesap, eğlence amaçlı. Geçmiş fiyatlar hiçbir şeyi öngörmez.',
    },
    pfp: {
      title: 'PFP Üretici',
      heading: { lead: 'Sana ait olan', accent: 'parayı bul.' },
      intro:
        "Üret'e bas, bir $IF parası al, profil fotoğrafın yap. Cüzdan yok, kayıt yok, bağlanacak hiçbir şey yok.",
      subline: 'Dört nadirlik. Her çekiliş ücretsiz.',
      generate: "$IF'imi üret",
      again: 'Tekrar',
      hint: 'Tek dokunuş. Hiçbir şey kendi tarayıcının dışına çıkmaz.',
      tiers: { common: 'Sıradan', uncommon: 'Az bulunur', rare: 'Nadir', legendary: 'Efsanevi' },
      found: (found, total) => `${total} paradan ${found} tanesi bulundu`,
      showPool: 'Tüm paraları göster',
      hidePool: 'Gizle',
      locked: 'Henüz bulunmadı',
      download: 'PNG indir',
      shareCard: 'Kartı paylaş',
      postOnX: "X'te paylaş",
      shareText: (name, tier) => `${name} çektim — ${tier}.\n\nYa bu seninkiyse?`,
      odds: 'olasılık',
      openGenerator: 'Kendi paranı çek',
    },
    notFound: {
      title: 'Sayfa bulunamadı',
      eyebrow: '404',
      heading: { lead: 'Ya bu sayfa', accent: 'hiç var olmadıysa?' },
      intro: 'Olmadı. Burada hiçbir şey taşınmadı — bu adres hiçbir zaman bizim olmadı.',
      tryThese: 'Bunlar gerçekten var',
    },
    meme: {
      intro: 'Tam çözünürlük, filigran yok, kaynak göstermeye gerek yok. Al götür.',
      description: (title, series) =>
        `${title} — ${series} serisinden bir $IF meme. Tam çözünürlük, serbestçe paylaş, kaynak gerekmez.`,
      download: 'İndir',
      postOnX: "X'te paylaş",
      more: 'Serinin devamı:',
      backToVault: 'Kasaya dön',
      shareText: (title) => `${title}\n\nHâlâ soruyoruz.`,
    },
    memeMaker: {
      title: 'Meme Yapıcı',
      heading: { lead: 'Bir tane yap.', accent: 'Paylaş.' },
      intro:
        'Sekiz format, dört poz, senin kelimelerin. Kendi cihazında oluşturulur ve PNG olarak kaydedilir. Hiçbir şey yüklenmez.',
      templateLabel: 'Format',
      poseLabel: 'Poz',
      backdropLabel: 'Arka plan',
      templates: {
        classic: 'Klasik',
        caption: 'Alıntı',
        'this-or-that': 'Bu mu, şu mu',
        statement: 'Manifesto',
        question: 'Soru',
        spotlight: 'Spot ışığı',
        chart: 'Piyasa günü',
        gm: 'gm',
      },
      fields: {
        top: 'Üst satır',
        bottom: 'Alt satır',
        line: 'Senin satırın',
        first: 'Üst panel',
        second: 'Alt panel',
      },
      poses: {
        'arms-crossed': 'Umursamaz',
        facepalm: 'Pişmanlık',
        thinking: 'Düşünüyor',
        victory: 'Zafer',
      },
      backdrops: {
        glow: 'Parıltı',
        void: 'Boşluk',
        grid: 'Izgara',
        spotlight: 'Spot',
        stars: 'Kozmos',
        chart: 'Grafik',
      },
      download: 'PNG İndir',
      share: 'Paylaş',
      shuffle: 'Karıştır',
      saved: 'Kaydedildi. Gönderine ekle.',
      failed: 'Oluşturulamadı. Tekrar dene.',
      shareText: '$IF meme yapıcısıyla yapıldı.\n\nHâlâ soruyoruz.',
      privacy: 'Her şey tarayıcında çiziliyor. Yükleme yok, hesap yok, saklanan hiçbir şey yok.',
      cta: 'Kendin yap',
    },
  },

  common: {
    skipToContent: 'İçeriğe geç',
    externalLink: 'yeni sekmede açılır',
  },
};
