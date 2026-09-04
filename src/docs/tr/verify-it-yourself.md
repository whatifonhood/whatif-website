---
title: Kendiniz doğrulayın
summary: Her sayının arkasındaki tam komutlar; böylece hiçbiri için sözümüze güvenmek zorunda kalmazsınız.
---

Ana sayfa şunu söylüyor: _bir web sitesine güvenmeyin — bu site dahil._ Bu, o sözü uygulanabilir kılan sayfa.

Bu sitedeki her rakam herkese açık, anahtar gerektirmeyen, salt okunur bir çağrıdan geliyor. Aşağıdakilerin hiçbiri için hesap, API anahtarı ya da bizim iznimiz gerekmiyor. Herhangi birini bir terminale yapıştırın.

[Veriler sayfası](/tr/stats/) aynı komutları **Her sayıyı kendiniz kontrol edin** adlı bir panelde taşıyor; bunlar sitenin kendi kullandığı adreslerden üretiliyor — yani site aynı şekilde yanlış olmadan bu komutlar yanlışa kayamaz.

## Arz gerçekten bir milyar mı?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x18160ddd"},"latest"]}'
```

`0x18160ddd`, `totalSupply()` fonksiyonunun seçicisidir. Yanıt onaltılık wei olarak döner — 10^18'e bölün. Tam olarak 1,000,000,000 okumalı.

## Sözleşmeyi hâlâ değiştirebilen biri var mı?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x8da5cb5b"},"latest"]}'
```

`0x8da5cb5b`, `owner()` demektir. Bu çağrı **revert eder** — `execution reverted` — çünkü fonksiyon bu sözleşmede yok.

Bu, sahiplikten feragat edilmiş olmasından daha güçlü bir olgudur. Feragat edilmiş bir sözleşmenin bir sahibi vardı ve bundan vazgeçti; bunun düzgün yapıldığına güvenmek zorundasınız. Bu sözleşmede fonksiyon hiç var olmadı ve bunu az önce kanıtladınız.

## Gerçekte ne kadar yakıldı?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x70a08231000000000000000000000000000000000000000000000000000000000000dEaD"},"latest"]}'
```

`0x70a08231` `balanceOf`'tur; ardından 32 bayta doldurulmuş yakım adresi gelir. Yine onaltılık wei, 10^18'e bölün.

## Fiyat, likidite ve hacim

```
curl -s 'https://api.dexscreener.com/latest/dex/pairs/robinhood/0x39a200271525e9641e799127bdab299daef21953'
```

Fiyat `pairs[0].priceUsd` alanında, likidite `pairs[0].liquidity.usd` alanında, 24 saatlik hacim ise `pairs[0].volume.h24` alanında.

## Sahip sayısı

```
curl -s 'https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1/info'
```

`data.attributes.holders.count` alanında.

## En büyük sahipler

```
curl -s -A 'Mozilla/5.0' 'https://robinhoodchain.blockscout.com/api/v2/tokens/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1/holders'
```

## Lansmanı yapan taraf lansman işleminde gerçekten 11% aldı mı?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt",
       "params":["0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c"]}'
```

O hash lansmanın kendisi. Tek bir işlem, on sekiz log, ve $IF'i var eden her şey bunun içinde oldu. Okunacak log, düğümün döndürdüğü listede 14 numaralı olan (düğüm sıfırdan sayar; birden sayan bir gezgin aynı logu 15 olarak gösterir): token sözleşmesinde bir `Transfer`, `from` havuz `0x39A200271525E9641e799127bdAB299DAeF21953`, `to` deployer `0x84F8E5a324466Deb7447048C014CF0245ce04afA`. `data` alanı 10^18'e bölündüğünde 110,436,131.71 $IF eder; bu da arzın 11.04%'ü ve başka kimse işlem yapamadan atomik olarak satın alınmıştır.

O sırada yürürlükte olan 2% cüzdan üst sınırı geçerli olmadı, çünkü sözleşme deployer'ı ismen muaf tutuyordu. [Lansman](/tr/docs/the-launch/) on sekiz logun geri kalanını tek tek geziyor.

## Deployer'ın elinde hâlâ var mı?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x70a0823100000000000000000000000084F8E5a324466Deb7447048C014CF0245ce04afA"},"latest"]}'
```

Yine `balanceOf`, bu kez deployer'ın adresiyle. Sıfır döndürüyor. Deployer lansmandan sonra bir noktada 674 $IF geri aldı ve onu tekrar başka yere gönderdi; bakiye o zamandan beri sıfır. Bu, tek bir adres hakkında bir olgudur, fazlası değil: sıfır bakiye başka cüzdanların olma ihtimalini dışlamaz ve burada kimse bunları kümelemeye çalışmadı.

## Lansman likidite pozisyonunu kim tutuyor?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt",
       "params":["0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c"]}'
```

