import { useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '../utils/supabaseClient';

export function Register() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setuju, setSetuju] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!setuju) {
      setError('Anda harus menyetujui Syarat dan Ketentuan.');
      setLoading(false);
      return;
    }

    try {
      const emailClean = email.trim().toLowerCase();

      // 1. DAFTAR KE SUPABASE AUTH
      const { data, error: authError } = await supabase.auth.signUp({
        email: emailClean,
        password,
        options: {
          data: {
            nama: nama.trim(),
          },
        },
      });

      if (authError) {
        console.error("REGISTER AUTH ERROR:", authError);
        setError(authError.message || 'Gagal mendaftar. Silakan coba lagi.');
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setError('Gagal membuat akun. Silakan coba lagi.');
        setLoading(false);
        return;
      }

      // 2. LANGSUNG LEMPAR KE DASHBOARD (ANTI BLOCKED/STUCK)
      setLoading(false);
      window.location.href = '/dashboard';
      return;

    } catch (err) {
      console.error("REGISTER GLOBAL ERROR:", err);
      setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (googleError) setError('Gagal login dengan Google.');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-8 py-12">
      <div className="w-full max-w-[480px]">
        <div className="flex flex-col items-center mb-8">
          <button 
            type="button"
            onClick={() => window.history.back()}
            className="self-start flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Buat Akun
          </button>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-2">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Tulis Nama Lengkap..."
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              placeholder="Tulis Email..."
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              placeholder="Tulis Password..."
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00]"
            />
          </div>

          <div className="flex items-center gap-2 my-1">
            <input
              type="checkbox"
              id="setuju"
              checked={setuju}
              onChange={(e) => setSetuju(e.target.checked)}
              className="w-4 h-4 rounded text-[#FFBF00] focus:ring-[#FFBF00] border-gray-300"
            />
            <label htmlFor="setuju" className="text-sm text-gray-700 font-medium">
              Setuju dengan Syarat dan Ketentuan
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFBF00] text-white font-semibold py-3.5 px-6 rounded-xl text-center hover:bg-[#e6ac00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang Membuat Akun...' : 'Daftar'}
          </button>

          <div className="flex items-center gap-4 my-1">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">Atau login lewat:</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>

          <p className="text-center text-gray-600">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-[#FFBF00] font-semibold hover:underline">
              Masuk
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
