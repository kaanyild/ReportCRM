import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { getGA4Report } from '@/lib/ga4';
import { getMetaReport } from '@/lib/meta';
import dayjs from 'dayjs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const days = parseInt(searchParams.get('days') || '30');

  if (!clientId) {
    return NextResponse.json({ error: 'Müşteri ID gerekli' }, { status: 400 });
  }

  const client = getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 });
  }

  const endDate = dayjs().format('YYYY-MM-DD');
  const startDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD');

  try {
    const [ga4Data, metaData] = await Promise.all([
      client.ga4PropertyId ? getGA4Report(client.ga4PropertyId, startDate, endDate) : null,
      (client.metaAdAccountId && client.metaAccessToken) 
        ? getMetaReport(client.metaAdAccountId, client.metaAccessToken, startDate, endDate) 
        : null
    ]);

    return NextResponse.json({
      clientName: client.name,
      period: `${startDate} — ${endDate}`,
      ga4: ga4Data,
      meta: metaData
    });
  } catch (error) {
    console.error('Report Error:', error);
    return NextResponse.json({ error: error.message || 'Rapor oluşturulurken hata oluştu' }, { status: 500 });
  }
}
