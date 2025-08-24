
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function getDashboardData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: usersData, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, role, learning_preference');

  if (usersError) {
    console.error('Error fetching users with admin client:', usersError);
    throw usersError;
  }

  if (user.user_metadata.role === 'teacher') {
    const students = usersData.filter(u => u.role === 'student');
    return { students };
  }

  if (user.user_metadata.role === 'student') {
    const teacher = usersData.find(u => u.role === 'teacher') || null;
    return { teacher };
  }

  return {};
}
