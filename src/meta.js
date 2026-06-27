const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://graph.facebook.com/v25.0';

/**
 * Meta Ads verilerini çeker ve rapor formatında döndürür.
 * @param {string} baslangic - Başlangıç tarihi (YYYY-MM-DD)
 * @param {string} bitis - Bitiş tarihi (YYYY-MM-DD)
 * @returns {Object} Meta Ads rapor verileri
 */
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
    toplamDonusum: kampanyalar.reduce((t, k) => t + parseInt(k.conversions || 0), 0),
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

/**
 * Kampanyaların ortalama CTR değerini hesaplar.
 * @param {Array} kampanyalar
 * @returns {string} Ortalama CTR (yüzde olarak)
 */
function ortalamaCTR(kampanyalar) {
  if (!kampanyalar.length) return '0.00';
  const toplam = kampanyalar.reduce((t, k) => t + parseFloat(k.ctr || 0), 0);
  return (toplam / kampanyalar.length).toFixed(2);
}

/**
 * Meta Ads bağlantısını test eder.
 * @returns {boolean} Bağlantı başarılı mı
 */
async function testMetaBaglantisi() {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/${process.env.META_AD_ACCOUNT_ID}`,
      {
        params: {
          access_token: process.env.META_ACCESS_TOKEN,
          fields: 'name,account_status',
        },
      }
    );
    console.log('  ✅ Meta Ads bağlantısı başarılı');
    console.log(`     Hesap adı: ${data.name || 'Bilinmiyor'}`);
    return true;
  } catch (err) {
    console.error('  ❌ Meta Ads bağlantı hatası:', err.response?.data?.error?.message || err.message);
    return false;
  }
}

module.exports = { getMetaRaporu, testMetaBaglantisi };
