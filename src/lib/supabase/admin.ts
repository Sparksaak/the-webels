
import { createClient } from '@supabase/supabase-js';

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server environment.
// Never expose this key to the client-side.
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            // Fix for "Error: Error sending request: TypeError: fetch failed"
            // https://github.com/supabase/supabase-js/issues/867
            fetch: (...args) => fetch(...args),
        },
    }
);

// Helper view to get user roles
export const users_with_roles = supabaseAdmin.from('users_with_roles').select('*');
