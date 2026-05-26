import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';

import { getKegiatan } from '../utils/kegiatanStore';
import type { Kegiatan } from '../utils/kegiatanStore';

export function DaftarKegiatan() {
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getKegiatan();
      setKegiatan(data);
    };

    fetchData();
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Daftar Kegiatan
          </h1>

          <p className="text-sm text-gray-400">
            Semua kegiatan yang sudah kamu tambahkan
          </p>
        </div>

        <button
          onClick={() => navigate('/input-kegiatan')}
          className="flex items-center gap-2 bg-[#FFBF00] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#e6ac00]"
        >
          <Plus size={18} />
          Tambah
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {kegiatan.length > 0 ? (
          kegiatan.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
            >
              <h2 className="font-semibold text-gray-800">
                {item.namaKegiatan}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {item.kategori} • {item.jenis}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {item.tanggal}
                </span>

                <span className="text-sm font-semibold text-[#FFBF00]">
                  {item.prioritas}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Belum ada kegiatan
          </div>
        )}
      </div>
    </div>
  );
}
