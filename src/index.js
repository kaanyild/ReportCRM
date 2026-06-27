const { getGA4Raporu, testGA4Baglantisi } = require('./ga4');
const { getMetaRaporu, testMetaBaglantisi } = require('./meta');
const { pdfRaporOlustur } = require('./report');
const dayjs = require('dayjs');
require('dotenv').config();

/**
 * Tarih aralığını hesaplar.
 * @param {string} aralik - 'last_7d', 'last_30d', veya 'last_90d'
 * @returns {{ baslangic: string, bitis: string }}
 */
function tarihHesapla(aralik) {
  const bugun = dayjs().format('YYYY-MM-DD');
  const gunMap = {
    'last_7d': 7,
    'last_30d': 30,
    'last_90d': 90,
  };
  const gunSayisi = gunMap[aralik] || 30;
  const baslangic = dayjs().subtract(gunSayisi, 'day').format('YYYY-MM-DD');
  return { baslangic, bitis: bugun };
}

/**
 * API bağlantılarını test eder.
 */
async function baglantiTesti() {
  console.log('\n🔌 Bağlantı Testi Başlatılıyor...\n');
  console.log('─'.repeat(40));

  console.log('\n📈 Google Analytics 4:');
  const ga4Ok = await testGA4Baglantisi();

  console.log('\n📣 Meta Ads:');
  const metaOk = await testMetaBaglantisi();

  console.log('\n' + '─'.repeat(40));

  if (ga4Ok && metaOk) {
    console.log('\n✅ Tüm bağlantılar başarılı! Rapor oluşturmaya hazır.\n');
    console.log('   Rapor oluşturmak için: npm run rapor\n');
  } else {
    console.log('\n⚠️  Bazı bağlantılarda sorun var. Lütfen .env dosyasını kontrol edin.\n');
    process.exit(1);
  }
}

/**
 * Tam rapor oluşturma akışı.
 */
async function raporOlustur() {
  console.log('\n📊 Rapor Sistemi Başlatılıyor...\n');
  console.log('─'.repeat(40));

  const aralik = process.env.REPORT_DATE_RANGE || 'last_30d';
  const { baslangic, bitis } = tarihHesapla(aralik);
  console.log(`📅 Tarih aralığı: ${baslangic} → ${bitis}`);
  console.log(`👤 Müşteri: ${process.env.CLIENT_NAME || 'Belirtilmemiş'}`);
  console.log('─'.repeat(40));

  // Verileri paralel çek
  console.log('\n⏳ Veriler çekiliyor...');
  const [ga4Veri, metaVeri] = await Promise.all([
    getGA4Raporu(baslangic, bitis),
    getMetaRaporu(baslangic, bitis),
  ]);

  console.log(`   📈 GA4: ${ga4Veri.toplamOturum} oturum, ${ga4Veri.toplamKullanici} kullanıcı`);
  console.log(`   📣 Meta: ₺${metaVeri.toplamHarcama} harcama, ${metaVeri.toplamTiklama} tıklama`);

  // PDF oluştur
  console.log('\n📄 PDF oluşturuluyor...');
  const dosyaYolu = await pdfRaporOlustur(ga4Veri, metaVeri, baslangic, bitis);

  console.log('\n' + '─'.repeat(40));
  console.log('🎉 Rapor başarıyla oluşturuldu!');
  console.log(`📂 Dosya: ${dosyaYolu}`);
  console.log('─'.repeat(40) + '\n');
}

// CLI yönlendirmesi
const args = process.argv.slice(2);

if (args.includes('--test-connections')) {
  baglantiTesti().catch(err => {
    console.error('❌ Test hatası:', err.message);
    process.exit(1);
  });
} else {
  raporOlustur().catch(err => {
    console.error('\n❌ Hata:', err.message);
    if (err.response?.data) {
      console.error('   API Yanıtı:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  });
}
