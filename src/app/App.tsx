import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { supabase } from './utils/supabaseClient';

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
        } else {
          console.log('⚠️ No active session on app startup');
        }
      } catch (err) {
        console.error('❌ restoreSession error:', err);
      }
    };

    restoreSession();

    // Listener auth - Langsung responsif tanpa blocked fungsi lain
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 AUTH EVENT:', event);
      console.log('🔄 SESSION:', session);

      if (session?.user) {
        console.log('✅ Auth state changed - user logged in:', session.user.email);
      } else {
        console.log('✅ Auth state changed to signed out or no session');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <RouterProvider router={router} />;
}
