
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';

export async function signup(prevState: { error: string } | null, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = 'student'; // Force all new signups to be students
  const learningPreference = formData.get('learningPreference') as string | null;

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const origin = headers().get('origin');
  const emailRedirectTo = `${origin}/auth/callback`;

  const userData: { [key: string]: any } = {
    full_name: name,
    role: role,
  };

  if (role === 'student' && learningPreference) {
    userData.learning_preference = learningPreference;
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: emailRedirectTo,
    },
  });

  if (signUpError) {
    console.error('Signup Error:', signUpError.message);
    if (signUpError.message.includes('User already registered')) {
        return { error: 'An account with this email already exists.' };
    }
    return { error: signUpError.message };
  }
  
  redirect(`/auth/confirm-email?type=signup`);
}


export async function login(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

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
    if (error.message.includes("Invalid login credentials")) {
        return { error: 'Invalid email or password.' };
    }
    return { error: 'Could not authenticate user' };
  }
  
  return { success: true };
}

export async function loginWithMagicLink(prevState: { error?: string } | null, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required.' };
  }

  const origin = headers().get('origin');
  const redirectUrl = `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error('Magic link error:', error.message);
    return { error: 'Could not send magic link. Please try again.' };
  }

  redirect('/auth/confirm-email?type=magic-link');
}


export async function logout() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
    redirect('/login');
}
