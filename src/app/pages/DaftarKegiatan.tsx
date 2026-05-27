import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, ChevronDown, Plus, Trash2, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

/* ── Interface Data Kegiatan ── */
interface Kegiatan {
  id: string;
  namaKegiatan: string;
  jenis: 'Kelompok' | 'Individu';
  kategori: 'Tugas' | 'Ujian' | 'Organisasi' | 'Pribadi';
  tingkatKesulitan: number;
  tanggal: string;
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
  status: 'Belum Selesai' | 'Sudah Selesai';
  skor: number;
  created_at?: string;
}

/* ── style maps ── */
const priorityStyle: Record<string, { bg: string; color: string }> = {
  Tinggi: { bg: '#FFDEDE', color: '#D32F2F' },
  Sedang: { bg: '#FFF3CD', color: '#B8860B' },
  Rendah: { bg: '#D4F4E8', color: '#1E8E6C' },
  tinggi: { bg: '#FFDEDE', color: '#D32F2F' },
  sedang: { bg: '#FFF3CD', color: '#B8860B' },
  rendah: { bg: '#D4F4E8', color: '#1E8E6C' },
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  'Belum Selesai': { bg: '#FFDEDE', color: '#D32F2F' },
  'Sudah Selesai': { bg: '#D4F4E8', color: '#1E8E6C' },
};

const FILTER_COLS = ['Semua', 'Tinggi', 'Sedang', 'Rendah'];
const SORT_OPTIONS = ['Terbaru', 'Prioritas Tertinggi', 'Deadline Terdekat'];

