
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
      if (next.startsWith('/auth/update-password')) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Handle errors or invalid requests
  console.error("Auth callback error: No code or exchange failed.");
  const errorRedirectUrl = new URL('/login', origin);
  errorRedirectUrl.searchParams.set('error', 'Authentication failed. The link may be invalid or expired.');
  if (next.startsWith('/auth/update-password')) {
      const updatePasswordUrl = new URL('/auth/update-password', origin);
      updatePasswordUrl.searchParams.set('error', 'The password reset link is invalid or has expired. Please request a new one.');
      return NextResponse.redirect(updatePasswordUrl);
  }

  return NextResponse.redirect(errorRedirectUrl);
}
