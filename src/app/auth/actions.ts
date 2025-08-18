
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function signup(prevState: { error: string } | null, formData: FormData) {
  const supabase = createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  const origin = headers().get('origin');
  const emailRedirectTo = `${origin}/auth/callback`;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role: role,
      },
      emailRedirectTo: emailRedirectTo,
    },
  });

  if (signUpError) {
    console.error('Signup Error:', signUpError.message);
    return { error: signUpError.message };
  }
  
  redirect(`/auth/confirm-email`);
}


export async function login(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Login error:", error.message)
    if (error.message.includes("Email not confirmed")) {
        return { error: 'Please confirm your email before logging in.' };
    }
    return { error: 'Could not authenticate user' };
  }
  
  return { success: true };
}

export async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/login');
}
