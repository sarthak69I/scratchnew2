import { NextResponse } from 'next/server';

export async function POST(req) {
    const data = await req.json();
    console.log('Telegram Mini App error:', data);
    return NextResponse.json({ ok: true });
}
