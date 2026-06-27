import { BetaAnalyticsDataClient } from '@google-analytics/data';
import dayjs from 'dayjs';

// process.env.GOOGLE_APPLICATION_CREDENTIALS automatically used
const client = new BetaAnalyticsDataClient();

export async function getGA4Report(propertyId, startDate, endDate) {
  try {
    // 1. Aggregate Data Request
    const [response] = await client.runReport({
      property: propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
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

    // 2. Daily Data for Charts
    const [dailyResponse] = await client.runReport({
      property: propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'conversions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    const toplamOturum = response.rows?.reduce((t, r) => t + parseInt(r.metricValues[0].value), 0) || 0;
    const toplamKullanici = response.rows?.reduce((t, r) => t + parseInt(r.metricValues[1].value), 0) || 0;
    const toplamDonusum = response.rows?.reduce((t, r) => t + parseInt(r.metricValues[4].value), 0) || 0;
    const ortHemenGitme = response.rows?.length
      ? (response.rows.reduce((t, r) => t + parseFloat(r.metricValues[2].value), 0) / response.rows.length * 100).toFixed(1)
      : '0.0';

    const kanallar = response.rows?.map(r => ({
      kanal: r.dimensionValues[0].value,
      ulke: r.dimensionValues[1].value,
      oturum: parseInt(r.metricValues[0].value),
      kullanici: parseInt(r.metricValues[1].value),
      hemenGitme: (parseFloat(r.metricValues[2].value) * 100).toFixed(1),
      ortSure: formatSure(parseFloat(r.metricValues[3].value)),
      donusum: parseInt(r.metricValues[4].value),
    })) || [];

    // Parse daily data for recharts
    const chartData = dailyResponse.rows?.map(r => ({
      date: dayjs(r.dimensionValues[0].value, 'YYYYMMDD').format('DD MMM'),
      oturum: parseInt(r.metricValues[0].value),
      donusum: parseInt(r.metricValues[1].value),
    })) || [];

    // 3. Devices Data
    const [deviceResponse] = await client.runReport({
      property: propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }],
    });

    const devices = deviceResponse.rows?.map(r => {
      const dName = r.dimensionValues[0].value;
      const name = dName === 'mobile' ? 'Mobil' : (dName === 'desktop' ? 'Masaüstü' : (dName === 'tablet' ? 'Tablet' : dName));
      return { name, value: parseInt(r.metricValues[0].value) };
    }) || [];

    return {
      toplamOturum,
      toplamKullanici,
      toplamDonusum,
      ortHemenGitme,
      devices,
      kanallar,
      chartData
    };
  } catch (error) {
    console.error('GA4 Error:', error.message);
    throw new Error('GA4 verisi çekilemedi: ' + error.message);
  }
}

function formatSure(saniye) {
  const dk = Math.floor(saniye / 60);
  const sn = Math.floor(saniye % 60);
  return `${dk}dk ${sn}sn`;
}
