import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear the access token cookie by setting its value to empty and maxAge to 0
    response.cookies.set('access_token', '', {
      httpOnly: true,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}