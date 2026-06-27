const { BetaAnalyticsDataClient } = require('@google-analytics/data');
require('dotenv').config();

const client = new BetaAnalyticsDataClient();

/**
 * GA4 verilerini çeker ve rapor formatında döndürür.
 * @param {string} baslangic - Başlangıç tarihi (YYYY-MM-DD)
 * @param {string} bitis - Bitiş tarihi (YYYY-MM-DD)
 * @returns {Object} GA4 rapor verileri
 */
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
    toplamOturum: response.rows?.reduce((t, r) => t + parseInt(r.metricValues[0].value), 0) || 0,
    toplamKullanici: response.rows?.reduce((t, r) => t + parseInt(r.metricValues[1].value), 0) || 0,
    toplamDonusum: response.rows?.reduce((t, r) => t + parseInt(r.metricValues[4].value), 0) || 0,
    ortHemenGitme: response.rows?.length
      ? (response.rows.reduce((t, r) => t + parseFloat(r.metricValues[2].value), 0) / response.rows.length * 100).toFixed(1)
      : '0.0',
    kanallar: response.rows?.map(r => ({
      kanal: r.dimensionValues[0].value,
      ulke: r.dimensionValues[1].value,
      oturum: parseInt(r.metricValues[0].value),
      kullanici: parseInt(r.metricValues[1].value),
      hemenGitme: (parseFloat(r.metricValues[2].value) * 100).toFixed(1),
      ortSure: formatSure(parseFloat(r.metricValues[3].value)),
      donusum: parseInt(r.metricValues[4].value),
    })) || [],
  };
}

/**
 * Saniye cinsinden süreyi okunabilir formata çevirir.
 * @param {number} saniye
 * @returns {string} "Xdk Ysn" formatında süre
 */
function formatSure(saniye) {
  const dk = Math.floor(saniye / 60);
  const sn = Math.floor(saniye % 60);
  return `${dk}dk ${sn}sn`;
}

/**
 * GA4 bağlantısını test eder.
 * @returns {boolean} Bağlantı başarılı mı
 */
async function testGA4Baglantisi() {
  try {
    const [response] = await client.runReport({
      property: process.env.GA4_PROPERTY_ID,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }],
    });
    console.log('  ✅ GA4 bağlantısı başarılı');
    console.log(`     Son 7 gün oturum: ${response.rows?.[0]?.metricValues?.[0]?.value || 0}`);
    return true;
  } catch (err) {
    console.error('  ❌ GA4 bağlantı hatası:', err.message);
    return false;
  }
}

module.exports = { getGA4Raporu, testGA4Baglantisi };
