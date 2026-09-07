---
title: Yakım gerçekte nasıl işliyor
summary: Üçüncü bir tarafça işletilen otomatik bir ücret motoru $IF'i neredeyse her gün yakıyor ve o taraf ne zaman karar verirse durabilir.
snapshot: '2026-09-02'
---

Bu teknik doküman uzun süre boyunca yakımı besleyen bir ücret olmadığını söyledi. Bu yanlıştı ve düzeltme kendi sayfasına ihtiyaç duyacak kadar büyük. Aşağıdaki her rakam zincirden 2 Eylül 2026 tarihinde, `52,582,784` bloğunda ya da civarında okundu.

Sade hâliyle başlayalım. Yakım elle yapılmıyor. Ara sıra olmuyor. Açıklanamaz değil. Ve hiçbir şey yakmamış olan bu topluluk tarafından yapılmıyor. Üçüncü bir tarafça işletilen, hacme dayalı, otomatik bir ücret motoru ve 423 kez çalıştı.

## Mekanizma, adım adım

$IF token sözleşmesinde hiçbir şey buna katılmıyor. Token'ın herhangi bir türde yakma fonksiyonu yok. Bunların hepsi, token'ın bir katman üstünde, launchpad'in iç tesisatında oluyor.

1. İşlem yapanlar Uniswap V3'ün 1% ücretini ödüyor. Kalıcı olarak kilitlenmiş lansman pozisyonu olan `70641` numaralı pozisyon esasen tüm fiyat aralığını kapsıyor, bu yüzden ana havuzdaki her takastan pay kazanıyor.
2. NOXA'nın toplayıcısı kilit sözleşmesi üzerinde `collectFees` çağırıyor. Kilit sözleşmesi, birikmiş ücretlerin her iki tarafını da pozisyondan süpürüp çıkarıyor.
3. Kilit sözleşmesi geliri `protocolFeeShare` değerine göre bölüyor; bu değer şu anda `100` okunuyor. Dolayısıyla yaratıcının token tarafındaki zincir üstü payı sıfır. Bunun olduğunu görebilirsiniz: her tahsil, kilit sözleşmesinden orijinal deployer'a sıfır değerli bir IF transferi yayıyor.
4. Ücret sözleşmesi IF tarafını `0x000000000000000000000000000000000000dEaD` adresine yakıyor ve yaratıcı kazançları ile NOXA'nın kendi payını ödeyen WETH tarafını tutuyor.

Yani ücretin token bacağı yok ediliyor, ETH bacağı paraya çevriliyor. O pozisyondan toplanan WETH'ten `18.2300` yaratıcı kazancı olarak lansmanı yapan orijinal tarafa ödendi ve yaklaşık `61.34` NOXA tarafından alıkonuldu.

## Kanıt

Yakım adresine yapılan 425 transferin her biri çözümlendi. Bunlardan toplam **93,449,234.06 IF** tutarındaki 423'ü tek bir adresten geldi:

**`0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417`**

Bu adres, NOXA'nın protokol ücreti alıcısı ve yetkili ücret toplayıcısı. Diğer iki transfer sıradan cüzdanlardan gelen tozdur: `2.84` IF ve `0` IF.

Açık gözle bakılması gereken bir nokta var. O ücret sözleşmesi, kilit sözleşmesinin sahibi tarafından yayına alınmış 7,725 baytlık doğrulanmamış bytecode'dur. Kaynağı hiç yayımlanmadı, dolayısıyla ne yaptığı, herhangi birinin okuyabileceği koddan değil, zincir üstündeki davranışından çıkarsanıyor.

## İkinci gün ne değişti

Bölüşüm her zaman şimdiki gibi değildi. İlk on tahsilde, 11 Temmuz 06:46 UTC'den 12 Temmuz 09:52 UTC'ye kadar, sözleşme topladığı IF'in 80%'ini yaktı ve diğer 20%'sini NOXA'nın ilk ücret cüzdanına gönderdi:

**`0x71f2F1c2dc94cDaBFE29Cb355119f8683AE0969b`**

Oraya `14,468,370.53` IF gitti. O cüzdanın [sahip tablosunda](/tr/stats/) hâlâ görünmesinin ve arzın 1.45%'ini elinde tutmasının sebebi budur. Gizemli bir balina değil ve bir ekip tahsisi değil. Bir launchpad'in ilk iki günden aldığı ücret payı.

12 Temmuz'dan itibaren, sonraki 413 tahsilin tamamında IF tarafının 100%'ü yakıldı.

## Yakımın zaman içindeki şekli

Yakım işlem hacmini izliyor, bu da çoğunun hacmin en yüksek olduğu dönemde gerçekleştiği anlamına geliyor, bu da çoğunun çoktan geride kaldığı anlamına geliyor.

| Dönem                | Yakılan IF | Toplam yakımdaki payı |
| -------------------- | ---------- | --------------------- |
| 11 Jul 2026, ilk gün | 56,873,813 | 60.9%                 |
| Temmuz'un kalanı     | 29,950,521 | 32.0%                 |
| Ağustos              | 6,541,732  | 7.0%                  |
| Şu ana kadar Eylül   | 83,171     | 0.1%                  |

