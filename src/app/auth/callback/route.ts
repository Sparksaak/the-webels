
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // The 'next' parameter is used for various auth flows to redirect after success.
  // It defaults to '/dashboard' for general sign-ins.
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // For email confirmations and magic links, we can redirect to 'next'.
      // For password resets, 'next' will be '/auth/update-password',
      // but Supabase handles the session creation and redirect on the client.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Handle password recovery flow, which doesn't use a `code`.
  // The token is in the URL fragment and handled client-side on the update-password page.
  // If 'next' is for updating the password, just redirect there.
  if (next.startsWith('/auth/update-password')) {
      return NextResponse.redirect(`${origin}${next}`);
  }


  // Handle errors or invalid requests by redirecting to a generic error page or login.
  console.error("Auth callback error: No code provided or session exchange failed.");
  const errorRedirectUrl = new URL('/login', origin);
  errorRedirectUrl.searchParams.set('error', 'Authentication failed. The link may be invalid or expired.');
  return NextResponse.redirect(errorRedirectUrl);
}