Yine lansman makbuzu, bu kez başka bir şey için okunuyor. 7'den 9'a kadarki loglar, `70641` numaralı pozisyon NFT'sinin basıldığı yer. 11 ve 12 numaralı loglar ise onun hareket ettiği yer: NFT'nin NOXA'nın `LaunchLocker`'ına bir `Transfer`'ı ve kilit sözleşmesinin kendi `PositionLocked` olayı. 12 numaralı logun `address` alanı kilit sözleşmesinin adresidir — onu bizden değil zincirden alın, sonra gezginde açın.

Bugün hâlâ sahibi olduğunu doğrulamak için, pozisyon yöneticisine — 7'den 9'a kadarki loglarda NFT'yi çıkaran sözleşmeye — `70641` numaralı token'ın `ownerOf` değerini sorun; bu, onaltılık olarak `0x113f1`. Gezginin read sekmesi bunu terminal olmadan yapar. Pozisyon, oluşturulduğu bloktan bu yana kilit sözleşmesinde duruyor.

## Kilit sözleşmesi onu bir gün bırakabilir mi?

Yayımlanmış olan hiçbir yolla bırakamaz. Kilit sözleşmesini gezginde açın — adres, yukarıdaki lansman makbuzunun 12 numaralı logunda — ve contract sekmesini okuyun. `transferFrom` yok, `safeTransferFrom` yok, `approve` yok, `setApprovalForAll` yok, `decreaseLiquidity` yok, `burn` yok. Pozisyona karşı herhangi birinin çağırabileceği tek şey `collectFees`; o da birikmiş ücretleri alır ve anaparayı olduğu yerde bırakır.

Orada olmayan bir fonksiyon çağrılamaz ve bunu söyleyebilmek güçlü bir şeydir. Aynı zamanda bu kontrolün size verdiğinin sınırıdır. Kilit sözleşmesinin kaynak kodu, token'ınki gibi kısmi eşleşme olarak doğrulanmış; yani okuduğunuz şey, sondaki meta verisi dışında yayına alınan bytecode'a derlenen kaynak koddur. Bu, yayımlanmış ve sizin kontrol ettiğiniz koddur. Bir denetim değildir ve burada kimse denetim yapmadı.

Bu, havuzdaki derinliğin diğer yarısı hakkında hiçbir şey söylemiyor; o yarı sıradan LP ve tek bir blokta çıkabilir. [Likidite ve kilit](/tr/docs/liquidity-and-the-lock/) bu ayrımı veriyor.

## Yakım adresindeki her şey tek bir yerden mi geliyor?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getLogs","params":[{
       "address":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",null,
                 "0x000000000000000000000000000000000000000000000000000000000000dEaD"],
       "fromBlock":"0x3135298","toBlock":"0x3235298"}]}'
```

Bu, yaklaşık bir milyon bloktan oluşan sabit bir pencerede yakım adresine yapılan her `Transfer`'ı ister; bu zincirde söz konusu pencere bir günün biraz üzerindedir. Her sonucun ikinci topic'ini okuyun; gönderen odur. Aranacak adres `0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417` — NOXA'nın ücret sözleşmesi ve yakım adresine bugüne dek yapılan 425 transferin 423'ünün kaynağı. Diğer ikisi sıradan cüzdanlardan gelen tozdur, ikisi toplam 2.84 $IF.

Pencereyi genişletirseniz düğüm yanıt vermek yerine sizi reddeder, bu yüzden tüm geçmişin parçalar hâlinde okunması gerekir. [Veriler sayfası](/tr/stats/) bunu zaten yaptı ve her yakımı işlemine bağlantı vererek listeliyor. [Yakım nasıl işliyor](/tr/docs/how-the-burn-works/) ücret sözleşmesinin ne yaptığını açıklıyor.

## Yakım hâlâ token tarafının 100%'ünü mü alıyor?

Kilit sözleşmesindeki `protocolFeeShare`, bölüşümü belirleyen sayıdır. Onu, bir üstteki bölümdekiyle aynı sözleşme olan kilit sözleşmesinde gezginin read sekmesinden okuyun. `100` döndürüyor.

Bu, kilitli pozisyondan süpürülen $IF'in tamamının protokol tarafına gittiği ve yaratıcının token bacağındaki zincir üstü payının sıfır olduğu anlamına geliyor. Ücret sözleşmesinin sonrasında bununla ne yaptığı — ki 12 Temmuz 2026'dan bu yana bunun her token'ını yakmak olmuştur — o sözleşmenin kendi davranışıdır ve bu sayı onu sabitlemez. Ücret sözleşmesinin kaynak kodu hiç yayımlanmadı, dolayısıyla o adım hiçbir şekilde okunamaz. Yalnızca izlenebilir.

Bunu bir okuma olarak alın, bir söz olarak değil. Kilit sözleşmesinin sahibi bu sayıyı değiştirebilir ve protokol tarafının ödendiği adresi de kimseye sormadan değiştirebilir. İkisinden biri değişirse, bunu ilk burada görürsünüz.

## Bir sayı uyuşmuyorsa

O zaman site yanlıştır ve bunu bilmek isteriz. Doğruluğun kaynağı zincirdir; bu web sitesi onun üzerine serilmiş bir kolaylıktır.
