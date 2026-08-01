# Geliştirme Rehberi

## Yerel çalışma düzeni

Backend ve frontend bağımsız süreçlerdir. Django varsayılan olarak `8000`, Vite
ise `5173` portunu kullanır. Frontend'deki API istemcileri `src/config.js`
üzerinden aynı temel adresi kullanır.

```bash
# Terminal 1
source .venv/bin/activate
cd backend
python manage.py runserver
```

```bash
# Terminal 2
cd frontend
npm start
```

## Veritabanı değişiklikleri

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py makemigrations --check --dry-run
```

Son komut commit öncesinde beklenmeyen migration olmadığını doğrular.

## Testler

Backend testleri kayıt, JWT yenileme, not CRUD işlemleri, kimlik doğrulama ve
kullanıcılar arası veri izolasyonunu kapsar:

```bash
cd backend
python manage.py test
```

Frontend testleri route korumasını ve giriş durumuna göre landing sayfasını
kapsar:

```bash
npm --prefix frontend test
npm --prefix frontend run build
```

CI aynı kontrolleri her pull request ve `main` branch push işleminde çalıştırır.

## Kimlik doğrulama akışı

1. Kullanıcı giriş endpointinden access ve refresh token alır.
2. Tokenlar tarayıcı `localStorage` alanında tutulur.
3. Yetkili Axios istemcisi access tokenı `Authorization` başlığına ekler.
4. İstek `401` döndürürse refresh token ile yalnızca bir yenileme denenir.
5. Yenilenen access token ile ilk istek tekrar edilir.
6. Yenileme başarısızsa yerel oturum temizlenir.

## Otomatik kayıt akışı

- Editördeki değişiklikler 700 ms boyunca yeni giriş gelmezse kaydedilir.
- `/notes/new` sayfasındaki ilk kayıt bir not oluşturur.
- Sunucudan dönen ID saklanır; sonraki kayıtlar aynı nota `PATCH` gönderir.
- Boş bir yeni not için sunucuda kayıt oluşturulmaz.

## Değişiklik kontrol listesi

- Yeni endpointler varsayılan olarak kimlik doğrulama gerektirmeli.
- Not sorguları mutlaka `request.user` ile sınırlandırılmalı.
- Parolalar doğrudan kaydedilmemeli; kullanıcı yöneticisi kullanılmalı.
- Yeni ortam değişkenleri `.env.example` ve README'ye eklenmeli.
- Davranış değişiklikleri için backend veya frontend testi eklenmeli.
- Build, Django sistem kontrolü ve iki test paketi çalıştırılmalı.
