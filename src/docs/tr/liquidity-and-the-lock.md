---
title: Likidite ve gerçekte kilitli olan şey
summary: Ana havuzdaki bir pozisyon hiç kimse tarafından çekilemez; derinliğin diğer yarısı tek bir blokta çıkıp gidebilir.
---

$IF, token'ı oluşturan işlemin aynısında launchpad tarafından oluşturulmuş bir Uniswap V3 havuzunda işlem görüyor. O havuzdaki bir pozisyon, kimsenin geri alamayacağı biçimde kilitli. Derinliğin geri kalanı değil. Bu sayfa ikisini birbirinden ayırıyor, çünkü birisi "likidite kilitli" dediğinde bu ifadenin genellikle yaptığı işin tamamı o farktan ibarettir.

Aşağıdaki her rakam, 2 September 2026 tarihinde, yaklaşık `52,582,784` numaralı blokta zincirden okundu. Havuz bakiyeleri değişir. Kilit değişmez.

## Lansman pozisyonu

Ana havuz `0x39A200271525E9641e799127bdAB299DAeF21953`; 1% ücret kademesinde, WETH karşısında IF.

Lansmanda arzın tamamı, `[-887200, 204200]` tick aralığını kaplayan tek bir Uniswap V3 pozisyonu olarak o havuza girdi; bu, protokolün izin verdiği tam aralığa neredeyse eşit. `70641` numaralı pozisyon NFT'si, kendisini basan işlemin aynısında NOXA'nın `LaunchLocker` sözleşmesine aktarıldı; [Lansman](/tr/docs/the-launch/) sayfası o işlemi log log okuyor.

NFT şimdi o sözleşmede duruyor ve sözleşmenin yayımlanmış ABI'sinde onu elden çıkarmanın hiçbir yolu yok. Transfer yok. Approve yok. `decreaseLiquidity` yok. Yakma yok. Pozisyona karşı herhangi birinin çağırabileceği tek şey `collectFees`; o da birikmiş işlem ücretlerini süpürür ve anaparayı tam olarak olduğu yerde bırakır. [Yakım nasıl işliyor](/tr/docs/how-the-burn-works/) sayfası bu ücretlerin izini vardıkları yere kadar sürüyor.

Yani bu yarı, tam gücüyle söylenmeyi hak ediyor: **lansman pozisyonu kalıcı olarak kilitlidir ve buna NOXA'ya karşı kilitli olmak da dahildir.** Zaman kilidi değil, hak ediş programı değil, birinin verdiği bir taahhüt değil. Çağrılacak bir fonksiyon yok.

Bunu yumuşatan iki şey var ve ikisi de kilitle değil, yayımlayanla ilgili. Kilit sözleşmesinin gezgindeki doğrulanmış kaynağı tam eşleşme değil kısmi eşleşmedir, dolayısıyla okunan şey, gezginin eşleştirebildiği kısımlarda yayına alınan bytecode ile örtüşen bir kaynaktır. Ve kilit sözleşmesinin sıradan bir cüzdan olan sahibi, toplanan ücretlerin nereye gideceğini hâlâ yönlendirebiliyor. Pozisyonun kendisini hareket ettiremez, küçültemez ya da çözemez.

## Kilidin kapsamadıkları

Düzeltme şurada ve yukarıdaki iyi haberden daha çok önem taşıyor.

Anlık görüntü sırasında ana havuzun aktif likiditesi `71,612,362,060,397,110,157,213` idi; bunun `36,819,258,015,569,838,458,222` kadarını `70641` numaralı pozisyon sağlıyordu. Aktif likidite, mevcut fiyatta ne kadar derinlik bulunduğunu gösteren, Uniswap'in kendi birimidir. Dolar cinsinden bir rakam değildir ve akılda tutmaya değen kısım orandır:

- Ana havuzun aktif likiditesinin **51.4%**'ü kalıcı olarak kilitli lansman pozisyonudur.
- **48.6%**'sı, sıradan cüzdanların sahip olduğu sıradan Uniswap pozisyonlarıdır.

