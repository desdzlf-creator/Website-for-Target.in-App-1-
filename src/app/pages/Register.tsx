import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { saveUser } from '../utils/userStore';
import { runFullMigration } from '../utils/supabaseMigration';
import { supabase } from '../utils/supabaseClient';

export function Register() {
  const navigate = useNavigate();
  const [nama,     setNama]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [agreed,   setAgreed]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!agreed) {
        setError('Anda harus menyetujui Syarat dan Ketentuan');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password minimal 6 karakter.');
        setLoading(false);
        return;
      }

      console.log('🔄 REGISTER: Attempting sign up with email:', email.trim());

      // ✅ Daftarkan ke Supabase Auth dulu
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { nama: nama.trim() || 'Pengguna' }, // simpan nama di metadata
        },
      });

      if (signUpError) {
        console.error('❌ REGISTER: Sign up error:', signUpError.message);
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        console.error('❌ REGISTER: No user returned from sign up');
        setError('Gagal membuat akun: User data tidak ditemukan.');
        setLoading(false);
        return;
      }

      console.log('✅ REGISTER: User created:', data.user.email, 'ID:', data.user.id);

      let signedInUser = data.user;
      if (!data.session) {
        console.log('🔄 REGISTER: No session returned, attempting sign in after sign up...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password,
        });

        if (signInError) {
          console.warn('⚠️ REGISTER: Could not sign in automatically after sign up:', signInError.message);
          setError('Akun dibuat. Silakan verifikasi email lalu login.');
          setLoading(false);
          return;
        }

        signedInUser = signInData.user ?? signedInUser;
      }

      // ✅ Setelah auth berhasil, simpan profil ke tabel profiles
      if (signedInUser) {
        console.log('✅ REGISTER: Saving profile to database...');
        await saveUser({
          nama:  nama.trim() || 'Pengguna',
          email: email.trim().toLowerCase(),
        });
        console.log('✅ REGISTER: Profile saved');
      }

      console.log('✅ REGISTER: Running migration...');
      await runFullMigration();
      
      console.log('✅ REGISTER: Success! Navigating to dashboard...');
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ REGISTER: Unexpected error:', err);
      setError('Terjadi kesalahan saat membuat akun. Silakan coba lagi.');
      setLoading(false);
    }
  };

  // ✅ Google register
  const handleGoogleRegister = async () => {
    const { error: googleError } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin, // ← ganti jadi ini
  },
});
    if (googleError) setError('Gagal login dengan Google. Silakan coba lagi.');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-8">
      <div className="w-full max-w-[480px]">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-600 hover:text-gray-800">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Buat Akun</h1>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              placeholder="Tulis Nama Lengkap..."
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email
            </label>
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
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Minimal 6 karakter..."
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00]"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 border-2 border-gray-300 rounded accent-[#FFBF00] cursor-pointer"
            />
            <span className="text-gray-700">Setuju dengan Syarat dan Ketentuan</span>
          </label>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFBF00] text-white font-semibold py-3.5 px-6 rounded-xl text-center hover:bg-[#e6ac00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Sedang Membuat Akun...' : 'Daftar'}
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500">Atau login lewat:</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* ✅ onClick sudah ditambahkan */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            className="mx-auto p-3 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg width="32" height="32" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>

          <p className="text-center text-gray-600 mt-4">
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
