# API Referansı

Varsayılan temel adres: `http://127.0.0.1:8000`

İstek ve yanıt gövdeleri JSON biçimindedir. Not endpointleri şu başlığı ister:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

## Kimlik doğrulama

### Kullanıcı oluşturma

`POST /api/accounts/register/`

```json
{
  "email": "user@example.com",
  "user_name": "exampleuser",
  "password": "StrongPass1!",
  "match_password": "StrongPass1!"
}
```

Başarılı yanıt `201 Created` durumuyla e-posta ve kullanıcı adını döndürür.
Parolalar yanıta eklenmez ve Django'nun etkin parola politikasını karşılamalıdır.

### Token alma

`POST /api/accounts/token/`

```json
{
  "email": "user@example.com",
  "password": "StrongPass1!"
}
```

Örnek `200 OK` yanıtı:

```json
{
  "refresh": "<refresh-token>",
  "access": "<access-token>"
}
```

Access token ayrıca `email` ve `user_name` claim'lerini içerir.

### Access token yenileme

`POST /api/accounts/token/refresh/`

```json
{
  "refresh": "<refresh-token>"
}
```

Başarılı yanıt yeni bir `access` token döndürür. Token rotasyonu sırasında yeni
bir `refresh` token da dönebilir.

## Notlar

Her not yalnızca sahibi tarafından görülebilir veya değiştirilebilir. Başka bir
kullanıcıya ait ID ile yapılan detay istekleri `404 Not Found` döndürür.

### Notları listeleme

`GET /api/notes/`

`200 OK` ile güncellenme tarihine göre yeniden eskiye sıralı bir dizi döndürür.

### Not oluşturma

`POST /api/notes/`

```json
{
  "title": "Alışveriş listesi",
  "body": "Süt, kahve, ekmek"
}
```

`title` ve `body` isteğe bağlıdır. Başarılı yanıt `201 Created` döndürür.

### Not detayını alma

`GET /api/notes/{id}/`

### Notu güncelleme

Kısmi güncelleme için `PATCH /api/notes/{id}/`:

```json
{
  "body": "Güncellenmiş içerik"
}
```

Tüm düzenlenebilir alanları göndermek için `PUT` da desteklenir.

### Notu silme

`DELETE /api/notes/{id}/`

Başarılı silme işlemi gövdesiz `204 No Content` döndürür.

## Not yanıt şeması

```json
{
  "id": 1,
  "user": "exampleuser",
  "title": "Alışveriş listesi",
  "body": "Süt, kahve, ekmek",
  "created": "2026-08-01T12:00:00Z",
  "updated": "2026-08-01T12:05:00Z"
}
```

`id`, `user`, `created` ve `updated` alanları salt okunurdur.

## Yaygın hata durumları

| Durum | Anlamı |
| --- | --- |
| `400 Bad Request` | Validasyon hatası veya geçersiz istek gövdesi |
| `401 Unauthorized` | Token eksik, geçersiz veya süresi dolmuş |
| `404 Not Found` | Kaynak yok ya da oturum açan kullanıcıya ait değil |
