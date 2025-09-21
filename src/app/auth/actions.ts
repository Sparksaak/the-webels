
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

export async function requestPasswordReset(origin: string, prevState: { error?: string } | null, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required.' };
  }
  
  const redirectUrl = `${origin}/auth/callback?next=/auth/update-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    console.error('Password reset error:', error.message);
    // To prevent email enumeration attacks, don't reveal if the email is registered or not.
    if(error.message.includes('For security purposes, you can only request this once every')) {
        return { error: "You've requested a password reset recently. Please check your email or wait a few minutes before trying again."}
    }
  }

  // Always redirect to a confirmation page, even if the email doesn't exist.
  redirect('/auth/confirm-email?type=password-reset');
}


export async function updatePasswordWithToken(prevState: { error?: string, success?: boolean } | null, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // This should not happen if the user came from a valid magic link, but as a safeguard.
  if (sessionError || !session) {
      return { error: 'You are not authenticated. Your password reset link may be invalid or expired.' };
  }
  
  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    console.error('Password update error:', updateError.message);
    return { error: 'Could not update password. Please try again.' };
  }
  
  // Log the user out from all sessions after a password update for security.
  await supabase.auth.signOut();

  return { success: true };
}
