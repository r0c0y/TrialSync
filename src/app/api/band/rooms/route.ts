import { NextResponse } from 'next/server';
import { band } from '@/lib/band';

export async function GET() {
  try {
    const result = await band.getRooms();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
