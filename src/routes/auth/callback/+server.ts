import { redirect } from '@sveltejs/kit';

export const GET = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/battle';

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      throw redirect(303, next);
    }
  }

  // If something goes wrong, send them back to login
  throw redirect(303, '/login');
};
