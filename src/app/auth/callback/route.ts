
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Handle errors or invalid requests
  console.error("Auth callback error: No code or exchange failed.");
  const errorRedirectUrl = new URL('/login', origin);
  errorRedirectUrl.searchParams.set('error', 'Authentication failed. The link may be invalid or expired.');
  return NextResponse.redirect(errorRedirectUrl);
}
