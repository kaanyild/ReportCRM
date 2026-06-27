import { NextResponse } from 'next/server';
import { deleteClient, saveClient } from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    deleteClient(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Müşteri silinemedi' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    saveClient({ ...data, id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Müşteri güncellenemedi' }, { status: 500 });
  }
}

