import { Link } from 'react-router';
import logoKeBawah from '../../imports/logo_kebawah.png';

export function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{
        backgroundColor: 'white',
        backgroundImage:
          'radial-gradient(ellipse 130% 65% at 50% 0%, #FFBF00 0%, #FFBF00 30%, rgba(255,191,0,0.65) 50%, rgba(255,191,0,0.15) 68%, transparent 82%)',
      }}
    >
      {/* Logo area – sits inside the yellow gradient zone */}
      <div className="flex flex-col items-center justify-center" style={{ paddingTop: '14vh', paddingBottom: '8vh' }}>
        <img
          src={logoKeBawah}
          alt="Target.in"
          className="h-44 w-auto object-contain"
        />
      </div>

      {/* CTA area – sits in the fading-to-white zone */}
      <div className="flex flex-col items-center w-full px-8" style={{ marginTop: '2vh' }}>
        <p className="text-gray-700 mb-8 text-center text-sm">
          Fokus hari ini, hasilkan yang terbaik!
        </p>
        <div className="w-full max-w-xs flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full bg-[#FFBF00] text-white font-semibold py-3.5 px-6 rounded-xl text-center hover:bg-[#e6ac00] transition-colors"
          >
            Masuk
          </Link>
          <Link
            to="/register"
            className="w-full bg-white text-gray-800 font-semibold py-3.5 px-6 rounded-xl text-center border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Buat Akun
          </Link>
        </div>
      </div>
    </div>
  );
}