function formatTanggal(dateString: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function DaftarKegiatan() {
  const navigate = useNavigate();

  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]     = useState('');
  const [filterP, setFilterP]   = useState('Semua');
  const [sortBy, setSortBy]     = useState('Terbaru');
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort]     = useState(false);

  /* ── AMBIL DATA REAL-TIME DARI SUPABASE ── */
  const reload = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/login');
        return;
      }

      // ⚠️ PERBAIKAN UTAMA: Mengubah nama tabel dari 'kegiatan' menjadi 'kegiatans' sesuai database
      const { data, error } = await supabase
        .from('kegiatans')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      const normalizedData = (data || []).map((item: any) => ({
        id: item.id,
        namaKegiatan: item.nama_kegiatan || item.namaKegiatan || '', 
        jenis: item.jenis || 'Individu',
        kategori: item.kategori || 'Tugas',
        tingkatKesulitan: item.tingkat_kesulitan || item.tingkatKesulitan || 0,
        tanggal: item.tanggal || '',
        prioritas: item.prioritas || 'Rendah',
        status: item.status === 'Selesai' || item.status === 'Sudah Selesai' ? 'Sudah Selesai' : 'Belum Selesai',
        skor: item.skor || 0,
        created_at: item.created_at
      }));

      setKegiatan(normalizedData);
    } catch (err: any) {
      // Menampilkan pesan error secara mendetail di konsol
      console.error('❌ Error fetching dari Supabase:', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  /* ── FILTER + SORT LOGIC ── */
  const filtered = kegiatan
    .filter((k) => {
      const nama = k.namaKegiatan ? k.namaKegiatan.toLowerCase() : '';
      const matchSearch = nama.includes(search.toLowerCase());
      
      const prioritasData = k.prioritas ? k.prioritas.toLowerCase() : '';
      const prioritasFilter = filterP.toLowerCase();
      const matchFilter = filterP === 'Semua' || prioritasData === prioritasFilter;
      
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'Prioritas Tertinggi') return b.skor - a.skor;
      if (sortBy === 'Deadline Terdekat') {
        if (!a.tanggal) return 1;
        if (!b.tanggal) return -1;
        return new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      }
      const dateA = new Date(a.created_at || a.tanggal || 0).getTime();
      const dateB = new Date(b.created_at || b.tanggal || 0).getTime();
      return dateB - dateA;
    });

  /* ── UPDATE STATUS DI SUPABASE ── */
  const handleStatus = async (id: string, current: string, tanggal: string) => {
  const nextStatus = current === 'Sudah Selesai' ? 'Belum Selesai' : 'Selesai';
  
  // Hitung terlambat: hanya berlaku saat baru selesai, bukan saat di-undo
  const terlambat =
    nextStatus === 'Selesai'
      ? new Date() > new Date(tanggal + 'T23:59:59')
      : false;

  try {
    const { error } = await supabase
      .from('kegiatans')
      .update({ status: nextStatus, terlambat })
      .eq('id', id);

    if (error) throw error;
    
    // Beritahu DashboardAnalitik supaya re-fetch
    window.dispatchEvent(new Event('kegiatan-updated'));
    reload();
  } catch (err) {
    console.error('❌ Gagal update status:', err);
  }
};

  /* ── HAPUS DATA DI SUPABASE ── */
  const handleDelete = async (id: string) => {
    if (confirm('Hapus kegiatan ini dari database Target.in?')) {
      try {
        const { error } = await supabase
          .from('kegiatans') // Menyelaraskan nama tabel menjadi 'kegiatans'
          .delete()
          .eq('id', id);

        if (error) throw error;
        reload();
      } catch (err) {
        console.error('❌ Gagal menghapus kegiatan:', err);
      }
    }
  };

  return (
    <div className="min-h-full flex flex-col w-full max-w-6xl">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Semua Kegiatan</h1>
        <p className="text-sm text-gray-400 mt-0.5">Lihat dan kelola seluruh tugas dan skala prioritasmu.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Kegiatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00] bg-white text-gray-700"
          />
        </div>

        {/* Filter Prioritas */}
        <div className="relative">
          <button
            onClick={() => { setShowFilter(!showFilter); setShowSort(false); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-[#FFBF00] transition-colors whitespace-nowrap"
          >
            <span className="text-gray-500">Filter:</span>
            <span className="font-semibold text-gray-700">{filterP}</span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>
          {showFilter && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-md z-10 min-w-[140px] overflow-hidden">
              {FILTER_COLS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setFilterP(p); setShowFilter(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterP === p ? 'text-[#FFBF00] font-semibold' : 'text-gray-700'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Urutkan */}
        <div className="relative">
          <button
            onClick={() => { setShowSort(!showSort); setShowFilter(false); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-[#FFBF00] transition-colors whitespace-nowrap"
          >
            <span className="text-gray-500">Urut:</span>
            <span className="font-semibold text-gray-700">{sortBy}</span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>
          {showSort && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-md z-10 min-w-[190px] overflow-hidden">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSortBy(s); setShowSort(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === s ? 'text-[#FFBF00] font-semibold' : 'text-gray-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tambah Button */}
        <div className="md:ml-auto">
          <button
            onClick={() => navigate('/input-kegiatan')}
            className="flex items-center gap-2 bg-[#FFBF00] text-white font-semibold px-5 py-2 rounded-xl hover:bg-[#e6ac00] transition-colors shadow-sm text-sm whitespace-nowrap"
          >
            <Plus size={16} />
            Tambah Kegiatan
          </button>
        </div>
      </div>

      {/* ── Table / Cards Content ── */}
      {loading ? (
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center py-16 text-gray-400 text-sm">
          Sedang mengambil data dari Supabase...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 gap-3">
          <ClipboardList size={40} className="text-gray-200" />
          <p className="text-gray-400 text-sm">
            {search || filterP !== 'Semua'
              ? 'Tidak ada kegiatan yang cocok dengan filter.'
              : 'Belum ada kegiatan. Yuk tambahkan!'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table (md+) */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] bg-gray-50 border-b border-gray-100 px-5 py-3">
              {['Kegiatan', 'Kategori', 'Deadline', 'Prioritas', 'Status', ''].map((col, i) => (
                <span key={i} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {col}
                </span>
              ))}
            </div>

            {filtered.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate">{item.namaKegiatan}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.jenis}</p>
                </div>
                <span className="text-sm text-gray-500">{item.kategori}</span>
                <span className="text-sm text-gray-500">{formatTanggal(item.tanggal)}</span>
                <span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={priorityStyle[item.prioritas] || { bg: '#E5E7EB', color: '#374151' }}
                  >
                    {item.prioritas}
                  </span>
                </span>
                <span>
                  <button
                    onClick={() => handleStatus(item.id, item.status, item.tanggal)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
                    style={statusStyle[item.status]}
                    title="Klik untuk ubah status"
                  >
                    {item.status === 'Sudah Selesai' ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {item.status}
                  </button>
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="ml-2 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                  title="Hapus kegiatan"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Mobile Cards (< md) */}
          <div className="flex md:hidden flex-col gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.namaKegiatan}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.jenis} · {item.kategori}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={priorityStyle[item.prioritas] || { bg: '#E5E7EB', color: '#374151' }}
                  >
                    {item.prioritas}
                  </span>
                  <button
                    onClick={() => handleStatus(item.id, item.status, item.tanggal)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 flex items-center gap-1"
                    style={statusStyle[item.status]}
                  >
                    {item.status === 'Sudah Selesai' ? <CheckCircle size={11} /> : <Clock size={11} />}
                    {item.status}
                  </button>
                  <span className="text-xs text-gray-400 ml-auto">{formatTanggal(item.tanggal)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
