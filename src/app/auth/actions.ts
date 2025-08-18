
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signup(prevState: { error: string } | null, formData: FormData) {
  const supabase = createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role: role,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (signUpError) {
    console.error('Signup Error:', signUpError.message);
    return { error: signUpError.message };
  }
  
  // For now, redirect to dashboard. In a real app, you'd want to show a "check your email" message.
  redirect(`/dashboard`);
}


export async function login(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Login error:", error.message)
    return { error: 'Could not authenticate user' };
  }
  
  return { success: true };
}

export async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/login');
}
