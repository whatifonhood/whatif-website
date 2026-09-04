---
title: Üzerinde çalıştığı zincir
summary: Robinhood Chain nedir, ne için kuruldu ve $IF'in kendi sayılarını, siz onları öğrenene kadar yanlış gösteren iki tuhaflık.
---

$IF, zincirini anlamlı hiçbir biçimde seçmedi. Bir launchpad tarafından, o launchpad'in çalıştığı ağın üzerinde basıldı. Ama neyi kontrol edebileceğinize, hangi araçların size bakiyenizi göstereceğine ve bu teknik dokümandaki iki sayının nasıl okunması gerektiğine zincir karar veriyor. Bu yüzden tam olarak tarif etmeye değer.

## Robinhood Chain nedir

Robinhood Chain, Robinhood'un Offchain Labs ile birlikte Arbitrum yığını üzerine kurduğu, Ethereum'a mutabakat veren bir Ethereum layer 2 ağı. Açık ana ağ, 200 milyondan fazla işlem işlemiş bir test ağının ardından, Robinhood'un Londra'daki "The World is Flat" sunumunda duyurularak 1 Temmuz 2026 tarihinde açıldı.

Arbitrum Expansion Program lisansı altında çalışıyor; bu lisans protokolün net gelirinin 10% kadarını Arbitrum'a yönlendiriyor: 8% ArbitrumDAO'ya, 2% Developer Guild'e.

Robinhood'un kurduğu bir zincir üzerinde çalışmak, Robinhood ile bir ilişki demek değil. Burası açık bir ağ. Herkes buraya sözleşme yayına alabilir; bir launchpad de aldı.

## Ona bağlanmak için gereken bilgiler

| Alan         | Değer                                                          |
| ------------ | -------------------------------------------------------------- |
| Chain ID     | `4663` (`0x1237`)                                              |
| Gaz token'ı  | ETH, 2 Eylül 2026 anlık görüntüsünde temel ücret `0.366` gwei  |
| Blok süresi  | ölçülen `101.3` ms, `10,134` saniyede `100,000` blok üzerinden |
| RPC          | `https://rpc.mainnet.chain.robinhood.com`                      |
| Blok gezgini | `https://robinhoodchain.blockscout.com`                        |

Akılda tutulması gereken şey blok süresi. Bloklar saniyede kabaca on kez geliyor; aşağıdaki ilk tuhaflığı bariz olmaktan çıkarıp kafa karıştırıcı yapan da bu.

## Zincir ne için kuruldu ve ortaya ne çıktı

Tasarım hedefi tokenlaştırılmış gerçek dünya varlıklarıydı: tokenlaştırılmış borçlanma araçları olarak yeniden yapılandırılmış Stock Tokens, kendine ait bir Uniswap AMM'si, borç verme için Morpho ve dolar ayağı olarak Paxos'un ihraç ettiği USDG.

İlk gelen ise meme coin'ler oldu. CoinDesk bu farkı Temmuz ayında ölçtü; o sırada zincirdeki tokenlaştırılmış gerçek dünya varlıkları yaklaşık $12.66M değerindeydi ve tek başına CASHCAT meme coin'i bunun kabaca on iki katında zirve yapmıştı.

$IF, bu farkın meme coin tarafında. Bu teknik doküman onu altyapı diye tarif edecek değil.

## Herhangi bir şeyi kontrol etmeden önce bilinmeye değer iki tuhaflık

Bunların ikisi de dürüst veriyi hata gibi gösteriyor. Zincire kendiniz bakıp yanlış görünen bir sayı bulursanız, muhtemelen bu ikisinden biridir.

### `block.number` bir Ethereum yüksekliği döndürüyor

Bu zincirdeki bir sözleşmenin içinde `block.number`, L2 yüksekliğini değil, bir Ethereum L1 blok yüksekliğini döndürür.

$IF token'ı lansman bloğunu `25,507,001` olarak kaydediyor. Onu başlatan işlem ise aslında `6,657,668` numaralı L2 bloğundaydı. İki rakam da hatalı değil. Farklı zincirleri sayıyorlar.

Bunun sonucu şu: token'ın "blok cinsinden" ifade ettiği her aralık, yaklaşık onda bir saniyelik L2 blokları değil, yaklaşık on iki saniyelik L1 bloklarıdır. Token'ın lansman kısıtlaması `366` blok olarak ayarlanmıştı; bu da yaklaşık 73 dakika ediyor. L2 bloğu olarak okunursa saniyeler meselesi olurdu ve kısıtlamanın neredeyse hiç var olmadığı sonucuna varırdınız. Var oldu ve [Lansman](/tr/docs/the-launch/), yürürlükteyken tam olarak neyi kısıtladığını ortaya koyuyor.

### En büyük sahiplerden birkaçı sözleşme değil, cüzdan

En büyük $IF sahiplerinden bazıları blok gezgininde "sözleşme" olarak okunuyor. Onlar insan. EIP-7702 ile yetki devretmiş cüzdanlar, yani kendilerini akıllı cüzdan koduna yönlendirmiş sıradan hesaplar: Alchemy'den `SemiModularAccount7702`, Uniswap'ten `CaliburEntry`, `CoinbaseSmartWallet`.

Bu, belirli tek bir şey için önemli. Yoğunlaşma analizi onları insan olarak saymalı, çünkü öyleler. Onları protokol sözleşmesi ya da bir tür hazine gibi ele almak, dağılımı olduğundan daha düzenli gösterme yönünde yanlış aktarır. [Sahip tablosu](/tr/stats/) her satırı kendi adresine bağlıyor; böylece yanındaki kelimeye güvenmek yerine birini açıp ne olduğunu görebilirsiniz.

## Yeni bir zincirin dürüst sonucu

Daha yeni bir zincir, onu destekleyen aracın daha az olması demek. Bazı portföy takip araçları $IF bakiyenizi göstermeyecek, bazı blok gezginleri adresi çözümlemeyecek, bazı cüzdanlarda ağı elle eklemek gerekecek. Bu bir komplo değil, gerçek bir zahmet ve [Token](/tr/docs/the-token/) sayfasında değinilen nokta da aynı.

Bunun daha keskin bir versiyonu da var. Daha az araç, aynı zamanda bakan bağımsız kişinin daha az olması demek; bu sitenin rakamlarını doğrudan zincirden okumasının ve her birini geldiği işleme bağlamasının sebeplerinden biri de bu. [Veriler sayfası](/tr/stats/) bunun vardığı yer.

## Bu sayfanın size söylemedikleri

Zinciri tarif ediyor. Ona kefil olmuyor.

Bir L2'nin güvenliği kendi sequencer'ına ve köprüsüne dayanır; bu teknik doküman için ikisi de incelenmedi. Buradaki hiçbir şey Robinhood Chain'in güvenli, merkeziyetsiz ya da kalıcı olduğu anlamına gelmiyor. Buradaki, zincirin ne olduğuna, ölçümlerinin ne çıktığına ve bunu kendiniz nereden okuyabileceğinize dair bir ifade.
