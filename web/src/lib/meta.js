import axios from 'axios';
import dayjs from 'dayjs';

const BASE_URL = 'https://graph.facebook.com/v25.0';

export async function getMetaReport(adAccountId, accessToken, startDate, endDate) {
  const cleanId = adAccountId.replace(/[^0-9]/g, '');
  const accountId = `act_${cleanId}`;

  try {
    // 1. Campaign Aggregate Data
    const campaignParams = {
      access_token: accessToken,
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      fields: 'campaign_name,impressions,clicks,spend,ctr,cpc,cpm,reach,conversions,cost_per_conversion',
      level: 'campaign',
      limit: 50,
    };

    const { data: campaignData } = await axios.get(`${BASE_URL}/${accountId}/insights`, { params: campaignParams });
    const kampanyalar = campaignData.data || [];

    // 2. Daily Account Data for Charts
    const dailyParams = {
      access_token: accessToken,
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      fields: 'spend,impressions,clicks,conversions',
      level: 'account',
      time_increment: 1, // Daily breakdown
    };

    const { data: dailyDataRes } = await axios.get(`${BASE_URL}/${accountId}/insights`, { params: dailyParams });
    const dailyData = dailyDataRes.data || [];

    const chartData = dailyData.map(d => ({
      date: dayjs(d.date_start).format('DD MMM'),
      harcama: parseFloat(d.spend || 0),
      tiklama: parseInt(d.clicks || 0),
      gosterim: parseInt(d.impressions || 0),
      donusum: parseInt(d.conversions || 0)
    }));

    // 3. Demographics Data
    const demoParams = {
      access_token: accessToken,
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      fields: 'impressions',
      level: 'account',
      breakdowns: 'age,gender',
    };

    const { data: demoDataRes } = await axios.get(`${BASE_URL}/${accountId}/insights`, { params: demoParams });
    const demoData = demoDataRes.data || [];

    const ageDataMap = {};
    const genderDataMap = {};

    demoData.forEach(d => {
      if (d.age) {
        ageDataMap[d.age] = (ageDataMap[d.age] || 0) + parseInt(d.impressions || 0);
      }
      if (d.gender && d.gender !== 'unknown') {
        const g = d.gender === 'male' ? 'Erkek' : (d.gender === 'female' ? 'Kadın' : d.gender);
        genderDataMap[g] = (genderDataMap[g] || 0) + parseInt(d.impressions || 0);
      }
    });

    const demographics = {
      age: Object.keys(ageDataMap).map(k => ({ age: k, impressions: ageDataMap[k] })).sort((a,b) => b.impressions - a.impressions).slice(0,5),
      gender: Object.keys(genderDataMap).map(k => ({ name: k, value: genderDataMap[k] }))
    };

    return {
      toplamHarcama: kampanyalar.reduce((t, k) => t + parseFloat(k.spend || 0), 0).toFixed(2),
      toplamGosteri: kampanyalar.reduce((t, k) => t + parseInt(k.impressions || 0), 0),
      toplamErisim: kampanyalar.reduce((t, k) => t + parseInt(k.reach || 0), 0),
      toplamTiklama: kampanyalar.reduce((t, k) => t + parseInt(k.clicks || 0), 0),
      toplamDonusum: kampanyalar.reduce((t, k) => t + parseInt(k.conversions || 0), 0),
      genelCTR: ortalamaCTR(kampanyalar),
      ortalamaCPM: ortalamaCPM(kampanyalar),
      demographics,
      kampanyalar: kampanyalar.map(k => ({
        ad: k.campaign_name,
        harcama: parseFloat(k.spend || 0).toFixed(2),
        gosterim: parseInt(k.impressions || 0),
        erisim: parseInt(k.reach || 0),
        tiklama: parseInt(k.clicks || 0),
        ctr: parseFloat(k.ctr || 0).toFixed(2),
        cpc: parseFloat(k.cpc || 0).toFixed(2),
        cpm: parseFloat(k.cpm || 0).toFixed(2),
        donusum: parseInt(k.conversions || 0),
        donusumMaliyeti: parseFloat(k.cost_per_conversion || 0).toFixed(2),
      })),
      chartData
    };
  } catch (error) {
    console.error('Meta Error:', error.response?.data || error.message);
    throw new Error('Meta verisi çekilemedi: ' + (error.response?.data?.error?.message || error.message));
  }
}

function ortalamaCTR(kampanyalar) {
  if (!kampanyalar.length) return '0.00';
  const toplam = kampanyalar.reduce((t, k) => t + parseFloat(k.ctr || 0), 0);
  return (toplam / kampanyalar.length).toFixed(2);
}

function ortalamaCPM(kampanyalar) {
  if (!kampanyalar.length) return '0.00';
  const toplam = kampanyalar.reduce((t, k) => t + parseFloat(k.cpm || 0), 0);
  return (toplam / kampanyalar.length).toFixed(2);
}
