---
title: Giriş
summary: $IF'in ne olduğu, hâlâ doğru olan en az sözcükle.
---

$IF, Robinhood Chain üzerinde bir meme coin. Ürünü yok, geliri yok, hazinesi yok ve size borçlu olduğu bir özellik yol haritası yok. Bir token, elden kaçmış bir şaka ve kenarına basılmış bir soru.

O soru da şu: **ya olursa**.

## Bu teknik doküman nedir

Çoğu teknik doküman, bir token'ı şirket gibi göstermek için vardır. Bu teknik doküman bunun tersini yapmak için var: $IF'in gerçekte ne olduğunu, ne olmadığını ve bu sayfadaki hiçbir şeye inanmadan ikisinin de nasıl kontrol edileceğini yazmak için.

On altı bölüm var. Üçü coin'i anlatıyor. Üçü sayıları kanıtlıyor. Dördü zinciri, lansmanı, likiditeyi ve yakımı parçalarına ayırıyor. Üçü satın almayı ve elde tutmayı ele alıyor. Üçü rahatsız edici kısımları açıkça söylüyor.

Yalnızca birini okuyacaksanız, [Kendiniz doğrulayın](/tr/docs/verify-it-yourself/) bölümünü okuyun. Bu teknik dokümandaki diğer her şey ondan sonra gelir.

## $IF ne değildir

Bir yatırım ürünü değildir. Buradaki hiç kimse size tavsiye verme lisansına sahip değildir ve bu teknik dokümandaki hiçbir şey tavsiye değildir. Bir işletmedeki pay değildir, çünkü ortada işletme yoktur. Size gelir, yönetişim ya da herhangi bir şey üzerinde hak sahipliği vermez.

Bunlara benziyormuş gibi görünme çabası da değildir. Bu ayrım projenin bütün meselesidir ve bu teknik dokümanın vaat edilenlere kıyasla eksik olanlara daha fazla yer ayırmasının sebebidir.

## Önemli olan üç gerçek

Bunlar tüm projenin taşıyıcı iddialarıdır. Her biri bir dakikadan kısa sürede zincir üzerinde kontrol edilebilir ve [Kendiniz doğrulayın](/tr/docs/verify-it-yourself/) her biri için tam komutu verir.

1. **Arz bir milyarda sabittir.** `totalSupply()` tam olarak bunu döndürür ve bir mint fonksiyonu yoktur.
2. **Sözleşmenin sahibi yoktur.** `owner()` çağrısı, biz sahipliği bıraktığımız için revert etmiyor — o fonksiyon hiçbir zaman orada olmadığı için revert ediyor. Kimse onu durduramaz, yükseltemez ya da içine mint edemez.
3. **Token'lar kalıcı olarak yakıldı.** Özel anahtarı var olmayan ve oluşturulamayacak bir adreste duruyorlar.

Bu sitedeki diğer her şey ya bu üç şeyden birinin yeniden ifadesidir ya da onlara bakmak için bir araçtır.

## Bunu kim yazdı

Ana sayfadaki "LP kilitli" ve "sahiplik bırakıldı" rozetlerini kanıt yetersizliği nedeniyle kaldıran ve yerlerine zinciri canlı okuyup ne buluyorsa onu gösteren — hiçbir şey bulamadığı durumlar dahil — bir panel koyan kişiler.

Bu teknik dokümanın geri kalanı da bu standarda tabidir.
