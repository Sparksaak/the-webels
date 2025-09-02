
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

  // Use the admin client to fetch all users securely
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users with admin client:', usersError);
    throw usersError;
  }
  
  const allUsers = users.map(u => ({
      id: u.id,
      full_name: u.user_metadata.full_name || u.email,
      email: u.email,
      role: u.user_metadata.role as 'teacher' | 'student',
      learning_preference: u.user_metadata.learning_preference as 'online' | 'in-person' | undefined
  }));

  if (user.user_metadata.role === 'teacher') {
    const students = allUsers.filter(u => u.role === 'student');
    return { students };
  }

  if (user.user_metadata.role === 'student') {
    const teacher = allUsers.find(u => u.role === 'teacher') || null;
    return { teacher };
  }

  return {};
}
