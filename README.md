# React Django Notes App

JWT kimlik doğrulamalı, otomatik kayıt özelliğine sahip tam yığın not uygulaması.
Frontend React ve Vite, REST API ise Django REST Framework ile geliştirilmiştir.

## Özellikler

- E-posta ve parola ile kayıt/giriş
- JWT access ve refresh token yönetimi
- Kullanıcıya özel not listeleme, arama, oluşturma, düzenleme ve silme
- Yazarken 700 ms gecikmeli otomatik kayıt
- Süresi dolan access token için otomatik yenileme ve istek tekrarı
- Kullanıcılar arasında sunucu tarafında veri izolasyonu
- Responsive React arayüzü

## Teknolojiler

- Frontend: React 18, React Router 7, Axios, Bootstrap, Vite
- Backend: Django 5.2 LTS, Django REST Framework, SimpleJWT
- Veritabanı: geliştirmede SQLite; PostgreSQL sürücüsü hazırdır
- Test: Vitest, Testing Library ve Django test runner

## Gereksinimler

- Node.js 20.19 veya üzeri
- Python 3.11 veya üzeri
- npm 10 veya üzeri

## Hızlı başlangıç

```bash
git clone https://github.com/fatmakahveci/React-Django-Notes-App.git
cd React-Django-Notes-App
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

Frontend'i ikinci bir terminalde başlatın:

```bash
cd frontend
npm ci
npm start
```

Uygulama `http://localhost:5173`, API ise `http://127.0.0.1:8000`
adresinde çalışır. Windows PowerShell'de sanal ortamı
`.venv\Scripts\Activate.ps1` komutuyla etkinleştirebilirsiniz.

## Ortam değişkenleri

Desteklenen değerler [.env.example](.env.example) içinde listelenmiştir. Django
değerleri doğrudan süreç ortamından okur:

```bash
export DJANGO_SECRET_KEY="uzun-ve-rastgele-bir-deger"
export DJANGO_DEBUG=false
export DJANGO_ALLOWED_HOSTS="notes.example.com"
```

Frontend API adresini değiştirmek için `frontend/.env.local` oluşturun:

```dotenv
VITE_API_BASE_URL=https://api.example.com
```

Production ortamında `DJANGO_DEBUG=false` kullanıldığında
`DJANGO_SECRET_KEY` zorunludur. İzin verilen frontend adresini
`DJANGO_CORS_ALLOWED_ORIGINS` ve `DJANGO_CSRF_TRUSTED_ORIGINS` değerlerine de
ekleyin.

## Komutlar

```bash
# Frontend — kök dizinden
npm start
npm test
npm run build

# Backend — sanal ortam etkinken
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

## Proje yapısı

```text
backend/
  accounts/         kullanıcı modeli, kayıt ve JWT endpointleri
  notes/            kullanıcıya özel not API'si
  config/           Django ayarları ve ana URL yönlendirmesi
frontend/
  public/           statik dosyalar
  src/api/          Axios istemcileri ve token yenileme
  src/components/   ortak arayüz bileşenleri
  src/context/      kimlik doğrulama durumu
  src/pages/        sayfa bileşenleri
  src/__tests__/    frontend testleri
docs/                ayrıntılı geliştirici dokümanları
```

## Ayrıntılı dokümantasyon

- [API referansı](docs/API.md)
- [Geliştirme ve doğrulama rehberi](docs/DEVELOPMENT.md)
- [Güvenlik politikası](SECURITY.md)

## Lisans

Bu proje [MIT Lisansı](LICENSE.md) ile sunulmaktadır.
