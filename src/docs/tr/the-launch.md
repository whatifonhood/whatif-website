---
title: Lansman ve lansmanı yapan
summary: Tek bir işlem; token'ı, havuzu, kilidi ve onu gönderen kişi için 11%'lik bir alımı yarattı.
---

$IF, 11 Temmuz 2026 tarihli tek bir işlemle başladı. O işlem arzı mint etti, havuzu oluşturdu, lansman likidite pozisyonunu kilitledi ve kendisini gönderen adrese token'ların 11%'inden biraz fazlasını verdi; hepsi atomik olarak. Bu sayfa onu sırayla geri okuyor, çünkü bir şüphecinin ilk kontrol etmesi gereken kayıt parçası budur ve gösterdiklerinin bir kısmı iç açıcı değildir.

## What $IF için kimse sözleşme yazmadı

$IF özel yazılmış bir kod değil. NOXA'nın hazır `LaunchToken`'ı: `_update` fonksiyonuna kısa bir lansman kısıtlaması bloğu cıvatalanmış bir OpenZeppelin ERC-20. Aynı bytecode bu zincirdeki on binlerce token'ın arkasında duruyor. Bunu bir fabrika kalıptan çıkardı.

Bunun iki yönü var ve iki yarısı da söylenmeye değer. Bir geliştirme ekibi yoktu ve token'da özel ya da zekice hiçbir şey yok. Aynı zamanda sözleşmenin bu kadar temiz olmasının sebebi de bu. `LaunchToken`'ın sahibi yok, rolleri yok, proxy'si ve yükseltme yolu yok, constructor dışında mint yok, yakma fonksiyonu yok ve hiç vergi mantığı yok. İçine kimse bir şey saklamadı, çünkü onu kimse yazmıyordu.

`0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1` adresindeki kaynak kod **kısmi eşleşme**, 14 Temmuz 2026 tarihinde Sourcify üzerinden değil eth-bytecode-db üzerinden doğrulandı. Onu yayına alan fabrika ise hiç doğrulanmamış. NOXA o derlemeyi hiçbir zaman yayımlamadı. Bu, $IF hakkında değil NOXA hakkında bir gerçek ve geçiştirilmek yerine böyle söylenmeli.

## Tek işlem, on sekiz log

`0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c`

11 Temmuz 2026, 04:32:42 UTC, L2 bloğu `6,657,668`, 6,994,056 gaz. Çağrıyı yapan, NOXA fabrikasına 0.1705 ETH gönderdi ve tek bir atomik adımda bir token, bir havuz, kilitli bir LP pozisyonu ve arzın 11%'ini geri aldı.

İçinde sırayla olanlar:

1. 1,000,000,000 IF'in tamamı fabrikaya mint edildi.
2. 1% ücret kademesinde, `0x39A200271525E9641e799127bdAB299DAeF21953` adresinde bir IF/WETH havuzu oluşturuldu.
3. Havuz `204200` tick'inde başlatıldı — aralığın tam tepesi, yani 100% IF tutarak ve hiç WETH tutmadan açıldı.
4. Arzın tamamı, `[-887200, 204200]` tick aralığında tek taraflı likidite olarak havuza aktarıldı.
5. O likidite için `70641` numaralı pozisyon NFT'si oluşturuldu.
6. `70641` numaralı NFT, `PositionLocked` yayan NOXA `LaunchLocker`'a aktarıldı.
7. Arzın 11.044%'ü olan `110,436,131.713888332` IF, havuzdan deployer'a aktarıldı.
8. 0.17 ETH sarmalandı ve `SwapRouter02` üzerinden takas edildi — atomik ilk alım.

### 0.17 ETH neden arzın 11%'ini aldı

Çünkü havuz, pozisyonun aralığının tepesinde başlatıldı. Uniswap V3'te bu, tamamı token, hiç ETH yok ve sıfıra yakın bir açılış fiyatı demektir. İlk alıcı neredeyse dikey bir eğri üzerinde yürür, dolayısıyla küçük bir miktar ETH arzın büyük bir payını alır.

Bu, NOXA'nın lansman tasarımının amaçlanan mekaniğidir, bir istismar değil. Aynı zamanda şu da doğru: lansmanı yapanın giriş fiyatı, bir blok sonra gelen hiç kimse için yapısal olarak erişilebilir değildi. Bu ikisi aynı anda geçerli ve bu sayfanın size yalnızca birini söyleyen bir versiyonunu kabul etmemelisiniz.

## Lansman kısıtlamaları, tam olarak

Constructor üç sınır belirledi ve bunların hiçbiri bugün ayakta değil.

