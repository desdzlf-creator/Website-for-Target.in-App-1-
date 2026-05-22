import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Home, Calendar, Bell, BarChart3, User, LogOutIcon, Menu, X } from 'lucide-react';
//@ts-ignore
import logoKeSamping from '../../imports/logo_ke_samping.png';

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Semua Kegiatan', path: '/daftar-kegiatan' },
    { icon: Bell, label: 'Notifikasi', path: '/notifikasi' },
    { icon: BarChart3, label: 'Dashboard Analitik', path: '/dashboard-analitik' },
    { icon: User, label: 'Profil', path: '/profil' },
    { icon: LogOutIcon, label: 'Logout', path: '/logout' },
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-[220px] bg-[#FFBF00] flex flex-col">
        <div className="flex items-center justify-center px-4 py-5">
          <img
            src={logoKeSamping}
            alt="Target.in"
            className="h-10 w-auto object-contain"
          />
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-[#FFBF00]'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="lg:hidden fixed inset-x-0 top-0 z-40 bg-[#FFBF00] px-4 py-3 flex items-center justify-between">
        <img src={logoKeSamping} alt="Target.in" className="h-8 w-auto object-contain" />
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40"
          onClick={closeMobile}
        >
          <div
            className="absolute left-0 top-0 h-full w-[80vw] max-w-[280px] bg-[#FFBF00] p-4 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <img src={logoKeSamping} alt="Target.in" className="h-8 w-auto object-contain" />
              <button
                type="button"
                onClick={closeMobile}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {navItems.map(({ icon: Icon, label, path }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={closeMobile}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-[#FFBF00]'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}