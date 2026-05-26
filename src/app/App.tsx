import { createBrowserRouter, redirect } from 'react-router';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DaftarKegiatan } from './pages/DaftarKegiatan';
import { InputKegiatan } from './pages/InputKegiatan';
import { Notifikasi } from './pages/Notifikasi';
import { DashboardAnalitik } from './pages/DashboardAnalitik';
import { Profil } from './pages/Profil';
import { supabase } from './utils/supabaseClient';

// Satpam pelindung halaman dashboard (Pure Supabase Auth)
const protectedLoader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return redirect('/login');
  }
  return null;
};

export const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { index: true, Component: Home },
      {
        path: 'logout',
        loader: async () => {
          await supabase.auth.signOut();
          return redirect('/login');
        },
      },
      {
        path: 'login',
        Component: Login,
      },
      {
        path: 'register',
        Component: Register,
      },
      {
        path: '/',
        Component: Layout, // Pembungkus utama navbar kiri
        loader: protectedLoader, // Menjaga seluruh halaman di dalam layout ini
        children: [
          { path: 'dashboard', Component: Dashboard },
          { path: 'daftar-kegiatan', Component: DaftarKegiatan }, // ✅ BENER (Membuka list tabel)
          { path: 'input-kegiatan', Component: InputKegiatan },   // ✅ BENER (Membuka form input)
          { path: 'notifikasi', Component: Notifikasi },
          { path: 'dashboard-analitik', Component: DashboardAnalitik },
          { path: 'profil', Component: Profil },
        ],
      },
    ],
  },
]);
