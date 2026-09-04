---
title: Riskler
summary: Burada para kaybetme yollarınız, gömülmek yerine açıkça yazılmış hâlde.
---

Bu sayfa, korunmak için sonradan iliştirilmiş bir sorumluluk reddi değil. Almadan önce tek bir sayfa okuyacaksanız, bunu okuyun.

**Koyduğunuz her şeyi kaybedebilirsiniz.** Yalnızca tamamen kaybedilmesi hayatınızda önemli hiçbir şeyi değiştirmeyecek parayı ayırın.

## Fiyat sıfıra gidebilir

Bir meme coin'in fiyatı tamamen başkalarının onu istemeye devam etmesine dayanır. Altında gelir yok, onu destekleyen bir varlık yok, bir taban yok.

Bu kategorideki token'ların çoğu fiilen değersiz hâle gelir. Dramatik bir çöküş değil — ilgi başka yere kayar, hacim kurur ve geriye kimsenin bakmadığı bir grafik kalır. Bu, nadir olan değil, olağan sonuçtur.

## Hayatta kalma yanlılığı sizin üzerinizde işliyor

Yüz katına çıkan coin'leri biliyorsunuz. Çıkmayan binlercesini hiç duymadınız, çünkü kimse onlar hakkında bir thread yazmadı.

Bu, algılanan olasılıkları muazzam ölçüde çarpıtır. Size ulaşan her hikâye, anlatmaya değer olduğu için zaten başarıya göre filtrelenmiştir.

Bu coin'in bütün öncülü — _ya daha erken almış olsaydınız_ — tam olarak bu çarpıtmayla işliyor. Bunu sessizce kullanmaktansa adını koymanın daha dürüst olduğunu düşünüyoruz, ama adını koymak onu kapatmıyor.

## Likidite ince

Küçük piyasalar her iki yönde de sert hareket eder. Başka bir yerde dikkat çekmeyecek bir alım bu fiyatı gözle görülür biçimde hareket ettirebilir; bir satış da öyle.

Pratikte: gördüğünüz fiyattan çıkamayabilirsiniz. Fiyat kayması bunun görünen kısmı; görünmeyen kısmı ise yeterince büyük bir satışın hiç alıcı bulamayabilmesi.

## Yoğunlaşma

Bir avuç cüzdan kayda değer bir pay tutuyor; [Kimler tutuyor](/tr/docs/who-holds-it/) bunu tam olarak gösteriyor. Herhangi biri istediği an, uyarmadan satabilir ve sözleşmede bunu engelleyen hiçbir şey yok.

Dağılım bu piyasanın ölçülerine göre makul. Bu, güvenli olmakla aynı şey değil.

## Likiditenin ancak yarısı kadarı kilitli

Bu sayfa eskiden likidite pozisyonunu kimin kontrol ettiğini size gösteremediğimizi söylüyordu. Artık gösterebiliyoruz, işte burada.

Lansman pozisyonu, Uniswap V3 pozisyon NFT'si `70641`, launchpad'in kilit sözleşmesinde tutuluyor. O sözleşmenin onu transfer etmek, onaylamak, likiditesini azaltmak veya yakmak için hiçbir metodu yok. Anapara, onu oraya koyan launchpad dahil hiç kimse tarafından çekilemez. [Likidite ve kilit](/tr/docs/liquidity-and-the-lock/) bunu kendiniz nasıl okuyacağınızı gösteriyor.

Risk ortadan kalkmadı. Yer değiştirdi. Son anlık görüntüde kilitli pozisyon, ana havuzun aktif likiditesinin 51.4% kadarını sağlıyordu. Kalan 48.6% ise sıradan insanlara ait sıradan pozisyonlar; altı küçük havuzdaki likiditenin tamamı da öyle. İçine satış yapacağınız derinliğin yaklaşık yarısı, onu orada bırakmak konusunda hiçbir yükümlülüğü olmayan kişilerce, uyarı olmadan, tek bir blokta çekilebilir.

Yalnızca bir DEX'te işlem gören bir token için bu normaldir. Aynı zamanda "likidite kilitli" ifadesinin hızlıca okuyan birine çağrıştırdığı şey de değildir; bu teknik dokümanın o ifadeyi tek başına kullanmamasının nedeni budur.

## Yakım, durabilecek bir keeper'a bağlı

