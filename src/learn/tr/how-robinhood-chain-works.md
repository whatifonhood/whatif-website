---
title: Robinhood Chain nasıl çalışır
summary: Zincirin ne olduğu, üzerine nasıl ETH aktarılacağı ve insanların nerede takıldığı.
category: basics
order: 4
updated: 2026-08-31
---

Robinhood Chain, Ethereum uyumlu bir ağdır. Daha önce herhangi bir EVM zinciri kullandıysanız buradaki her şey tanıdık gelecek: aynı adres biçimi, aynı cüzdanlar, aynı türden işlemler. Farklı olan hız, maliyet ve fonları buraya nasıl aktardığınızdır.

## Parametreler

Herhangi bir EVM cüzdanı bu ağa yönlendirilebilir. Değerler herkese açıktır ve bu sitenin her yerde kullandığı değerlerle aynıdır:

- **Ağ adı** — Robinhood Chain
- **Zincir kimliği** — 4663
- **Para birimi** — ETH
- **RPC** — `https://rpc.mainnet.chain.robinhood.com`
- **Gezgin** — `https://robinhoodchain.blockscout.com`

Çoğu cüzdan, ağı kullanan bir siteyi ilk ziyaret ettiğinizde ağı otomatik olarak eklemeyi önerir. Bu değerlerden yola çıkarak elle de ekleyebilirsiniz.

## ETH'i buraya aktarmak

Neredeyse herkesin ilk seferde takıldığı yer burasıdır ve karışıklık hep aynıdır: **Ethereum ana ağındaki ETH, Robinhood Chain üzerindeki ETH değildir.** Bunlar ayrı defterlerdir. Doğru adrese yanlış ağdan göndermek, burada yapılabilecek en pahalı tek hatadır.

En basit yol, Robinhood uygulamasından ETH çekmek ve ağ olarak Robinhood Chain'i seçmektir. ETH'iniz başka bir yerdeyse, Robinhood zincire ulaşan köprü yollarını belgeliyor.

Hangi yoldan gelirseniz gelin: önce küçük bir test tutarı gönderin, ulaştığını doğrulayın, sonra kalanını gönderin.

## Ücretler

Bloklar hızlı ve ücretler küçüktür — bir işlemin maliyetini gas değil, borsanın kendi ücretinin belirleyeceği kadar küçük. Bu hoş bir durum ve bilinmeye değer tek bir sonucu var: ucuz işlemler spam yapmayı da ucuzlatır; bu yüzden çok sayıda sahibi ya da çok sayıda işlemi varmış gibi görünen bir token, burada pahalı bir zincirde ifade edeceğinden daha azını ifade eder.

Cüzdanda her zaman biraz ETH bırakın. Tokenlar onsuz taşınamaz.

## Gezgini okumak

Bu zincirde bir token hakkında size söylenen her şey için doğruluk kaynağı Blockscout'tur. Sözleşmeyi arayabilir, tam sahip listesini görebilir ve doğrulanmışsa kodu okuyabilirsiniz.

Bu sitedeki her şey oraya geri bağlanır. [Veriler sayfası](/tr/stats/) zincirden canlı olarak okunan rakamları gösterir ve her birinin yanında, aynı şeyi kendiniz kontrol edebilmeniz için bir bağlantı vardır. $IF hakkındaki bir iddia orada yeniden üretilemiyorsa, ona inanılmamalıdır — burada yapılan bir iddia da dahil.
