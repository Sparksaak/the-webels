
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  const statusPageUrl = new URL('/auth/status', origin);

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
        statusPageUrl.searchParams.set('success', 'true');
        statusPageUrl.searchParams.set('message', 'Email confirmed successfully! You can now log in.');
        return NextResponse.redirect(statusPageUrl);
    }
  }

  console.error("Auth callback error: No code or exchange failed.");
  statusPageUrl.searchParams.set('success', 'false');
  statusPageUrl.searchParams.set('error', 'Authentication failed. The confirmation link may be invalid or expired. Please try signing up again.');
  return NextResponse.redirect(statusPageUrl);
}
