#crunchbase

Bu servis, Crunchbase organizasyon sayfasını e-posta/şifre ile giriş yaparak (Cloudflare kontrolü dahil) kazıyıp JSON olarak döner.

## Kurulum

1. `.env` dosyasını oluşturun:

```
CRUNCHBASE_EMAIL=your-email@example.com
CRUNCHBASE_PASSWORD=your-password
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. Geliştirme ortamında çalıştırın:

```bash
npm start
```

## Kullanım

HTTP GET isteği:

```
GET /scrape?path=safebreach
```

Yanıt:

```json
{
  "legalName": "SafeBreach Inc.",
  "status": "Active",
  "website": "www.safebreach.com",
  "totalFunding": "$106.5M",
  "people": [...],
  "rounds": [...]
}
```

## Deploy

- GitHub’a push edip Railway üzerinden deploy edebilirsiniz.
- Railway, `CRUNCHBASE_EMAIL` ve `CRUNCHBASE_PASSWORD` ortam değişkenlerini alacak şekilde ayarlayın.
