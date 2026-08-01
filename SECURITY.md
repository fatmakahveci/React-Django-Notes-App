# Güvenlik Politikası

## Desteklenen sürüm

Güvenlik güncellemeleri yalnızca `main` branch'in en güncel hali için sağlanır.
Eski commitler ve kişisel forklar ayrıca desteklenmez.

## Güvenlik açığı bildirme

Bir güvenlik açığını herkese açık issue olarak paylaşmayın. Depodaki
[özel güvenlik bildirimi](https://github.com/fatmakahveci/React-Django-Notes-App/security/advisories/new)
üzerinden aşağıdaki bilgileri gönderin:

- Etkilenen endpoint, bileşen veya commit
- Açığın yeniden üretim adımları
- Beklenen ve gözlenen davranış
- Olası etkisi
- Varsa örnek istek, yanıt veya düzeltme önerisi

Bildirim incelenene kadar erişim tokenlarını, gerçek kullanıcı verilerini veya
çalışan sistemlere ait gizli bilgileri eklemeyin.

## Güvenli dağıtım gereksinimleri

- `DJANGO_DEBUG=false` kullanın.
- Uzun ve rastgele bir `DJANGO_SECRET_KEY` tanımlayın.
- `DJANGO_ALLOWED_HOSTS`, CORS ve CSRF listelerini gerçek alan adlarıyla
  sınırlandırın.
- Uygulama ve API trafiğini HTTPS üzerinden sunun.
- Veritabanı parolalarını ve tokenları depoya commit etmeyin.
- Bağımlılık ve güvenlik taramalarını düzenli çalıştırın.

## Kimlik doğrulama notları

Not endpointleri JWT doğrulaması gerektirir ve sorgular aktif kullanıcıya göre
filtrelenir. Frontend tokenları `localStorage` içinde tutar; bu nedenle dağıtımda
güçlü bir Content Security Policy kullanılması ve XSS risklerinin dikkatle
yönetilmesi önerilir.
