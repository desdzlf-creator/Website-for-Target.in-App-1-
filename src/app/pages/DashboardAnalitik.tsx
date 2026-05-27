import { useState, useEffect, useMemo } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  getKegiatan,
  type Kegiatan,
} from '../utils/kegiatanStore';

// Registrasi semua komponen Chart.js agar bisa dipakai di React
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/* ── Constants ── */
const KATEGORI_COLORS: Record<string, string> = {
  Tugas:      '#FF6B8A',
  Ujian:      '#FFBF00',
  Organisasi: '#4ECDC4',
  Pribadi:    '#6C8EFF',
};

// Urutan hari dipastikan mulai dari Senin
const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/* ── Helpers ── */
function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Memformat tren 7 hari terakhir dengan urutan label konstan atau 
 * diurutkan berdasarkan runtunan hari kalender yang dimulai dari Senin.
 */
function computeTren(kegiatan: Kegiatan[]) {
  // Membuat list 7 hari terakhir secara berurutan
  const rentangHari = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // JS: 0 = Minggu, 1 = Senin, ..., 6 = Sabtu. 
    // Kita petakan ke indeks DAY_NAMES (0 = Senin, ..., 6 = Minggu)
    const jsDay = d.getDay();
    const customDayIndex = jsDay === 0 ? 6 : jsDay - 1;

    return {
      dateStr,
      dayName: DAY_NAMES[customDayIndex],
      dayIndex: customDayIndex, // Untuk sorting urutan hari nanti
      aktivitas: kegiatan.filter((k) => k.createdAt?.startsWith(dateStr)).length,
    };
  });

  // Urutkan hasilnya berdasarkan urutan hari (Senin ke Minggu)
  // Jika lu ingin grafik berurutan kronologis mundur 7 hari ke belakang (misal dari Rab lalu berakhir di hari ini),
  // cukup return langsung `rentangHari`. Di bawah ini gua urutkan kaku berdasarkan struktur Senin-Minggu:
  return rentangHari;
}