- **Maksimum cüzdan 2%.** `maxWalletBps` 200'dü, yani 20,000,000 IF, ve fabrika, deployer ve havuz dışında herkese uygulanıyordu.
- **İşlem başına üst sınır: pratikte yok.** `maxTxBps` 10000 olarak ayarlanmıştı, bu da arzın 100%'ü. Alımlar `tx.origin` başına bunun 110%'una karşı izleniyordu, yani 1.1 milyar token'lık bir tavan. Devreye giremezdi.
- **Lansman bloğu kapalıydı.** Lansman bloğunun kendisinde, lansman fabrikası ve deployer dışında havuzdan yapılan her alım revert etti.

`restrictionBlocks` 366'ydı ve bunlar zincirin 101 ms'lik L2 blokları değil, yaklaşık on iki saniyelik L1 bloklarıdır. Hepsi 11 Temmuz 2026 tarihinde 05:45 UTC civarında kalıcı olarak sona erdi. Bugün token'da hiç kimse için artık bir ayrıcalık yok.

## 110.44M'a ne oldu

`0x84F8E5a324466Deb7447048C014CF0245ce04afA` adresindeki deployer, 04:32:42'de `110,436,131.71` IF aldı ve bunun her bir token'ını yaklaşık altmış saniye içinde, beş işlemde, hepsi aynı router üzerinden ve hepsi token'ların az önce geldiği havuza geri olacak şekilde sattı.

| Satış      | Çıkan IF           | Pay      | Alınan WETH  |
| ---------- | ------------------ | -------- | ------------ |
| 1          | 55,218,065.86      | 50.0%    | 0.233739     |
| 2          | 13,804,516.46      | 12.5%    | 0.049099     |
| 3          | 10,353,387.35      | 9.4%     | 0.040792     |
| 4          | 15,530,081.02      | 14.1%    | 0.059348     |
| 5          | 15,530,081.02      | 14.1%    | 0.056404     |
| **Toplam** | **110,436,131.71** | **100%** | **0.439381** |

Maliyet 0.17 ETH artı 0.0005 ETH lansman ücretiydi. Gelir 0.439381 WETH'ti. Net olarak bu snipe yaklaşık 0.269 ETH kazandırdı — bu rakamların okunduğu gün, 2 Eylül 2026, ETH fiyatıyla kabaca $640.

Bu sayı, hikâyenin şeklinin ima ettiğinden küçüktür ve doğru olanı da budur. Deployer daha sonraki bir noktada 674 IF geri aldı ve onu başka yere gönderdi. Bakiye o zamandan beri sıfır. Bu adres, NOXA fabrikasında şimdiye dek tam olarak bir token çıkardı.

## Daha büyük olan sayı

Dürüst başlık snipe değil. Ücret akışı.

NOXA'nın ücret sözleşmesi, $IF'in işlem ücretleri üzerinden `0x84F8E5a324466Deb7447048C014CF0245ce04afA` adresine yaratıcı kazancı olarak **18.2300 WETH** ödedi; aynı 2 Eylül okumasıyla yaklaşık $43,500. Lansmanı yapan orijinal tarafın bu projeden çıkardığı şey budur ve bu, token üzerinden değil, launchpad'in tesisatı üzerinden geldi. [Yakım nasıl işliyor](/tr/docs/how-the-burn-works/) aynı ücret akışını anlatıyor, çünkü yakılan şey bunun IF tarafı.

## Hangi cümleler bunu atlatamaz

Bunun gibi $IF lansmanları hakkında dört şey söylenir ve burada hiçbiri savunulabilir değil.

- "İçeriden kimse yok."
- "Deployer hiç token tutmadı."
- "Herkesin lansmana erişimi birebir aynıydı."
- "Dev cüzdanı yok."

Doğru versiyon tek cümle: lansmanı yapan, sözleşmenin cüzdan üst sınırından açıkça muaf tuttuğu 11.04%'lük atomik bir alım yaptı, tamamını bir dakika içinde yaklaşık 0.27 ETH kazançla sattı, o zamandan beri hiçbir şey tutmadı ve launchpad yaratıcı ücretleri olarak kabaca 18.2 WETH ödeme aldı.

Bunların hepsi lansman için doğru. Site, araçlar ve sosyal hesaplar sonradan, orijinal geliştirici gittikten sonra ortaya çıktıklarını söyleyen kişiler tarafından kuruldu. Bu, kimin kim olduğuna dair bir iddia ve zincir bunu çözmüyor. Zincirin söylediği daha dar: bu deployer hiçbir şey tutmuyor ve başka bir token hiç çıkarmadı. Sıfır bakiye ilişkili cüzdanların olmadığını göstermez ve kimse bunları kümelemeye kalkışmadı. Lansmanı verili, ayrışmayı ise kanıtlanmamış kabul edin. [İddia etmediklerimiz](/tr/docs/what-we-do-not-claim/) eksik cümlelerin geri kalanının yaşadığı yer.
