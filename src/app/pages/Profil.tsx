import { useState, useEffect } from 'react';
import { User, Mail, Settings, Save, CheckCircle2 } from 'lucide-react';
import { getUser, useUserStore, saveUser, getFirstName } from '../utils/userStore';
import { getKegiatan, type Kegiatan } from '../utils/kegiatanStore';

/* ── ambil inisial dari nama lengkap ── */
function getInitials(nama: string): string {
  const parts = nama.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Profil() {
  /* ── user state ── */
  const { user, getUser } = useUserStore();
  const [namaInput, setNamaInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [saved, setSaved] = useState(false);

  /* ── kegiatan stats ── */
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      console.log('📄 PROFIL: Fetching user data...');
      const userData = await getUser();
      if (userData) {
        console.log('📄 PROFIL: User data loaded:', userData);
        setNamaInput(userData.nama);
        setEmailInput(userData.email);
      } else {
        console.warn('⚠️ PROFIL: No user data found');
      }
    };

    const fetchKegiatan = async () => {
      console.log('📄 PROFIL: Fetching kegiatan...');
      const data = await getKegiatan();
      console.log('📄 PROFIL: Kegiatan loaded:', data.length, 'items');
      setKegiatan(data);
    };

    fetchUser();
    fetchKegiatan();

    const handleKegiatanUpdate = () => {
      console.log('📄 PROFIL: kegiatan-updated event received');
      fetchKegiatan();
    };

    window.addEventListener('kegiatan-updated', handleKegiatanUpdate);
    return () => window.removeEventListener('kegiatan-updated', handleKegiatanUpdate);
  }, [getUser]);

  useEffect(() => {
    if (user) {
      setNamaInput(user.nama);
      setEmailInput(user.email);
    }
  }, [user]);

  /* ── computed stats ── */
  const total          = kegiatan.length;
  const totalSelesai   = kegiatan.filter((k) => k.status === 'Sudah Selesai').length;
  // Target Tercapai = selesai tepat waktu (tidak terlambat)
  const targetTercapai = kegiatan.filter(
    (k) => k.status === 'Sudah Selesai' && !k.terlambat
  ).length;

  /* ── save handler ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveUser({ nama: namaInput.trim(), email: emailInput.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  /* ── displayed name (live) ── */
  const displayNama   = namaInput.trim();
  const displayEmail  = emailInput.trim() || '—';
  const displayInisial = getInitials(displayNama);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Kartu kiri: avatar + stats ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

            {/* Avatar + nama + email */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-[#FFBF00] flex items-center justify-center mb-4 shadow-md">
                <span className="text-white text-3xl font-bold select-none">
                  {displayInisial}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-800 text-center break-all">
                {displayNama}
              </h2>
              <p className="text-sm text-gray-400 text-center break-all mt-0.5">
                {displayEmail}
              </p>
            </div>

            {/* Stats */}
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Kegiatan</span>
                <span className="font-bold text-gray-800">{total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Selesai</span>
                <span className="font-bold text-green-500">{totalSelesai}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Target Tercapai</span>
                <span className="font-bold text-[#FFBF00]">{targetTercapai}</span>
              </div>

              {/* Progress bar selesai */}
              {total > 0 && (
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((totalSelesai / total) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFBF00] rounded-full transition-all duration-500"
                      style={{ width: `${(totalSelesai / total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mini stat pills */}
            {total > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-yellow-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-lg font-bold text-[#FFBF00]">
                    {kegiatan.filter((k) => k.prioritas === 'Tinggi').length}
                  </p>
                  <p className="text-xs text-gray-400">Prioritas Tinggi</p>
                </div>
                <div className="bg-red-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-lg font-bold text-red-400">
                    {kegiatan.filter((k) => k.terlambat).length}
                  </p>
                  <p className="text-xs text-gray-400">Terlambat</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Kolom kanan: form + pengaturan ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Informasi Akun */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Informasi Akun</h2>

            <form className="space-y-5" onSubmit={handleSave}>
              <div>
                <label className="flex items-center gap-2 text-gray-600 text-sm font-medium mb-2">
                  <User size={16} />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  placeholder="Tulis nama lengkap..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFBF00] focus:ring-2 focus:ring-[#FFBF00]/20 transition"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-600 text-sm font-medium mb-2">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Tulis email..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFBF00] focus:ring-2 focus:ring-[#FFBF00]/20 transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#FFBF00] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#e6ac00] transition-colors text-sm"
                >
                  <Save size={16} />
                  Simpan Perubahan
                </button>

                {/* Feedback sukses */}
                {saved && (
                  <span className="flex items-center gap-1.5 text-green-500 text-sm font-medium animate-fade-in">
                    <CheckCircle2 size={16} />
                    Tersimpan!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Pengaturan Notifikasi */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Settings size={20} />
              Pengaturan Notifikasi
            </h2>

            <div className="space-y-4">
              {[
                'Email notifikasi untuk kegiatan baru',
                'Reminder sebelum kegiatan dimulai',
                'Notifikasi penyelesaian kegiatan',
                'Laporan mingguan',
              ].map((setting) => (
                <label key={setting} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                    {setting}
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 accent-[#FFBF00] cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