$IF sözleşmesinde hiçbir şey bir şey yakmıyor. Yakım, ücret gelirinden ibaret: işlem ücretleri kilitli lansman pozisyonunda birikir, launchpad'in toplayıcısı bunları süpürür ve süpürmenin $IF tarafı ölü adrese gönderilir. [Yakım nasıl işliyor](/tr/docs/how-the-burn-works/) yolun tamamını ortaya koyuyor.

Ücret birikimi dışında bunun her adımı, birinin bir fonksiyon çağırmasını gerektirir. Launchpad'in keeper'ı çağırmayı bırakırsa, ücretler pozisyonda birikir ve orada, yakılmadan ve tahsil edilmeden, süresiz kalır. Zincir üzerinde bu çağrıyı zorunlu kılan hiçbir şey yok ve durmadan önce size bir duyuru yapılması gerekmiyor.

Bu bağlamda bilinmeye değer: launchpad, $IF'in lansman yaptığı gün yeni lansmanları kabul etmeyi bıraktı ve web sitesi iki gün sonra karardı. Süpürmeler yine de sürdü, en son 1 Eylül 2026 tarihinde. Sürdürmek, sürdürmekle yükümlü olmakla aynı şey değil.

## Ücretler başka bir yere yönlendirilebilir

Kilit sözleşmesinin sahibi tek bir sıradan cüzdan. Kilitli pozisyona dokunamaz, ama ücret payını ve ücret alıcısını değiştirebilir; bu iki ayar birlikte, gelecekteki ücretlerin 100% kadarını seçtiği herhangi bir adrese gönderebilir.

Bu, iki fonksiyon çağrısı. Oylama yok, bildirim yok, itiraz yok. Yakım bu akışla besleniyor; dolayısıyla akışı başka yöne çevirmek yakımı bitirir ve bunu ancak sonradan zinciri izleyerek öğrenirsiniz.

## Mekanizmanın bazı parçaları okunamıyor

$IF token'ının kaynağı blok gezgininde tam eşleşme olarak değil, kısmi eşleşme olarak yayımlanmış; kilit sözleşmesininki de öyle. Launchpad'in ücret sözleşmesi doğrulanmamış bytecode. Fabrikası ise hiç doğrulanmamış.

Bu, $IF hakkında değil launchpad hakkında bir olgu ve öyle okunmalı: o derlemeleri kimse yayımlamadı. Sizin açınızdan sonuç her iki durumda da aynı. Yakımın üzerinde işlediği şeyin bir kısmı, ne dediği okunarak değil, yalnızca ne yaptığı izlenerek kontrol edilebilir.

## Launchpad'in arkasında kimin olduğunu kimse bilmiyor

İncelediğimiz hiçbir kaynak kim olduklarını ortaya koymuyor. Kilit sözleşmesinin sahibi çıplak bir adres. Ücret sözleşmesi, aynı adres tarafından yayına alınmış doğrulanmamış bytecode. Yakımın bağlı olduğu her şey, kimsenin adını koyamayacağı kişilerden geçiyor.

Bunu söylerken bir iddiada bulunmuyoruz. Söylediğimiz şu: yakım durursa ya da ücretler yer değiştirirse, soracak kimse ve hesap verecek kimse yok. Yakımın sizin için ne değer taşıdığına bunu da hesaba katarak karar verin.

## Düzenleme ve platform riski

Token'larla ilgili kurallar ülkeden ülkeye değişir ve zamanla değişir. Borsalar listeden çıkarır. Cüzdanlar ve blok gezginleri zincirlere verdikleri desteği bırakır. Bunların herhangi biri, token'ın kendisinden bağımsız olarak, işlem yapma ya da elinizdekini görme imkânınızı etkileyebilir.

## Kendi hatalarınız

İnsanların burada para kaybetmesinin en yaygın yolu bir piyasa hareketi değil. Yanlış sözleşmeyi almak, bir kurtarma ifadesini kaybetmek ya da okumadıkları bir şeyi imzalamak. [Cüzdanlar ve saklama](/tr/docs/wallets-and-custody/) her birini ele alıyor.

Bunların hiçbiri geri alınabilir değil. Bir destek masası yok, ödeme iadesi de yok.

## Buradaki hiçbir şey tavsiye değil

İşin içindeki hiç kimse size tavsiye vermek için lisanslı değil ve bu teknik doküman herhangi bir şeyi alma, tutma ya da satma tavsiyesi değil. Bu, şeyin ne olduğunun bir tarifi.
