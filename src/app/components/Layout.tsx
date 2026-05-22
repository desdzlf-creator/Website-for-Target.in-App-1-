import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router'; // Mengimpor Outlet resmi dari react-router
import { supabase } from '../utils/supabaseClient';

export function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-[220px] p-4 lg:p-8 pt-20 lg:pt-0">
        {/* Outlet ini yang bertugas merender Dashboard, DaftarKegiatan, atau InputKegiatan */}
        <Outlet />
      </div>
    </div>
  );
}
