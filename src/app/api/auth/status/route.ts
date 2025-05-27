import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if the user has a valid authentication cookie
    const authCookie = request.cookies.get('authenticated');
    
    if (authCookie?.value === 'true') {
      return NextResponse.json({ authenticated: true });
    } else {
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Authentication status check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}