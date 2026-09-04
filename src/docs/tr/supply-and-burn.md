---
title: Arz ve yakım
summary: Bir milyar, sabit, ölçülebilir bir miktarı kalıcı olarak yok edilmiş.
---

$IF'in para politikasının tamamını iki sayı anlatır ve ikisi de burada iddia edilmek yerine zincirden okunur.

## Toplam arz

**1,000,000,000 $IF** ve bu sayı artamaz.

Sözleşme `totalSupply()` fonksiyonunu dışa açıyor; bu fonksiyon `0x033b2e3c9fd0803ce8000000` döndürüyor — on sekiz ondalık basamakla bir milyar. Sözleşmede mint fonksiyonu yok, dolayısıyla bu, birilerinin uymayı seçtiği bir politika değil. Kodun bir özelliği.

## Ne kadarı yakıldı

Bir token'ı yakmak, onu kimsenin harcama yapamayacağı bir adrese göndermek demek. Alışılmış adres `0x000000000000000000000000000000000000dEaD` — geçerli bir hedef olduğu ve özel anahtarı türetilemediği için seçilmiş bir adres. Oraya gönderilen token'lar "kilitlenmiş" ya da "rezervde tutuluyor" değil. Biz dahil herkes için kalıcı olarak erişilemez durumdalar.

Güncel yakılmış bakiye [Veriler sayfasında](/tr/stats/) canlı okunuyor ve her bir yakım, onu gerçekleştiren işleme bağlantı verilerek listeleniyor. 2 Eylül 2026 tarihinde alınan bir anlık görüntüde 93,449,236.90 $IF idi; bu, arzın 9.3449% kadarı. Bu toplamı oluşturan 425 transferin ikisi sıradan cüzdanlardan geldi ve ikisi birlikte 2.84 $IF ediyor. Diğer 423'ü tek bir ücret sözleşmesinden geldi; aşağıda anlatılan mekanizma bu.

Bundan iki şey çıkıyor ve hangisinin hangisi olduğu konusunda kesin olmakta yarar var:

- **Dolaşımdaki arz gerçekten daha küçük.** Bu kısım aritmetik.
- **Daha küçük bir arz, bir token'ı daha değerli yapmaz.** Bu kısım aritmetik değil ve size aksini söyleyen herkes bir şey satıyordur. Yakım paydayı değiştirir, talebi değil.

## Yakım geçmişi neden olaylardan kuruluyor

Bir yakım geçmişini göstermenin bariz yolu, zincire "bu bakiye geçen ay ne kadardı" diye sormak. Açık düğümler buna yanıt vermiyor — arşiv düğümü değiller ve geçmiş duruma yönelik bir istek, hata yerine hiçbir şey döndürüyor.

Bu yüzden geçmiş ters yönden kuruluyor: yakım adresine giren her `Transfer`, zincirin kendi günlüklerinden bir kez okunuyor ve bu depoya işleniyor. Site sonra bunu, o tarihten beri olanlarla tamamlıyor. Yani yakım eğrisi birincil kanıttan yeniden kuruluyor ve üzerindeki her nokta, geldiği işleme bağlantı veriyor.

## Yakımı ne besliyor ve bu ne anlama gelmiyor

Bu sayfanın daha eski bir sürümü, her işlemde otomatik bir yakım olmadığını, onu besleyen bir ücret olmadığını ve bir takvim olmadığını söylüyordu. Ortadaki ifade yanlıştı ve bunu düzeltmek, bu sayfadaki her şeyden daha önemli.

Onu besleyen bir ücret var. $IF, 1% ücretli bir Uniswap V3 havuzunda işlem görüyor ve lansman likidite pozisyonu, havuzdan geçen her takasta bu ücretin bir payını kazanıyor. O pozisyon kalıcı olarak kilitli, yani anaparası biz dahil hiç kimse tarafından çekilemez. Havuzdaki tek likidite o değil; [Likidite ve kilit](/tr/docs/liquidity-and-the-lock/) geri kalanını anlatıyor ve bu ayrım önemli.

Token'ı oluşturan launchpad'in çalıştırdığı bir keeper, biriken ücreti o pozisyondan süpürüp çıkarıyor. Bugüne kadar 423 süpürme oldu; ilki 11 Temmuz 2026, en sonuncusu 1 Eylül 2026. İlk onunda launchpad, topladığı $IF'in 80%'ini yaktı ve kalanını tuttu. 12 Temmuz 2026 tarihinden bu yana yapılan 413 süpürmenin hepsinde $IF tarafını tamamen yaktı. [Yakım nasıl işliyor](/tr/docs/how-the-burn-works/) adresleri, bölüşümü ve ücretin ETH tarafının nereye gittiğini ortaya koyuyor.

Yani yakım mekanik ve hacim tarafından sürükleniyor; onu yok saymak yanlıştı. Geriye kalan doğru daha dar. Token sözleşmesinin içinde değil, dolayısıyla zincir üzerinde onu zorunlu kılan hiçbir şey yok. Her işlemde gerçekleşmiyor: ücretler pozisyonda birikiyor ve toplu halde süpürülüyor. Bir takvim değil ve çalıştırmak bize ait değil. O keeper kapatılırsa ücretler süpürülmeden birikir ve yakım durur; ne bir bildirim olur ne de başvurulacak bir yer.

Hacim aynı zamanda büyüklüğü de belirliyor ve hacim lansman haftasından bu yana epey düştü. 2 Eylül 2026 anlık görüntüsü civarında arz günde kabaca 0.014% küçülüyordu. Bu, küçük bir sayı üreten gerçek bir mekanizma ve bir fiyat beklemek için bir gerekçe değil.
