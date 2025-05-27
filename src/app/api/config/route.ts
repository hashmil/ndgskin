// src/app/api/config/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    showControls: process.env.SHOW_CONTROLS === 'true'
  });
}