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
import { clearUser } from './utils/userStore';

export const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { index: true, Component: Home },
      {
        path: 'logout',
        loader: async () => {
          await clearUser();
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
        children: [
          { path: 'dashboard', Component: Dashboard },
          { path: 'daftar-kegiatan', Component: DaftarKegiatan },
          { path: 'input-kegiatan', Component: InputKegiatan }, // Terpasang rapi di dalam Layout sidebar!
          { path: 'notifikasi', Component: Notifikasi },
          { path: 'dashboard-analitik', Component: DashboardAnalitik },
          { path: 'profil', Component: Profil },
        ],
      },
    ],
  },
]);
