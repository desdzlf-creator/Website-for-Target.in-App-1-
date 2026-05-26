import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../utils/supabaseClient';
import { getUser, saveUser } from '../utils/userStore';

const logoKeSampingKuning = new URL('../../imports/logo_ke_samping_kuning.png', import.meta.url).href;

export function Login() { 
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const email = identifier.trim().toLowerCase();

    if (!email || !password) {
      setError('Email dan Password harus diisi.');
      setLoading(false);
      return;
    }

    // LOGIN AUTH
    const { data, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error("AUTH ERROR:", authError);

      setError(
        'Email atau password salah. Silakan coba lagi.'
      );

      setLoading(false);
      return;
    }

    if (!data?.user) {
      setError('Gagal login. Silakan coba lagi.');
      setLoading(false);
      return;
    }

    // BUAT PROFILE JIKA BELUM ADA
    try {
      const profilUser = await getUser(data.user.id);

      if (!profilUser) {
        const namaDefault =
          data.user.user_metadata?.nama ||
          data.user.user_metadata?.full_name ||
          data.user.email?.split('@')[0] ||
          'User';

        await saveUser({
          id: data.user.id,
          nama: namaDefault,
          email: data.user.email || '',
        });
      }
    } catch (profileError) {
      console.error(
        "PROFILE ERROR:",
        profileError
      );
    }

    // LANGSUNG KE DASHBOARD (Gunakan window.location untuk bypass state stuck)
    setLoading(false);
    window.location.href = '/dashboard';
    return;

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    setError(
      'Terjadi kesalahan saat login. Silakan coba lagi.'
    );
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
    if (googleError) setError('Gagal login dengan Google. Silakan coba lagi.');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-8">
      <div className="w-full max-w-[480px]">
        <div className="flex justify-center mb-8">
          <img
            src={logoKeSampingKuning}
            alt="Target.in"
            className="h-16 w-auto object-contain"
          />
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Tulis Email..."
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00]"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Tulis Password..."
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFBF00] text-white font-semibold py-3.5 px-6 rounded-xl text-center hover:bg-[#e6ac00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang Masuk...' : 'Masuk'}
          </button>

          <Link
            to="#"
            className="text-[#FFBF00] text-center font-medium hover:underline"
          >
            Lupa Password?
          </Link>

          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500">Atau</span>
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
            Lanjutkan dengan Google
          </button>

          <p className="text-center text-gray-600 mt-4">
            Belum punya akun?{' '}
            <Link to="/register" className="text-[#FFBF00] font-semibold hover:underline">
              Daftar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
