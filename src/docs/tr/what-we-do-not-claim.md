---
title: İddia etmediklerimiz
summary: Burada görmeyi bekleyeceğiniz cümleler ve her birinin neden eksik olduğu.
snapshot: '2026-09-02'
---

Bu teknik dokümanın büyük bölümü $IF'in ne olduğuyla ilgili. Bu sayfa ise onun negatif alanı, çünkü bu piyasada bir projenin yapmaktan kaçındığı iddialar, yaptıklarından daha çok şey anlatır.

Aşağıdaki her madde, yazabileceğimiz, coin'e yarayacak ve yazmadığımız bir şey — ya kanıtlayamadığımız için ya da zincir bunun doğru olmadığını söylediği için.

## "Likidite kilitli"

Düz bir ifade olarak yok; yerine kanıtlayabildiğimiz daha dar hâli konuldu.

Bu teknik dokümanın iddia ettiği şu: lansman pozisyonu kalıcı olarak kilitlidir. O pozisyon, `70641` numaralı Uniswap V3 pozisyon NFT'sidir, NOXA'nın `LaunchLocker` sözleşmesi tarafından tutulur ve kilit sözleşmesinin yayımlanmış arayüzünde transfer yoktur, approve yoktur, likidite azaltma yoktur, yakma metodu yoktur. O anaparayı dışarı çıkarmak için herhangi birinin çağırabileceği bir fonksiyon yok — bizim de yok, NOXA'nın da yok, kilit sözleşmesinin sahibi olan adresin de yok.

Bu teknik dokümanın hâlâ iddia etmeyi reddettiği şey ise başlıktaki kısa hâli. Son anlık görüntüde bu pozisyon, ana havuzun aktif likiditesinin 51.4%'ünü sağlıyordu. Kalan 48.6% ile daha küçük altı havuzdaki her şey, sahiplerinin tek bir blokta çekebileceği sıradan LP.

Yani karşısında işlem yaptığınız derinliğin kabaca yarısı, uyarı olmadan çıkıp gidebilir. "Likidite kilitli" demek, aksini varsaymanıza izin verirdi ve bu varsayım piyasanın değil, bizim eserimiz olurdu. [Likidite ve kilit](/tr/docs/liquidity-and-the-lock/) pozisyonu, havuzları ve bu ayrımı veriyor.

## "Sahiplikten feragat edildi"

Yok; yerine daha iyi bir şey konuldu.

Feragat, kontrolü bırakan bir sahibin var olduğunu ima eder — ve bunun düzgün yapıldığına güvenmek zorunda kalırdınız. Bu sözleşmede `owner()` revert eder, çünkü **fonksiyon hiçbir zaman orada değildi**. Kimse onu duraklatamaz, yükseltemez ya da içine mint edemez ve bunu yaklaşık on saniyede kendiniz doğrulayabilirsiniz.

Feragat rozetini kaldırdık ve yerine canlı okumayı koyduk.

## "Denetlendi"

Yok. Üçüncü taraf bir güvenlik denetimi yaptırılmadı.

Sözleşme standart bir token, gezgindeki kaynağı kısmi eşleşme ve tamamını okuyabilirsiniz. Çevresindekilerin tamamı ise okunabilir değil: bugüne kadarki her yakımı gerçekleştirmiş olan launchpad'in ücret sözleşmesi, kaynağı hiç yayımlanmamış, doğrulanmamış bytecode. Bunların hiçbiri denetim değil ve hiçbiri denetim gibi de sunulmuyor.

## "Dev cüzdanı yok, içeriden kimse yok"

Lansmanı anlatan bir cümle olarak yok — bugünkü projeyi anlatan bir cümle olarak ne değeri varsa, o ayrı.

Doğru cümle daha uzun ve biz uzun olanı yazmayı tercih ederiz. Lansmanı yapan adres, token'ı oluşturan işlemin içinde 11.04%'lük bir alım yaptı, bu alım sözleşmenin kendisi tarafından cüzdan üst sınırından muaf tutuldu, tamamını 60 saniye içinde yaklaşık 0.269 ETH net kazançla sattı, o günden beri hiçbir şey tutmadı ve launchpad tarafından kendisine yaratıcı ücreti olarak yaklaşık 18.23 WETH ödendi. Projeyi şu anda yürütenler, orijinal geliştirici gittikten sonra geldiklerini söylüyor. Zincirde bunu çürüten bir şey yok, kanıtlayan bir şey de yok: adresler kimlik değildir ve bunları kümelemek için hiçbir girişimde bulunulmadı. Bu, kendinden önceki cümlenin savunması olarak sunulmuyor.

[Lansman](/tr/docs/the-launch/) sayfası, sözleşmedeki muafiyet dahil olmak üzere bunu log log ortaya koyuyor.

## "Yakım topluluk tarafından yürütülüyor"

Yok, çünkü yanlış. Bugüne kadarki her yakımı, kilitli pozisyondan işlem ücretini süpürüp bunun $IF tarafını yakan NOXA'nın ücret sözleşmesi gerçekleştirdi — 12 Temmuz 2026 tarihinden bu yana tamamını. 423 kez çalıştı. Bu topluluk hiçbir şey yakmadı.

Bunu söylemek alçakgönüllülük değil. Kontrol edebileceğiniz bir anlatı ile edemeyeceğiniz bir anlatı arasındaki fark bu; ve aynı zamanda risk de bu: yakım başkasının keeper'ına ait ve o keeper durduğu gün duruyor. [Yakım nasıl işliyor](/tr/docs/how-the-burn-works/) mekanizmayı ve sona ermesinin nasıl görüneceğini anlatıyor.

## Fiyat hedefleri, tahminler, "sıradaki 100x"

Kalıcı olarak yok. Kimse bilmiyor ve bildiğini söyleyen herkes bir şey satıyor.

## Bir fayda yol haritası

Yok. Token'ı bir şey için gerekli kılacak, yolda olan bir ürün yok.

[Yol haritası](/tr/roadmap/) site için yapılan şeyleri listeliyor — araçlar, sayfalar, çeviriler. Üzerindeki yayına alınmış her şey orada kalıyor; böylece neyin söz verildiğine karşılık neyin geldiğine dair kayıt kalıcı ve kontrol edilebilir oluyor.

## Ortaklıklar, listelemeler, referanslar

Yazıldığı anda bağımsız olarak doğrulanabilir olmadıkça yok. Robinhood Chain üzerinde çalışmanın ötesinde Robinhood ile ima edilen bir ilişki yok; Robinhood Chain, herkesin sözleşme yayına alabileceği açık bir ağ.

## Bir hazine, bir ekip tahsisi, bir hak ediş takvimi

Yok, çünkü tarif edilecek böyle bir yapı yok. [Sahip tablosu](/tr/stats/) kimliğini tespit edemediğimiz cüzdanlar dahil olmak üzere gerçek dağılımı gösteriyor.

## Neden zahmet edelim

Çünkü ürünü olmayan bir coin'in sunabileceği tek şey, size hiç yalan söylememiş olması. Bu da ancak yalan söylemenin işe yarayacağı yerde geçerliliğini koruduğunda bir değer taşır — ki burası tam olarak orası: iddiaların yer alacağı sayfa.
