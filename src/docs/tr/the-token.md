---
title: Token
summary: Sözleşme, zincir, havuz ve bunların her birinin gerçekte ne anlama geldiği.
---

$IF, Robinhood Chain üzerinde yayına alınmış bir ERC-20 token'ıdır. Aşağıdaki her şey herkese açıktır ve internet bağlantısı olan herkes tarafından okunabilir.

## Sözleşme

**`0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1`**

Tek $IF budur. İkinci bir sözleşme, bir "V2" ve bizim çıkardığımız köprülenmiş bir sürüm yoktur. Aynı ada ve farklı bir adrese sahip bir token bu proje değildir — bunun kulağa geldiğinden neden daha önemli olduğu için [Cüzdanlar ve saklama](/tr/docs/wallets-and-custody/) sayfasına bakın.

`LaunchToken` adlı, Solidity 0.8.30 ile derlenmiş standart bir token sözleşmesidir. Bu proje için yazılmadı. NOXA adlı bir launchpad'in yayına aldığı her token için bastığı hazır şablondur; bu konu [Lansman](/tr/docs/the-launch/) sayfasında ele alınıyor.

Blok gezginindeki kaynak kodu bir **kısmi eşleşmedir**; 14 July 2026 tarihinde Sourcify yerine eth-bytecode-db üzerinden doğrulanmıştır. Kısmi eşleşme, yayımlanan kaynağın yayına alınan sözleşmeyle aynı çalışma zamanı bytecode'una derlendiği, ancak bayt bayt aynı çıktıya derlenmediği anlamına gelir. Yani okuyabildiğiniz mantık, çalışan mantıktır. Kanıtlamadığı şey, tam olarak bu kaynak dosyanın — aynı yorumların, aynı ayarların — derlenmiş olan dosya olduğudur; tam eşleşmenin ortaya koyduğu şey budur. NOXA, buna imkân verecek derlemeyi hiçbir zaman yayımlamadı. Bu, token hakkında değil launchpad hakkında bir olgudur ve sonradan bulunmaktansa burada söylenmesi daha iyidir.

Sözleşmenin sahibi, yönetici rolleri, proxy'si ve yükseltme yolu yoktur. Vazgeçecek kimse ve içine yükseltilecek bir şey yoktur. Ayrıca hiçbir türde yakma fonksiyonu da yoktur: bugüne kadar yok edilen her $IF, token'ın dışından ölü adrese gönderildi; bunu [Yakım nasıl işliyor](/tr/docs/how-the-burn-works/) sayfası tam olarak açıklıyor.

Standart dışı yaptığı tek şey, 11 July 2026 tarihindeki yayına alınmasından yaklaşık 73 dakika sonra kalıcı olarak sona eren bir lansman kısıtlama penceresiydi. Bu pencerenin neden Robinhood Chain blokları yerine Ethereum blokları üzerinden sayıldığını [Zincir](/tr/docs/the-chain/) sayfası ele alıyor.

## Zincir

Robinhood Chain bir EVM ağıdır. Pratikte bu, $IF'in Ethereum tarzı herhangi bir token gibi davrandığı anlamına gelir: aynı cüzdanlar çalışır, aynı adres biçimi, bakiyeleri okumanın aynı yolu.

Daha yeni bir zincirde olmanın, söylenmeye değer dürüst bir sonucu var: onu destekleyen araçlar, Ethereum'u destekleyenlerden daha az. Bazı portföy takip araçları bakiyenizi göstermeyecek, bazı gezginler adresi çözümlemeyecek. Bu gerçek bir zahmettir, komplo değil.

## Arz

**1,000,000,000 $IF.** Sabit.

Buradaki sabit, belirli ve kontrol edilebilir bir şey anlamına gelir: `totalSupply()` bu sayıyı döndürür ve sözleşmede onu artırabilecek bir fonksiyon yoktur. "Mint etmeyeceğimize söz veriyoruz" değil — çağrılacak bir mint yok.

Bu önemli, çünkü şişen bir arz, bir token'ın kendisini elinde tutanları sulandırmasının en sessiz yoludur. Bir token sahibi bunun olduğunu kolayca göremez; yalnızca fiyatın düştüğünü görür ve bunu piyasanın verdiği bir karar sanır. [Arz ve yakım](/tr/docs/supply-and-burn/) sayfasında sayılar ve yöntem var.

## Havuz

**`0x39A200271525E9641e799127bdAB299DAeF21953`**

Bu, $IF'in işlem gördüğü Uniswap V3 havuzudur. Aynı zamanda en büyük $IF sahiplerinden biridir; bu normaldir ve anlaşılmaya değer: bir havuz, karşılığında işlem yaptığı token'ları elinde tutar. Bir balina değildir ve onu balina saymak dağılımı fena hâlde yanlış okumaktır.

[Kim tutuyor](/tr/docs/who-holds-it/) sayfası da aynı nedenle o satırı balina gibi görünmeye bırakmak yerine havuz olarak etiketliyor.

## Neyin kilitli olduğu, neyin olmadığı

Havuzun var olduğunu, nerede olduğunu ve içinde ne kadar bulunduğunu size söyleyebiliriz. Artık likidite pozisyonunu kimin tuttuğunu da söyleyebiliyoruz; uzun süre bunu yapamıyorduk.

Lansman pozisyonu, Uniswap V3 pozisyon NFT'si `70641`'dir. NOXA'nın `LaunchLocker` sözleşmesi tarafından tutuluyor; bu sözleşmenin yayımlanmış arayüzünde pozisyonu devretmeye, likiditesini azaltmaya veya anaparayı çekmeye yarayan bir metot yok. NOXA dahil hiç kimse onu çıkaramaz. Bu, süresi dolan bir zamanlayıcı değil.

Ayrıca likiditenin tamamı da değil. Son anlık görüntüde `70641` pozisyonu, ana havuzun aktif likiditesinin 51.4%'ünü sağlıyordu. Kalan 48.6% tek bir blokta çekilebilen sıradan üçüncü taraf LP'sidir ve $IF'in işlem gördüğü altı küçük havuz tamamen kilitsizdir. [Likidite ve kilit](/tr/docs/liquidity-and-the-lock/) sayfasında pozisyon, onu tutan taraf ve aritmetik var.

Arkasında hiçbir şey olmayan "LP kilitli" ifadesi, bu piyasadaki tek başına en yaygın yanlış iddiadır; bu teknik doküman da bu yüzden lansman pozisyonunun kalıcı olarak kilitli olduğunu söylüyor, likiditenin kilitli olduğunu değil. Birincisi, gidip kontrol edebileceğiniz tek bir pozisyon hakkında bir ifadedir. İkincisi ise size fiyatın altındaki derinliğin ayrılamayacağını söylerdi; oysa o derinliğin yaklaşık yarısı ayrılabilir.