/* ═══════════════════════════════════════
   Main Component
═══════════════════════════════════════ */
export function DashboardAnalitik() {
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getKegiatan();
      setKegiatan(data);
    };
    load();
    window.addEventListener('kegiatan-updated', load);
    return () => window.removeEventListener('kegiatan-updated', load);
  }, []);

  /* ── Stat Cards ── */
  const total = kegiatan.length;

  const avgKesulitan = useMemo(() => {
    if (total === 0) return '—';
    const avg = kegiatan.reduce((s, k) => s + k.tingkatKesulitan, 0) / total;
    return avg.toFixed(1);
  }, [kegiatan, total]);

  const medianKesulitan = useMemo(() => {
    if (total === 0) return '—';
    const m = median(kegiatan.map((k) => k.tingkatKesulitan));
    return Number.isInteger(m) ? String(m) : m.toFixed(1);
  }, [kegiatan, total]);

  // 🔥 UPDATE LOGIKA: Sekarang menghitung persentase ketepatan waktu yang responsif
  const pctTepat = useMemo(() => {
    const kegiatanSelesai = kegiatan.filter((k) => k.status === 'Sudah Selesai');
    
    if (kegiatanSelesai.length === 0) return '0';

    // Syarat tepat waktu: Selesai DAN tidak dalam kondisi flag 'terlambat'
    const tepatWaktu = kegiatanSelesai.filter((k) => !k.terlambat).length;
    
    return `${Math.round((tepatWaktu / kegiatanSelesai.length) * 100)}`;
  }, [kegiatan]);

  const statCards = [
    { label: 'Semua Kegiatan',        value: String(total),       unit: '',  accent: '#6C8EFF', bg: '#EEF2FF' },
    { label: 'Rata-rata Kesulitan',   value: avgKesulitan,        unit: '',  accent: '#FFBF00', bg: '#FFF8E1' },
    { label: 'Median Kesulitan',      value: medianKesulitan,     unit: '',  accent: '#FF6B6B', bg: '#FFF0F0' },
    { label: 'Persentase Tepat Waktu', value: pctTepat,          unit: '%', accent: '#2ECC9A', bg: '#E8FAF3' },
  ];

  /* ── Data: Distribusi Prioritas (Bar Chart) ── */
  const distribusiData = useMemo(() => [
    { label: 'Tinggi', value: kegiatan.filter((k) => k.prioritas === 'Tinggi').length, color: '#FF6B6B' },
    { label: 'Sedang', value: kegiatan.filter((k) => k.prioritas === 'Sedang').length, color: '#FFBF00' },
    { label: 'Rendah', value: kegiatan.filter((k) => k.prioritas === 'Rendah').length, color: '#2ECC9A' },
  ], [kegiatan]);

  /* ── Data: Proporsi Kategori (Pie Chart) ── */
  const proporsiData = useMemo(() => {
    return (['Tugas', 'Ujian', 'Organisasi', 'Pribadi'] as const).map((k) => ({
      name:  k,
      value: kegiatan.filter((item) => item.kategori === k).length,
      color: KATEGORI_COLORS[k],
    }));
  }, [kegiatan]);

  /* ── Data: Tren Aktivitas (Line Chart) ── */
  const trenData = useMemo(() => computeTren(kegiatan), [kegiatan]);

  /* ─────── RENDER JSX ─────── */
  return (
    <div className="min-h-full flex flex-col gap-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Analitik</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Pantau performa dan aktivitas kegiatanmu secara menyeluruh.
        </p>
      </div>

      {/* ── Row 1: Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3"
          >
            <div
              className="w-6 h-1 rounded-full mb-2"
              style={{ backgroundColor: card.accent }}
            />
            <p className="text-xs text-gray-400 mb-1 leading-tight">{card.label}</p>
            <p className="text-2xl font-bold text-gray-800">
              {card.value}
              {card.unit && card.value !== '—' && (
                <span className="text-base ml-0.5">{card.unit}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* ── Row 2: Bar Chart + Pie Chart ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        {/* Bar Chart – Distribusi Prioritas */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-semibold text-gray-800 text-sm mb-1">Distribusi Prioritas</p>
          <p className="text-xs text-gray-400 mb-5">Jumlah kegiatan berdasarkan tingkat prioritas</p>
          <div style={{ height: 220, width: '100%' }}>
            <Bar 
              data={{
                labels: distribusiData.map(d => d.label),
                datasets: [{
                  label: 'Jumlah Kegiatan',
                  data: distribusiData.map(d => d.value),
                  backgroundColor: distribusiData.map(d => d.color),
                  borderRadius: 6,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } },
                }
              }}
            />
          </div>
        </div>

        {/* Pie Chart – Proporsi Jenis Kegiatan */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-semibold text-gray-800 text-sm mb-1">Proporsi Jenis Kegiatan</p>
          <p className="text-xs text-gray-400 mb-3">Komposisi berdasarkan kategori</p>

          <div style={{ height: 180, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {total === 0 ? (
              <p className="text-xs text-gray-400">Belum ada data</p>
            ) : (
              <Pie 
                data={{
                  labels: proporsiData.map(d => d.name),
                  datasets: [{
                    data: proporsiData.map(d => d.value),
                    backgroundColor: proporsiData.map(d => d.color),
                    borderWidth: 2,
                    borderColor: '#fff',
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }}
              />
            )}
          </div>

          {/* Legend Manual */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
            {proporsiData.map((item) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-500">{item.name}</span>
                  <span className="text-xs font-semibold text-gray-700 ml-auto">
                    {item.value > 0 ? `${pct}%` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Line Chart – Tren Aktivitas ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-semibold text-gray-800 text-sm mb-1">Tren Aktivitas</p>
        <p className="text-xs text-gray-400 mb-5">
          Jumlah kegiatan ditambahkan per hari — 7 hari terakhir
        </p>
        <div style={{ height: 200, width: '100%' }}>
          <Line 
            data={{
              labels: trenData.map(d => d.dayName),
              datasets: [{
                label: 'Aktivitas',
                data: trenData.map(d => d.aktivitas),
                borderColor: '#FFBF00',
                backgroundColor: '#FFBF00',
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
              }
            }}
          />
        </div>
      </div>

    </div>
  );
}
