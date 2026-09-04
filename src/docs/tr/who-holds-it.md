---
title: Kimler tutuyor
summary: En büyük cüzdanlar, kimliği belirlenebildiği yerde adlarıyla.
snapshot: '2026-09-02'
---

"Her şeyi tek bir cüzdan mı tutuyor" sorusu, bir token hakkında herkesin sorması gereken ilk ciddi sorudur ve bir yüzde bunun cevabı değildir. [Veriler sayfası](/tr/stats/) en büyük on beş bakiyeyi, her satır kendi adresine bağlanmış olarak yayımlar.

## Tabloyu dürüstçe okumak

En büyük kalemlerden ikisi ilk bakışta göründükleri şey değildir; etiketlenmiş olmalarının sebebi tam olarak budur:

**En büyük bakiye genellikle yakım adresindedir.** O token'lar tutulmuyor, yok edilmiş durumda. Onları bir balinanın pozisyonu saymak anlamı tersine çevirir — bu satır tablodaki en kaygı verici satır değil, en içi rahatlatan satırdır.

**Likidite havuzu genellikle üst sıralardadır.** Bir havuz, karşılığında işlem yaptığı token'ları tutar. Hiçbir şey tutmasaydı, satın alamazdınız. Bu bir pozisyon değil, altyapıdır.

Bu ikisini çıkarın, geriye kalan gerçek sahiplik yoğunlaşmasıdır. Eylül 2026 okumasında, en büyük gerçek bireysel cüzdan arzın yaklaşık 3% kadarını tutuyordu.

## Size ne söyleyebiliriz, ne söyleyemeyiz

Size adresleri, bakiyeleri ve hangilerinin sözleşme olduğunu söyleyebiliriz. Bunların hepsi zincir üzerinde. Şu son nokta üzerine bir çekince: en büyük sahiplerden birkaçı blok gezgininde sözleşme gibi okunuyor, ama aslında [Üzerinde çalıştığı zincir](/tr/docs/the-chain/) sayfasında anlatılan yetki devrini kullanan sıradan cüzdanlar. Bunların arkasında insanlar var ve onları sözleşme olarak kaydeden bir yoğunlaşma rakamı yanlıştır, üstelik projeyi olduğundan iyi gösteren yönde yanlıştır.

O adreslerin arkasındaki insanların kim olduğunu size söyleyemeyiz. Onların iş birliği olmadan bunu kimse yapamaz. Sahiplerinin kimliklerini bildiğini iddia eden bir proje ya KYC yürütüyordur ya da tahmin ediyordur.

Dağılımın böyle kalacağını da vaat edemeyiz. Büyük bir sahip istediği an satabilir ve sözleşmede bunu engelleyen bir mekanizma yok. Bakınız [Riskler](/tr/docs/risks/).

## Veriler nereden geliyor

Sahip listesi derleme sırasında blok gezgininden okunur ve bu depoya işlenir, günlük olarak yenilenir.

Bunun derleme sırasında yapılmasının belirli bir sebebi var: gezgin bir bot doğrulamasının arkasında duruyor ve CORS başlığı göndermiyor, dolayısıyla bir tarayıcı onu çağıramıyor. Aksini varmış gibi yapmak ya da sahip olmadığımız bir sunucu üzerinden geçirmek yerine, liste derleme sırasında bir kez çekiliyor ve sayfa listenin okunduğu tarihi belirtiyor.

Kimliği belirlenemeyen adresler, tahmin edilmiş bir etiketle değil, etiketsiz gösterilir.
