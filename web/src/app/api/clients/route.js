import { NextResponse } from 'next/server';
import { getClients, saveClient } from '@/lib/db';

export async function GET() {
  try {
    const clients = getClients();
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: 'Müşteriler alınamadı' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    saveClient(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Müşteri eklenemedi' }, { status: 500 });
  }
}
