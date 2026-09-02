---
title: Referans
summary: Adresler, bağlantılar ve bu teknik dokümanın kullandığı kelimeler.
---

Kopyalamak ve kontrol etmek için her şey tek sayfada.

## Adresler

| Ne                             | Adres                                        |
| ------------------------------ | -------------------------------------------- |
| $IF sözleşmesi                 | `0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1` |
| IF/WETH havuzu, Uniswap V3, 1% | `0x39A200271525E9641e799127bdAB299DAeF21953` |
| Yakım adresi                   | `0x000000000000000000000000000000000000dEaD` |

Önemli olan sözleşme adresidir. Bir şey satın almadan önce son altı karakteri bu sayfayla ya da blok gezginiyle karşılaştırın — bkz. [Nasıl alınır](/tr/docs/how-to-buy/).

IF/WETH 1% havuzu ana havuzdur — lansman işleminde oluşturuldu ve kilitli pozisyonun içinde durduğu havuz o. Tek havuz değil; geri kalanlar [Likidite ve kilit](/tr/docs/liquidity-and-the-lock/) sayfasında listeleniyor.

## Lansman ve kilit

| Ne                          | Değer                                                                         |
| --------------------------- | ----------------------------------------------------------------------------- |
| Lansman işlemi              | `0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c`          |
| Lansman bloğu, L2           | `6657668`, 11 July 2026, 04:32:42 UTC                                         |
| Lansman likidite pozisyonu  | Uniswap V3 NFT `70641`, tick'ler `[-887200, 204200]`                          |
| `70641` NFT'sini tutan      | NOXA'nın `LaunchLocker`'ı, lansman işleminin 11 ve 12 numaralı loglarına göre |
| Deployer, lansmanı gönderen | `0x84F8E5a324466Deb7447048C014CF0245ce04afA`                                  |

Kalıcı olarak kilitli olan pozisyon `70641`'dir. [Lansman](/tr/docs/the-launch/) işlemi log log okuyor; [Likidite ve kilit](/tr/docs/liquidity-and-the-lock/) kilidin neyi kapsayıp neyi kapsamadığını söylüyor.

## NOXA'nın sözleşmeleri

NOXA, token'ı basan ve yakımı hâlâ işleten launchpad'dir. Bu adresleri kimin kontrol ettiği, incelediğimiz hiçbir kaynakta ortaya konmuş değil: kilit sözleşmesinin sahibi sıradan bir cüzdan, ücret sözleşmesi ise onun yayına aldığı doğrulanmamış bytecode.

| Ne                                                                           | Adres                                        |
| ---------------------------------------------------------------------------- | -------------------------------------------- |
| Her yakımın geldiği ücret sözleşmesi                                         | `0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417` |
| Orijinal ücret cüzdanı, 11–12 July 2026 tarihlerinde 20%'lik $IF payını aldı | `0x71f2F1c2dc94cDaBFE29Cb355119f8683AE0969b` |
| `LaunchLocker`'ın sahibi                                                     | `0x7E035Fb048a31e0481b88074557415b1C187242B` |

[Yakım nasıl işliyor](/tr/docs/how-the-burn-works/) bunların her birinin mekanizmadaki işini açıklıyor.

## Token

|                     |                               |
| ------------------- | ----------------------------- |
| Ad, zincir üzerinde | `What If`                     |
| Sembol              | `IF`                          |
| Zincir              | Robinhood Chain               |
| Standart            | ERC-20                        |
| Toplam arz          | 1,000,000,000, sabit          |
| Ondalık basamak     | 18                            |
| Sözleşme adı        | `LaunchToken`                 |
| Derleyici           | Solidity 0.8.30               |
| Sahiplik fonksiyonu | yok — `owner()` revert ediyor |

Sözleşmenin kendi `name` ve `symbol` değerleri `What If` ve `IF`. Bu teknik doküman onları What $IF ve $IF olarak yazıyor; bu, farklı bir token değil, ticker yazım alışkanlığıdır. Blok gezgini size ilk çifti gösterir.

## Zincir

|                  |                                           |
| ---------------- | ----------------------------------------- |
| Ağ               | Robinhood Chain                           |
| Chain ID         | `4663` (`0x1237`)                         |
| Gaz token'ı      | ETH                                       |
| Herkese açık RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Blok gezgini     | `https://robinhoodchain.blockscout.com`   |

[Kendiniz doğrulayın](/tr/docs/verify-it-yourself/) o RPC'ye karşı yapabileceğiniz çağrıları gösteriyor; [Zincir](/tr/docs/the-chain/) bir L2 üzerinde çalışmanın sizin için ne anlama geldiğini ele alıyor.

## Nereye bakmalı

- **Blok gezgini** — [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com/token/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1)
- **Alım satım** — [Uniswap](https://app.uniswap.org/swap?outputCurrency=0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1&chain=robinhood)
- **Grafikler** — [DexScreener](https://dexscreener.com/robinhood/0x39a200271525e9641e799127bdab299daef21953)
- **Bu site** — [whatifonhood.com](https://whatifonhood.com)

## Bize ait olan tek hesaplar

- **X** — [@WhatIFonHOOD](https://x.com/WhatIFonHOOD)
- **Telegram** — [t.me/WhatIFonHoodChain](https://t.me/WhatIFonHoodChain)

Bunların dışındaki hiçbir şey biz değiliz. Size asla önce biz DM atmayız, asla kurtarma ifadesi istemeyiz ve asla cüzdan bağlamanızı istemeyiz.

## Sözlük

**Yakım** — token'ları kimsenin harcama yapamayacağı bir adrese göndererek dolaşımdan kalıcı olarak çıkarmak.

**Sözleşme adresi** — token'ın zincir üzerindeki benzersiz kimliği. Gerçek bir token'ı aynı ada sahip bir kopyadan ayırmanın tek güvenilir yolu.

**Gaz** — bir işlemin bloğa dahil edilmesi için zincirin yerel token'ıyla ödenen ücret. O olmadan hiçbir şey gerçekleşmez.

**Likidite havuzu** — insanların karşılığında işlem yaptığı, iki token tutan bir sözleşme. Alıp satabilmenizi sağlayan şey onun bakiyesidir.

**Piyasa değeri** — fiyat çarpı arz. Türetilmiş bir rakam; herhangi bir yerde var olan para değil.

**Kurtarma ifadesi** — cüzdanınız _olan_ kelimeler. Onları elinde tutan herkes içindeki her şeyin sahibi olur.

**Kendi kendine saklama** — kendi anahtarlarınızı tutmak; hiçbir şirketin herhangi bir şeyi dondurma, geri alma ya da geri getirme imkânı olmadan.

**Fiyat kayması** — gördüğünüz fiyat ile aldığınız fiyat arasındaki fark; işleminiz gerçekleşirken piyasanın hareket etmesinden kaynaklanır.

**Toplam arz** — var olan bütün token'lar. Burada sabittir ve tek bir çağrıyla kontrol edilebilir.

## Bu teknik dokümanı çevrimdışı okumak

Her sayfa düz HTML'dir ve okunması için betik gerekmez. İstediğinizi yazdırın ya da kaydedin; hiçbir şey bir giriş duvarının arkasında değil ve hiçbir şey üçüncü bir taraftan yüklenmiyor.
