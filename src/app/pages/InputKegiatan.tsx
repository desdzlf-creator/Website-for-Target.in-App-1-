import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import {
  addKegiatan,
  hitungPrioritas,
  hitungSisaHari,
  skorToPrioritas,
} from '../utils/kegiatanStore';

const KATEGORI_OPTIONS = ['Tugas', 'Ujian', 'Organisasi', 'Pribadi'] as const;

const KESULITAN_LABELS: Record<number, string> = {
  1: 'Sangat Mudah',
  2: 'Mudah',
  3: 'Sedang',
  4: 'Sulit',
  5: 'Sangat Sulit',
};

const prioritasColor: Record<string, { bg: string; text: string; border: string }> = {
  Tinggi: { bg: '#FFF0F0', text: '#D32F2F', border: '#FFCDD2' },
  Sedang: { bg: '#FFFBE6', text: '#B8860B', border: '#FFE082' },
  Rendah: { bg: '#F0FDF4', text: '#1E8E6C', border: '#BBF7D0' },
};

function SelectIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function InputKegiatan() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    namaKegiatan:     '',
    jenis:            '' as 'Kelompok' | 'Individu' | '',
    kategori:         '' as 'Tugas' | 'Ujian' | 'Organisasi' | 'Pribadi' | '',
    tingkatKesulitan: 0,
    tanggal:          '',
    terlambat:        false,
  });

  const [saved, setSaved] = useState(false);
  const [error, setError]  = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── preview skor real-time ── */
  const previewSkor =
    form.jenis && form.kategori && form.tingkatKesulitan > 0 && form.tanggal
      ? hitungPrioritas({
          kelompok:         form.jenis === 'Kelompok',
          kategori:         form.kategori,
          sisaHari:         hitungSisaHari(form.tanggal),
          tingkatKesulitan: form.tingkatKesulitan,
          terlambat:        form.terlambat,
        })
      : null;

  const previewPrioritas = previewSkor !== null ? skorToPrioritas(previewSkor) : null;

  const set = (field: string, value: string | number | boolean) =>
    setForm((p) => ({ ...p, [field]: value }));

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.namaKegiatan || !form.jenis || !form.kategori || !form.tingkatKesulitan || !form.tanggal) {
      setError('Harap lengkapi semua field yang wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const sisaHari  = hitungSisaHari(form.tanggal);
    const skor      = hitungPrioritas({
      kelompok:         form.jenis === 'Kelompok',
      kategori:         form.kategori,
      sisaHari,
      tingkatKesulitan: form.tingkatKesulitan,
      terlambat:        form.terlambat,
    });
    const prioritas = skorToPrioritas(skor);

    const result = await addKegiatan({
      namaKegiatan:     form.namaKegiatan,
      jenis:            form.jenis as 'Kelompok' | 'Individu',
      kategori:         form.kategori as 'Tugas' | 'Ujian' | 'Organisasi' | 'Pribadi',
      tingkatKesulitan: form.tingkatKesulitan,
      tanggal:          form.tanggal,
      terlambat:        form.terlambat,
      skor,
      prioritas,
      status: 'Belum Selesai',
    });

    if (result) {
      setSaved(true);
      setError('');
      setTimeout(() => navigate('/daftar-kegiatan'), 1200);
    } else {
      setIsSubmitting(false);
      setError('Gagal menyimpan kegiatan. Pastikan Anda sudah login ke aplikasi.');
    }
  };

  return (
    <div className="w-full max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tambah Kegiatan Baru</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Isi detail kegiatan yang ingin kamu tambahkan hari ini!
        </p>
      </div>

      {/* Success banner */}
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5 text-sm">
          <CheckCircle size={16} />
          Kegiatan berhasil disimpan! Mengarahkan…
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-8 w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Nama Kegiatan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nama Kegiatan <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Tugas Algoritma Bab 3"
              value={form.namaKegiatan}
              onChange={(e) => set('namaKegiatan', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00] text-gray-800 placeholder:text-gray-300"
            />
          </div>

          {/* Jenis & Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jenis */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Jenis <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-3">
                {(['Kelompok', 'Individu'] as const).map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => set('jenis', j)}
                    className="flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                    style={{
                      borderColor:     form.jenis === j ? '#FFBF00' : '#E5E7EB',
                      backgroundColor: form.jenis === j ? '#FFBF00' : 'white',
                      color:           form.jenis === j ? 'white'   : '#6B7280',
                    }}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Kategori <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.kategori}
                  onChange={(e) => set('kategori', e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00] text-gray-700 bg-white pr-10"
                >
                  <option value="" disabled>Pilih kategori…</option>
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <SelectIcon />
              </div>
            </div>
          </div>

          {/* Tingkat Kesulitan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tingkat Kesulitan <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set('tingkatKesulitan', n)}
                  className="w-10 h-10 rounded-full border-2 text-sm font-semibold transition-all shrink-0"
                  style={{
                    borderColor:     form.tingkatKesulitan === n ? '#FFBF00' : '#E5E7EB',
                    backgroundColor: form.tingkatKesulitan === n ? '#FFBF00' : 'white',
                    color:           form.tingkatKesulitan === n ? 'white'   : '#9CA3AF',
                  }}
                >
                  {n}
                </button>
              ))}
              {form.tingkatKesulitan > 0 && (
                <span className="text-xs text-gray-400 ml-1">
                  — {KESULITAN_LABELS[form.tingkatKesulitan]}
                </span>
              )}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deadline <span className="text-red-400">*</span>
            </label>
            <div className="relative max-w-xs">
              <input
                type="date"
                value={form.tanggal}
                onChange={(e) => set('tanggal', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00] text-gray-700 pr-10"
              />
              <Calendar size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            </div>
          </div>

          {/* Terlambat toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Sudah Terlambat?</p>
              <p className="text-xs text-gray-400 mt-0.5">Tandai jika pengerjaan sudah melewati batas wajar</p>
            </div>
            <button
              type="button"
              onClick={() => set('terlambat', !form.terlambat)}
              className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0"
              style={{ backgroundColor: form.terlambat ? '#FFBF00' : '#E5E7EB' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                style={{ transform: form.terlambat ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          {/* Priority Preview */}
          {previewPrioritas && (
            <div
              className="rounded-xl px-4 py-3 border flex items-center justify-between"
              style={{
                backgroundColor: prioritasColor[previewPrioritas].bg,
                borderColor:     prioritasColor[previewPrioritas].border,
              }}
            >
              <div>
                <p className="text-xs font-semibold" style={{ color: prioritasColor[previewPrioritas].text }}>
                  Estimasi Prioritas
                </p>
                <p className="text-xl font-bold mt-0.5" style={{ color: prioritasColor[previewPrioritas].text }}>
                  {previewPrioritas}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Skor</p>
                <p className="text-2xl font-bold" style={{ color: prioritasColor[previewPrioritas].text }}>
                  {previewSkor}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => navigate('/daftar-kegiatan')}
              className="px-6 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl hover:bg-[#e6ac00] transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#FFBF00' }}
            >
              {isSubmitting ? 'Menyimpan…' : 'Simpan Kegiatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
