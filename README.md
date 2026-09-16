# Velora Life — Bağımsız web uygulaması

Aynı Velora Life tasarımı, ürün görselleri, mobil menü, müşteri hesabı ve kurumsal yönetim paneliyle standart Node.js uygulaması.

## Teknoloji

- Next.js 16, React 19, TypeScript ve Tailwind CSS.
- Node.js 24 veya üzeri; SQLite veritabanı Node'un yerleşik sürücüsüyle kullanılır.
- E-posta/şifre üyeliği; scrypt ile şifre özeti; veritabanında özeti tutulan rastgele oturum anahtarı; HttpOnly ve SameSite çerezi.
- Node.js çalıştırabilen bir bilgisayar veya kalıcı diski olan VPS/sunucu gerekir. Yalnızca PHP/statik dosya barındıran hosting yeterli değildir.

## Windows'ta kurulum

1. Node.js 24 veya üzerini kurun. ZIP dosyasını çıkartıp `velora-life` klasörünü VS Code'da açın.
2. PowerShell terminalinde:

```powershell
Copy-Item .env.example .env
npm ci
npm run db:migrate
npm run admin:create
npm run dev
```

Yönetici oluşturma komutu sizden e-posta, ad soyad ve en az 12 karakterli şifre ister. Şifre yazarken ekranda görünmez. Hazır veya varsayılan yönetici şifresi yoktur.

Tarayıcıda http://localhost:3000 adresini açın. `/account` üzerinden yönetici hesabınızla giriş yapın, ardından `/admin` adresine gidin. İlk stokları **Ürünler & stok** bölümünden girin. Yeni veritabanında stoklar sıfırdır; stok girişi yapılan ürünler siparişe açılır.

## macOS / Linux'ta kurulum

```bash
cp .env.example .env
npm ci
npm run db:migrate
npm run admin:create
npm run dev
```

Bu sürümde Bash'e bağlı kurulum betikleri yoktur; Node komutları platformlar arasında aynıdır. Windows adımlarında yalnızca dosya kopyalama komutu farklıdır.

### Docker alternatifi

Docker yapılandırması pakete dahildir:

```bash
docker compose up -d --build
docker compose exec velora npm run admin:create
```

SQLite verileri `velora_data` isimli kalıcı volume içinde tutulur. Yerelde http://localhost:3000 adresinden açılır. Canlı kullanımda `.env` dosyasında HTTPS alan adını ayarlayın ve ters vekili yapılandırın. Docker imajı bu proje ortamında çalıştırılmadı; doğrulama doğrudan Node.js ile yapıldı.

## Korunan özellikler

- Ana sayfa, ürünler, şirket bilgileri, topluluk ve hesap sayfaları.
- 9 ürün, mevcut fiyatlar ve 10 yerel görsel; mobil çekmece menüsü.
- Kayıt, giriş, çıkış, üyelik profili, davet kodu, sepet ve sipariş takibi.
- Yönetim özeti, siparişler, müşteri notları/segmentleri, ekip ağı, stok, CSV raporları, çalışan yetkileri ve işlem geçmişi.
- Müşteriye stok adedi gönderilmez; uygunluk bilgisi gösterilir. Sayılar çalışan API'sinde yetki kontrolünden sonra döner.
- Sipariş oluşumu ve stok düşümü tek veritabanı işlemiyle kaydedilir. Tekrarlanan istek ikinci stok düşümüne yol açmaz.
- Sevkiyat öncesi uygun iptal stokları yalnızca bir kez geri ekler. Mevcut sipariş/rol kontrolleri korunmuştur.

## Yönetim ve veri saklama

Herkese açık kayıtlar yalnızca müşteri hesabı oluşturur; ilk kayıt olan kişi yönetici olmaz. Yönetici sunucu terminalinden oluşturulur. Diğer çalışanlar normal kayıt olduktan ve profillerini tamamladıktan sonra yönetici panelinden yetkilendirilebilir.

Veriler `DATABASE_PATH` dosyasında kalıcıdır. Tek sunucu ve kalıcı disk kullanın; bu paket geçici diski olan serverless dağıtıma veya ayrı SQLite dosyaları kullanan çoklu sunuculara göre hazırlanmadı. Veritabanını `public/` altında tutmayın. Yedek için uygulamayı durdurup `data/` klasörünün tamamını kopyalayın veya SQLite'ın tutarlı yedekleme yöntemini kullanın. `data/` klasörünü silmek hesap, sipariş ve stok kayıtlarını siler.

Önceki yayının canlı müşteri, sipariş ve stok verileri bu kaynak paketine dahil değildir. Yeni kurulum temiz bir veritabanıyla başlar. Var olan hesapların taşınması ayrıca veri aktarımı ve yeni şifre oluşturma akışı gerektirir.

## Kapsam

Mevcut kapıda ödeme sipariş akışı korunmuştur. Gerçek kart tahsilatı, otomatik kargo entegrasyonu ve komisyon ödemesi eklenmemiştir. Otomatik e-posta doğrulama ve e-posta ile şifre sıfırlama servisi bu sürümde yoktur. Ürün ve şirket metinleri mevcut konsept mağazadan korunmuştur.

## Geliştirme ve testler

```bash
npm test
npm run build
```

Testler gerçek SQLite veritabanıyla üyelik/oturum güvenliğini, müşteri yetkilerini, stok gizliliğini, siparişleri, eşzamanlı istekleri ve iptal iadelerini kontrol eder. İstek çerezleri test ortamında taklit edilir; ayrıca üretim derlemesinde HTTP kontrolleri yapılır.

Kaynaklar: `app/` sayfalar ve API, `lib/` sunucu işlevleri, `scripts/` veritabanı ve yönetici kurulumu, `drizzle/` sıralı SQL geçişleri, `public/images/` görseller. Geçişler bir kez uygulanır ve `migrations` tablosunda kaydedilir. Yeni şema değişiklikleri için yeni numaralı SQL dosyası ekleyin; uygulanmış geçişleri değiştirmeyin.

## Kod düzeni

Hesap ekranları `components/account/`, yönetim panelindeki ortak kontroller ve formlar `components/admin/`, şirket içerikleri `components/storefront/` altında bulunur. İstekler `lib/api-client.ts`, CSV dışa aktarımı `lib/export-csv.ts`, oturum ve veritabanı işlemleri ilgili `lib/` modüllerinde toplanır. Ortak üyelik ve sipariş tipleri `types/commerce.ts` dosyasındadır.

Kurulum ve geliştirme bilgileri bu belgede tutulur. `.editorconfig` ve Prettier ayarları biçim tutarlılığını korur:

```bash
npm run format
npm run format:check
```
