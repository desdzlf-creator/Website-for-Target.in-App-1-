import { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, BellOff } from 'lucide-react';
import {
  getKegiatan,
  formatDeadlineLabel,
  formatTanggal,
  hitungSisaHari,
  type Kegiatan,
} from '../utils/kegiatanStore';

const READ_KEY = 'target_in_notif_read';

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

/* ── urgency label & color based on sisaHari ── */
function urgencyInfo(tanggal: string): { label: string; color: string; bg: string } {
  const sisa = hitungSisaHari(tanggal);
  if (sisa < 0)  return { label: 'Sudah lewat!',  color: '#B91C1C', bg: '#FEE2E2' };
  if (sisa === 0) return { label: 'Hari ini!',     color: '#D97706', bg: '#FEF3C7' };
  if (sisa === 1) return { label: 'Besok!',        color: '#D97706', bg: '#FEF3C7' };
  if (sisa <= 3)  return { label: `${sisa} hari lagi`, color: '#D97706', bg: '#FEF3C7' };
  return { label: formatDeadlineLabel(tanggal),    color: '#B45309', bg: '#FFF8E1' };
}

export function Notifikasi() {
  const [kegiatan, setKegiatan]   = useState<Kegiatan[]>([]);
  const [readIds,  setReadIds]    = useState<Set<string>>(getReadIds);

  /* ── load & subscribe ── */
  useEffect(() => {
    const load = async () => {
      const data = await getKegiatan();
      setKegiatan(data);
    };
    load();
    window.addEventListener('kegiatan-updated', load);
    return () => window.removeEventListener('kegiatan-updated', load);
  }, []);

  /* ── filter: hanya Prioritas Tinggi + Belum Selesai, urutkan deadline terdekat ── */
  const tinggiList = [...kegiatan]
    .filter((k) => k.prioritas === 'Tinggi' && k.status === 'Belum Selesai')
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  const unreadCount = tinggiList.filter((k) => !readIds.has(k.id)).length;

  /* ── actions ── */
  const markRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    saveReadIds(next);
  };

  const markAllRead = () => {
    const next = new Set(readIds);
    tinggiList.forEach((k) => next.add(k.id));
    setReadIds(next);
    saveReadIds(next);
  };

  /* ─────── RENDER ─────── */
  return (
    <div className="min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifikasi</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Kegiatan prioritas tinggi yang perlu segera diselesaikan
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm font-semibold text-[#FFBF00] hover:text-[#e6ac00] transition-colors"
          >
            <CheckCheck size={18} />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Badge info */}
      {tinggiList.length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">
            Kamu memiliki{' '}
            <span className="font-bold">{tinggiList.length} kegiatan prioritas tinggi</span>
            {unreadCount > 0 && (
              <> — <span className="font-bold">{unreadCount} belum dibaca</span></>
            )}
          </p>
        </div>
      )}

      {/* Notification list */}
      {tinggiList.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
            <BellOff size={28} className="text-gray-200" />
          </div>
          <div className="text-center">
            <p className="text-gray-500 font-semibold">Tidak ada notifikasi</p>
            <p className="text-sm text-gray-400 mt-1">
              Belum ada kegiatan dengan prioritas tinggi saat ini.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {tinggiList.map((item, idx) => {
            const isRead  = readIds.has(item.id);
            const urgency = urgencyInfo(item.tanggal);
            const sisa    = hitungSisaHari(item.tanggal);

            return (
              <div
                key={item.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer ${
                  idx !== tinggiList.length - 1 ? 'border-b border-gray-50' : ''
                } ${!isRead ? 'bg-yellow-50/40 hover:bg-yellow-50/70' : 'hover:bg-gray-50/60'}`}
                onClick={() => markRead(item.id)}
              >
                {/* Bell icon */}
                <div
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
                  style={{
                    backgroundColor: !isRead ? '#FFBF00' : '#F3F4F6',
                  }}
                >
                  <Bell
                    size={18}
                    className={!isRead ? 'text-white' : 'text-gray-400'}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p
                      className="text-sm leading-snug"
                      style={{ color: isRead ? '#6B7280' : '#111827', fontWeight: isRead ? 400 : 600 }}
                    >
                      Deadline segera:{' '}
                      <span style={{ color: isRead ? '#6B7280' : '#1F2937' }}>
                        {item.namaKegiatan}
                      </span>
                    </p>
                    {/* Urgency badge */}
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: urgency.bg, color: urgency.color }}
                    >
                      {urgency.label}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-400">{item.kategori} · {item.jenis}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-400">
                      Deadline: {formatTanggal(item.tanggal)}
                    </span>
                    {sisa < 0 && (
                      <>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-xs font-semibold text-red-500">Terlambat!</span>
                      </>
                    )}
                  </div>

                  {/* Skor */}
                  <div className="mt-1.5">
                    <span className="text-xs text-gray-400">
                      Skor prioritas:{' '}
                      <span className="font-semibold text-red-500">{item.skor}</span>
                    </span>
                  </div>
                </div>

                {/* Unread dot */}
                {!isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBF00] shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
