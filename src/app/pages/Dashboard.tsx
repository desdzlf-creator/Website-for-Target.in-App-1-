import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';

// PERBAIKAN JALUR: Mundur 2 kali (`../../`) adalah path yang benar untuk struktur folder lu
import { getKegiatan, formatDeadlineLabel } from '../utils/kegiatanStore';
import type { Kegiatan } from '../utils/kegiatanStore';

import { useUserStore, getFirstName } from '../utils/userStore';

/* ── Color maps ── */
const KATEGORI_COLORS: Record<string, string> = {
  Tugas:      '#FF6B8A',
  Ujian:      '#FFBF00',
  Organisasi: '#4ECDC4',
  Pribadi:    '#6C8EFF',
};

const PRIORITAS_COLOR: Record<string, string> = {
  Tinggi: '#FF6B6B',
  Sedang: '#E6A800',
  Rendah: '#2ECC9A',
};

const PRIORITAS_BG: Record<string, string> = {
  Tinggi: '#FFE8E8',
  Sedang: '#FFF9E0',
  Rendah: '#E8FAF3',
};

/* ── Custom pie label ── */
const RADIAN = Math.PI / 180;
function renderPieLabel({
  cx, cy, midAngle, outerRadius, percent, index, data,
}: {
  cx: number; cy: number; midAngle: number;
  outerRadius: number; percent: number; index: number; data: typeof emptyPie;
}) {
  if (percent < 0.05) return null;
  const r  = outerRadius + 28;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill={(data[index] as any).color}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 700 }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

const emptyPie = [{ name: 'Kosong', value: 1, color: '#E5E7EB' }];

export function Dashboard() {
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const { user } = useUserStore();

  useEffect(() => {
    const fetchKegiatan = async () => {
      const data = await getKegiatan();
      setKegiatan(data);
    };

    fetchKegiatan();

    const handleKegiatanUpdate = () => fetchKegiatan();
    window.addEventListener('kegiatan-updated', handleKegiatanUpdate);

    return () => {
      window.removeEventListener('kegiatan-updated', handleKegiatanUpdate);
    };
  }, []);

  const firstName = user ? getFirstName(user.nama) : 'Pengguna';

  /* ── Computed stats ── */
  const total      = kegiatan.length;
  const cTinggi    = kegiatan.filter((k) => k.prioritas === 'Tinggi').length;
  const cSedang    = kegiatan.filter((k) => k.prioritas === 'Sedang').length;
  const cRendah    = kegiatan.filter((k) => k.prioritas === 'Rendah').length;
  const cSelesai   = kegiatan.filter((k) => k.status === 'Sudah Selesai').length;
  const pctSelesai = total > 0 ? Math.round((cSelesai / total) * 100) : 0;
  const avgKesulitan =
    total > 0
      ? (kegiatan.reduce((s, k) => s + k.tingkatKesulitan, 0) / total).toFixed(1)
      : '—';

  /* ── Pie data by kategori ── */
  const pieData = (['Tugas', 'Ujian', 'Organisasi', 'Pribadi'] as const)
    .map((k) => ({
      name:  k,
      value: kegiatan.filter((item) => item.kategori === k).length,
      color: KATEGORI_COLORS[k],
    }))
    .filter((d) => d.value > 0);

  /* ── Deadline terdekat (belum selesai, sort by tanggal asc, top 4) ── */
  const upcomingDeadlines = [...kegiatan]
    .filter((k) => k.status === 'Belum Selesai' && k.tanggal)
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    .slice(0, 4);

  /* ─────── RENDER ─────── */
  return (
    <div className="min-h-full">

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl text-gray-800 mb-0.5">
          Halo, <span className="font-bold">{firstName}!</span>
        </h1>
        <p className="text-gray-500 text-sm">Fokus hari ini, hasilkan yang terbaik!</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        {/* ── Ringkasan Prioritas ── */}
        <div className="md:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-800 text-sm mb-0.5">Ringkasan Prioritas</p>
          <p className="text-xs text-gray-400 mb-4">
            {total > 0 ? `Total ${total} Kegiatan` : 'Belum ada kegiatan'}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Tinggi', count: cTinggi, color: '#FF6B6B', bg: '#FFE8E8' },
              { label: 'Sedang', count: cSedang, color: '#E6A800', bg: '#FFF3CD' },
              { label: 'Rendah', count: cRendah, color: '#2ECC9A', bg: '#D4F4E8' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl py-4 text-center"
                style={{ backgroundColor: item.bg }}
              >
                <p className="text-4xl font-bold" style={{ color: item.color }}>
                  {item.count}
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: item.color }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex rounded-full overflow-hidden h-2.5">
            {total > 0 ? (
              <>
                <div style={{ width: `${(cTinggi / total) * 100}%`, backgroundColor: '#FF6B6B' }} />
                <div style={{ width: `${(cSedang / total) * 100}%`, backgroundColor: '#FFBF00' }} />
                <div style={{ width: `${(cRendah / total) * 100}%`, backgroundColor: '#2ECC9A' }} />
              </>
            ) : (
              <div style={{ width: '100%', backgroundColor: '#E5E7EB' }} />
            )}
          </div>
        </div>

        {/* ── Proporsi + Statistik ── */}
        <div
          className="md:col-span-2 md:row-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex flex-col"
          onClick={() => navigate('/dashboard-analitik')}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-800 text-sm">Proporsi Jenis Kegiatan</p>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-400 mb-2">Komposisi berdasarkan kategori</p>

          <div className="flex items-center justify-center my-3">
            <PieChart width={250} height={250}>
              <Pie
                data={pieData.length > 0 ? pieData : emptyPie}
                cx={122}
                cy={122}
                innerRadius={58}
                outerRadius={84}
                dataKey="value"
                labelLine={false}
                label={
                  pieData.length > 0
                    ? (props: any) => renderPieLabel({ ...props, data: pieData })
                    : undefined
                }
                strokeWidth={2}
                stroke="#fff"
              >
                {(pieData.length > 0 ? pieData : emptyPie).map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>

          {pieData.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-500">{item.name}</span>
                  <span className="text-xs font-semibold text-gray-700 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center">Belum ada data</p>
          )}

          <div className="mt-auto pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Statistik Singkat
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { value: `${pctSelesai}%`, label: 'Selesai Tepat Waktu', accent: '#2ECC9A', bg: '#E8FAF3' },
                { value: avgKesulitan,     label: 'Rata-rata Kesulitan', accent: '#FFBF00', bg: '#FFF8E1' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl px-3 py-2.5 text-center"
                  style={{ backgroundColor: s.bg }}
                >
                  <p className="text-2xl font-bold" style={{ color: s.accent }}>
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Deadline Terdekat ── */}
        <div className="md:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-800 text-sm mb-4">Deadline Terdekat</p>

          {upcomingDeadlines.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {upcomingDeadlines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: PRIORITAS_BG[item.prioritas] }}
                >
                  <div className="min-w-0 mr-3">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {item.namaKegiatan}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.kategori} · {item.jenis}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        backgroundColor: PRIORITAS_COLOR[item.prioritas] + '25',
                        color:           PRIORITAS_COLOR[item.prioritas],
                      }}
                    >
                      {formatDeadlineLabel(item.tanggal)}
                    </span>
                    <span
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: PRIORITAS_COLOR[item.prioritas] + '18',
                        color:           PRIORITAS_COLOR[item.prioritas],
                      }}
                    >
                      {item.prioritas}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-gray-300 text-sm">
              Tidak ada deadline yang akan datang 🎉
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