Açıkça söylemek gerekirse: karşısında işlem yaptığınız derinliğin kabaca yarısı, onu tek bir blokta, haber vermeden ve kimseye sormadan geri çekebilecek kişilerce oraya kondu. Çekmeyeceklerine dair hiçbir zaman söz vermediler. Çekerlerse, satışınızın fiyat etkisi anında kötüleşir ve piyasayı ayakta tutmak üzere geriye kilitli yarı kalır.

Bu normaldir. Yalnızca DEX'te işlem gören bir token üçüncü taraf likidite sağlayıcılarını çeker ve üçüncü taraf likidite sağlayıcıları, ücretler buna değmez hale geldiğinde çıkar gider. Ama bir perakende okurun "likidite kilitli" sözcüklerinden anladığı şey bu değildir; bu site de o yüzden bu sözcükleri kullanmıyor. Buradaki ifade **"lansman pozisyonu kalıcı olarak kilitlidir"** ve tam olarak kanıt kadar dar olsun diye seçildi.

## Yedi havuz

$IF'in yedi canlı havuzda likiditesi var; hepsi birlikte yaklaşık $446,000 tutuyor. Bunun yaklaşık 85%'i ana havuzda duruyor.

| Havuz              | Likidite | 24s hacim | Oluşturulma |
| ------------------ | -------- | --------- | ----------- |
| Uniswap V3 IF/WETH | $378,958 | $387,004  | 11 Jul 2026 |
| Uniswap V3 IF/USDG | $56,782  | $201,745  | 6 Aug 2026  |
| Uniswap V4 IF/ETH  | $6,811   | $21,545   | 31 Aug 2026 |
| Uniswap V4 IF/USDG | $3,433   | $481      | 23 Jul 2026 |
| Giga IF/USDG       | $231     | $956      | 28 Aug 2026 |
| Uniswap V4 IF/ETH  | $56      | $42       | 28 Aug 2026 |
| Uniswap V4 IF/ETH  | $8       | $4        | 27 Aug 2026 |

İlginç olan ikinci satır. Uniswap V3 üzerindeki IF/USDG havuzu 6 August tarihinde launchpad dışında biri tarafından oluşturuldu ve şimdi tüm $IF hacminin yaklaşık üçte birini, Robinhood Chain'in kendi dolar stablecoin'i karşısında taşıyor. Bunun hiçbiri kilitli değil. Kelimenin tam anlamıyla topluluk likiditesi: bir kişi onu oraya koymayı seçti ve çıkarmayı da seçebilir.

Kilit, tek bir havuzdaki tek bir pozisyonu kapsıyor. Diğer altısıyla hiçbir ilgisi yok.

## Protokol ücreti kesintisi

Ana havuzla ilgili, gözden kaçması kolay ve kontrolü kolay bir ayrıntı. Uniswap'in protokol ücreti orada açık. `slot0.feeProtocol` değeri `102` okunuyor; bu, 1% takas ücretinin altıda birinin her işlemin iki tarafında da, likidite sağlayıcıları ondan hiçbir şey görmeden kesildiği ve pozisyonlara değil V3 fabrikasının sahibine gittiği anlamına geliyor.

Anlık görüntü sırasında bu birikimde `0.0028` WETH ve `2,314` IF vardı.

Bu tutarlar bugün önemsiz ve bunlardan söz etme nedeni büyüklükleri değil. Neden şu: kesintinin IF tarafı, kilitli pozisyonun hiçbir zaman kazanmadığı ve dolayısıyla hiçbir zaman yakmadığı bir ücret geliridir. Yakımı besleyen şey, protokol altıda birini aldıktan sonra pozisyona ulaşan kısımdır.

## Bununla ne yapmalı

Yukarıdaki paragrafa inanmak yerine kendiniz kontrol edin. Pozisyon ID'si, havuz adresi ve tick aralığı bu sayfada duruyor ve her biri blok gezgininde karşılığını buluyor.

Sonra [Riskler](/tr/docs/risks/) sayfasını okuyun; orada satış tarafındaki sonuç yumuşatılmadan söyleniyor: işlem görebilir derinliğin kabaca yarısı her an çıkıp gidebilir ve ince piyasalar iki yönde de sert hareket eder.
