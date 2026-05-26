import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { supabase } from './utils/supabaseClient';
import { getUser } from './utils/userStore';

export default function App() {
  useEffect(() => {
    // Restore session saat app pertama kali dibuka
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
          console.log(
            '✅ Auth user found:',
            session.user.email,
            'ID:',
            session.user.id
          );

          // Ambil user dari store/database
          const userProfile = await getUser(session.user.id);

          console.log(
            '✅ User profile loaded:',
            userProfile
          );
        } else {
          console.log(
            '⚠️ No active session on app startup'
          );
        }
      } catch (err) {
        console.error(
          '❌ restoreSession error:',
          err
        );
      }
    };

    restoreSession();

    // Listener auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AUTH EVENT:', event);
        console.log('🔄 SESSION:', session);

        if (session?.user) {
          console.log(
            '✅ Auth state changed - user logged in:',
            session.user.email
          );

          await getUser(session.user.id);
        } else {
          console.log(
            '✅ Auth state changed to signed out or no session'
          );
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <RouterProvider router={router} />;
}
