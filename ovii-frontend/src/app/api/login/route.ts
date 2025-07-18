import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { access, refresh } = await request.json();

    if (!access) {
      throw new Error('Access token is required');
    }

    const response = NextResponse.json({ success: true });

    // Set the access token in a secure, httpOnly cookie
    response.cookies.set('access_token', access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}