Lansmandan 2 Eylül 2026 anlık görüntüsüne kadar geçen 53 günün 51'inde yakım gerçekleşti, yani motor istikrarlı biçimde çalışıyor. Sadece çok daha az yakıtla çalışıyor. Hacim, lansman haftasına göre kabaca iki büyüklük mertebesi düştü ve mevcut hızda arz günde yaklaşık 0.014% yanıyor.

Anlık görüntü sırasında pozisyonda birikmiş ve bir sonraki süpürmeyi bekleyen: `65,950` IF ve `0.1967` WETH. Bir sonraki yakım budur ve güvene dayanmak yerine canlı olarak okunabilir.

## NOXA kim ve bu ne anlama geliyor

NOXA, token'ı basan launchpad. Tarihler önemli, çünkü ücret yapılandırmasının neden hiç yeniden müzakere edilmediğini açıklıyorlar.

`LaunchLocker`, Robinhood Chain'in halka açık ana ağı açılmadan iki hafta önce, 16 Haziran 2026 tarihinde, protokol payı 65 olarak ayarlanmış hâlde yayına alındı. Ana ağ günü olan 1 Temmuz'da pay 65'ten 100'e çıkarıldı ve mevcut ücret sözleşmesi toplayıcı olarak yetkilendirildi. $IF bu yapılandırma altında 11 Temmuz'da piyasaya çıktı. Aynı gün NOXA, yeni token lansmanlarını kabul etmeyi bırakacağını duyurdu. İki gün sonra web sitesi karardı ve 14 Temmuz'da artık ücret toplamayacağını, gelirin 100%'ünü yaratıcılara yönlendireceğini paylaştı.

O açıklama ile zincir üstündeki durum bağdaşmıyor. 1 Eylül 21:14 UTC'deki en son tahsil itibarıyla `protocolFeeShare` hâlâ `100` okunuyor ve kilit sözleşmesinin `ProtocolFeeUpdated` kaydı 1 Temmuz'dan bu yana bir değişiklik göstermiyor.

İki okuma da uyuyor ve zincir üstünde ikisi arasında karar verdirecek hiçbir şey yok. Ya duyuru bu kilit sözleşmesine hiç uygulanmadı ya da ETH bacağına değil token bacağına uygulandı; çünkü 12 Temmuz tam olarak IF tarafının kısmen alıkonulmayı bırakıp tamamen yakılmaya başladığı tarih. Bunu gerçek değil, yorum olarak kabul edin.

NOXA'nın arkasında kimin olduğunu kimse bilmiyor. İncelenen hiçbir kaynak bunu ortaya koymuyor. Kilit sözleşmesinin sahibi çıplak bir harici sahipli hesap ve ücret sözleşmesi doğrulanmamış bytecode.

## Neler ters gidebilir

Bu bölüm [Riskler](/tr/docs/risks/) sayfasına ait olduğu kadar buraya da ait, çünkü bir mekanizma ancak bağlı olduğu şey kadar sağlamdır.

**Yakım her an durabilir ve zincir üstünde bunu engelleyecek hiçbir şey yok.** `collectFees` çağrısını sürdürecek, çalışır durumda üçüncü taraf bir keeper'a ihtiyacı var. Bu kapatılırsa ücretler, kimse çağırmadığı sürece, yakılmadan ve tahsil edilmeden pozisyonun içinde birikir.

**Kilit sözleşmesinin sahibi şartları değiştirebilir.** O adres `0x7E035Fb048a31e0481b88074557415b1C187242B`. Ücret payını değiştirebilir, alıcıyı değiştirebilir, toplayıcıları yetkilendirebilir ya da yetkilerini geri alabilir. LP pozisyonunu taşıyamaz veya çözemez; kilitli kalan kısım odur. Topluluğun bunların hiçbirinde söz hakkı yok ve önceden haber de almaz.

**Yaratıcı slotunu yalnızca orijinal deployer yönlendirebilir.** $IF için `setFeeRedirect` sadece o adres tarafından çağrılabilir ve hiç ayarlanmadı. Bir ücret payı müzakere edilecek olsaydı, çağrılması gereken tek fonksiyon budur ve onu yalnızca lansmanı yapan taraf çağırabilir.

**İşletmeci anonim ve hesap vermez.** Yukarıya bakın.

## Bu ne anlama gelmiyor

Arzın vaat edilmiş herhangi bir anlamda deflasyonist olduğu anlamına gelmiyor. Token sözleşmesindeki hiçbir şey bu yakımlardan tek birini bile zorunlu kılmıyor. Motor, $IF'in bir garantisi olduğu için değil, bir launchpad onu öyle yapılandırıp çalışır hâlde bıraktığı için var.

Ayrıca daha küçük bir arzın daha değerli olduğu anlamına da gelmiyor. Bu kısım değişmedi ve hiç değişmeyecek: yakım paydayı hareket ettirir, talebi değil.

Geriye sade bir tarif kalıyor. Bir launchpad kapandı ve ücretin token tarafını yok eden bir motoru çalışır hâlde bıraktı. Mekanizma gerçek, çalışıyor ve onu durdurabilecek başka birine ait. Bunlar aynı cümleye girer, yoksa cümle yanlıştır. Canlı yakım toplamı [Veriler sayfasında](/tr/stats/); arz aritmetiği [Arz ve yakım](/tr/docs/supply-and-burn/) bölümünde; neyin kilitli olup neyin olmadığı [Likidite ve kilit](/tr/docs/liquidity-and-the-lock/) bölümünde.
