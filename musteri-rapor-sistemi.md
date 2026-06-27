# 📊 Müşteri Rapor Sistemi
### GA4 + Meta Ads → PDF Rapor | Google IDX Kurulum Rehberi

---

## 🗂️ Proje Yapısı

```
rapor-sistemi/
├── .idx/
│   └── dev.nix              # IDX ortam tanımı
├── src/
│   ├── index.js             # Ana uygulama
│   ├── ga4.js               # Google Analytics 4 veri çekme
│   ├── meta.js              # Meta Ads veri çekme
│   ├── report.js            # PDF rapor oluşturma
│   └── template.html        # Rapor HTML şablonu
├── .env.example             # Ortam değişkenleri örneği
├── package.json
└── README.md
```

---

## ⚙️ IDX Ortam Kurulumu

### `.idx/dev.nix`

```nix
{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.chromium          # Puppeteer için (PDF üretimi)
  ];

  env = {
    PUPPETEER_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
  };

  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm" "run" "dev"];
        manager = "web";
        port = 3000;
      };
    };
  };
}
```

---

## 🔑 API Bağlantıları

### Gerekli Credentials

| Servis | Ne Lazım | Nereden Alınır |
|--------|----------|----------------|
| Google Analytics 4 | Service Account JSON + Property ID | [Google Cloud Console](https://console.cloud.google.com) |
| Meta Ads | Access Token + Ad Account ID | [Meta Business Settings](https://business.facebook.com) |

### `.env.example`

```env
# Google Analytics 4
GA4_PROPERTY_ID=properties/XXXXXXXXX
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Meta Ads
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxx
META_AD_ACCOUNT_ID=act_XXXXXXXXXX

# Rapor Ayarları
REPORT_DATE_RANGE=last_30d        # last_7d | last_30d | last_90d
CLIENT_NAME=Müşteri Adı
OUTPUT_DIR=./raporlar
```

---

## 📦 Bağımlılıklar

### `package.json`

```json
{
  "name": "rapor-sistemi",
  "version": "1.0.0",
  "scripts": {
    "dev": "node src/index.js",
    "rapor": "node src/index.js --generate",
    "test": "node src/index.js --test-connections"
  },
  "dependencies": {
    "@google-analytics/data": "^4.3.0",
    "puppeteer-core": "^22.0.0",
    "axios": "^1.7.0",
    "dotenv": "^16.4.0",
    "dayjs": "^1.11.0",
    "handlebars": "^4.7.0"
  }
}
```

---

## 🔌 GA4 Modülü

### `src/ga4.js`

```javascript
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
require('dotenv').config();

const client = new BetaAnalyticsDataClient();

async function getGA4Raporu(baslangic, bitis) {
  const [response] = await client.runReport({
    property: process.env.GA4_PROPERTY_ID,
    dateRanges: [{ startDate: baslangic, endDate: bitis }],
    dimensions: [
      { name: 'sessionDefaultChannelGroup' },
      { name: 'country' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'conversions' },
    ],
  });

  return {
  toplamOturum: response.rows?.reduce((t, r) => t + parseInt(r.metricValues[0].value), 0),
  toplamKullanici: response.rows?.reduce((t, r) => t + parseInt(r.metricValues[1].value), 0),
  kanallar: response.rows?.map(r => ({
    kanal: r.dimensionValues[0].value,
    oturum: parseInt(r.metricValues[0].value),
    kullanici: parseInt(r.metricValues[1].value),
    hemeGitme: parseFloat(r.metricValues[2].value).toFixed(1),
    ortSure: formatSure(parseFloat(r.metricValues[3].value)),
    donusum: parseInt(r.metricValues[4].value),
  })) || [],
  };
}

function formatSure(saniye) {
  const dk = Math.floor(saniye / 60);
  const sn = Math.floor(saniye % 60);
  return `${dk}dk ${sn}sn`;
}

module.exports = { getGA4Raporu };
```

---

## 📣 Meta Ads Modülü

### `src/meta.js`

```javascript
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://graph.facebook.com/v19.0';

async function getMetaRaporu(baslangic, bitis) {
  const params = {
    access_token: process.env.META_ACCESS_TOKEN,
    time_range: JSON.stringify({ since: baslangic, until: bitis }),
    fields: 'campaign_name,impressions,clicks,spend,ctr,cpc,conversions,cost_per_conversion',
    level: 'campaign',
    limit: 50,
  };

  const { data } = await axios.get(
    `${BASE_URL}/${process.env.META_AD_ACCOUNT_ID}/insights`,
    { params }
  );

  const kampanyalar = data.data || [];

  return {
    toplamHarcama: kampanyalar.reduce((t, k) => t + parseFloat(k.spend || 0), 0).toFixed(2),
    toplamGosteri: kampanyalar.reduce((t, k) => t + parseInt(k.impressions || 0), 0),
    toplamTiklama: kampanyalar.reduce((t, k) => t + parseInt(k.clicks || 0), 0),
    genelCTR: ortalamaCTR(kampanyalar),
    kampanyalar: kampanyalar.map(k => ({
      ad: k.campaign_name,
      harcama: parseFloat(k.spend || 0).toFixed(2),
      gosterim: parseInt(k.impressions || 0),
      tiklama: parseInt(k.clicks || 0),
      ctr: parseFloat(k.ctr || 0).toFixed(2),
      cpc: parseFloat(k.cpc || 0).toFixed(2),
      donusum: parseInt(k.conversions || 0),
      donusumMaliyeti: parseFloat(k.cost_per_conversion || 0).toFixed(2),
    })),
  };
}

function ortalamaCTR(kampanyalar) {
  if (!kampanyalar.length) return '0.00';
  const toplam = kampanyalar.reduce((t, k) => t + parseFloat(k.ctr || 0), 0);
  return (toplam / kampanyalar.length).toFixed(2);
}

module.exports = { getMetaRaporu };
```

---

## 📄 PDF Rapor Modülü

### `src/report.js`

```javascript
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const dayjs = require('dayjs');
require('dotenv').config();

async function pdfRaporOlustur(ga4Veri, metaVeri) {
  // HTML şablonunu yükle
  const sablonMetni = fs.readFileSync(
    path.join(__dirname, 'template.html'), 'utf8'
  );
  const sablon = Handlebars.compile(sablonMetni);

  const html = sablon({
    musteriAdi: process.env.CLIENT_NAME,
    olusturulmaTarihi: dayjs().format('DD MMMM YYYY'),
    ga4: ga4Veri,
    meta: metaVeri,
  });

  // PDF üret
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const outputDir = process.env.OUTPUT_DIR || './raporlar';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const dosyaAdi = `${outputDir}/rapor_${dayjs().format('YYYY-MM-DD')}.pdf`;

  await page.pdf({
    path: dosyaAdi,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });

  await browser.close();
  console.log(`✅ Rapor oluşturuldu: ${dosyaAdi}`);
  return dosyaAdi;
}

module.exports = { pdfRaporOlustur };
```

---

## 🚀 Ana Uygulama

### `src/index.js`

```javascript
const { getGA4Raporu } = require('./ga4');
const { getMetaRaporu } = require('./meta');
const { pdfRaporOlustur } = require('./report');
const dayjs = require('dayjs');
require('dotenv').config();

function tarihHesapla(aralik) {
  const bugun = dayjs().format('YYYY-MM-DD');
  const gunSayisi = aralik === 'last_7d' ? 7 : aralik === 'last_90d' ? 90 : 30;
  const baslangic = dayjs().subtract(gunSayisi, 'day').format('YYYY-MM-DD');
  return { baslangic, bitis: bugun };
}

async function raporOlustur() {
  console.log('📊 Rapor sistemi başlatılıyor...');

  const { baslangic, bitis } = tarihHesapla(process.env.REPORT_DATE_RANGE || 'last_30d');
  console.log(`📅 Tarih aralığı: ${baslangic} → ${bitis}`);

  const [ga4Veri, metaVeri] = await Promise.all([
    getGA4Raporu(baslangic, bitis),
    getMetaRaporu(baslangic, bitis),
  ]);

  console.log('✅ Veriler çekildi, PDF oluşturuluyor...');
  await pdfRaporOlustur(ga4Veri, metaVeri);
}

raporOlustur().catch(err => {
  console.error('❌ Hata:', err.message);
  process.exit(1);
});
```

---

## 🛠️ IDX'te Kurulum Adımları

```bash
# 1. Repoyu aç veya yeni proje başlat
# IDX'te "Import Repo" veya "New Project > Node.js"

# 2. Bağımlılıkları yükle
npm install

# 3. .env dosyasını oluştur
cp .env.example .env
# .env dosyasını düzenle, API bilgilerini gir

# 4. GA4 Service Account JSON dosyasını proje köküne koy
# service-account.json

# 5. Bağlantıları test et
npm test

# 6. Rapor oluştur
npm run rapor
```

---

## 📅 Otomatik Rapor (Cron)

Aylık otomatik rapor için Google Cloud Scheduler veya basit bir cron kullanabilirsin:

```bash
# Her ayın 1'inde saat 09:00'da rapor oluştur
0 9 1 * * cd /path/to/rapor-sistemi && npm run rapor
```

---

## 🔗 Faydalı Linkler

- [GA4 Data API Dokümantasyonu](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-api)
- [Google IDX](https://idx.dev)
- [Service Account Oluşturma](https://console.cloud.google.com/iam-admin/serviceaccounts)

---

> 💡 **İpucu:** Önce `npm test` ile bağlantıları doğrula, sonra rapor oluştur. Meta Access Token'ın 60 günde bir yenilenmesi gerekebilir — uzun ömürlü token için System User kullan.
