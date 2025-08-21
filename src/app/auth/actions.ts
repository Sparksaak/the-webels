
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function teacherExists(): Promise<boolean> {
  const supabase = createClient();
  const { data: users, error } = await supabase.from('users_with_roles').select('id').eq('role', 'teacher').limit(1);

  if (error) {
    console.error('Error checking for existing teacher:', error.message);
    return false; // Fail safe
  }
  
  return users && users.length > 0;
}

export async function signup(prevState: { error: string } | null, formData: FormData) {
  const supabase = createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const learningPreference = formData.get('learningPreference') as string | null;

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  // Check if a teacher account already exists if the user is trying to sign up as a teacher
  if (role === 'teacher') {
    const teacherAccountExists = await teacherExists();
    if (teacherAccountExists) {
      return { error: 'A teacher account already exists. Only one teacher account is allowed.' };
    }
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
    if (error.message.includes("Invalid login credentials")) {
        return { error: 'Invalid email or password.' };
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
