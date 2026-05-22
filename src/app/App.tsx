import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { supabase } from './utils/supabaseClient';
import { saveUser, getUser } from './utils/userStore';

export default function App() {
  useEffect(() => {
    // Cek session awal pas app pertama kali dibuka
    const restoreSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log('✅ RESTORE SESSION:', session);
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
        }

        if (session?.user) {
          const authUser = session.user;
          console.log('✅ Auth user found:', authUser.email, 'ID:', authUser.id);

          const nama =
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split('@')[0] ||
            'Pengguna';

          console.log('✅ Saving user with nama:', nama);
          await saveUser({
            nama,
            email: authUser.email ?? '',
          });

          const userProfile = await getUser();
          console.log('✅ User profile loaded:', userProfile);
        } else {
          console.log('⚠️ No active session on app startup');
        }
      } catch (err) {
        console.error('❌ restoreSession error:', err);
      }
    };

    restoreSession();

    // Listener auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 AUTH EVENT:', event);
      console.log('🔄 SESSION:', session);

      if (session?.user) {
        const authUser = session.user;
        console.log('✅ Auth state changed - user logged in:', authUser.email);

        const nama =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'Pengguna';

        console.log('✅ Saving user after auth change:', nama);
        await saveUser({
          nama,
          email: authUser.email ?? '',
        });

        await getUser();
      } else {
        console.log('✅ Auth state changed to signed out or no session');
        await getUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <RouterProvider router={router} />;
}

