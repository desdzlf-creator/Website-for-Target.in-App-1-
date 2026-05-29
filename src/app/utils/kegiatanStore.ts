import { supabase } from './supabaseClient';

export type Kegiatan = {
  id: string;
  user_id: string;
  namaKegiatan: string;
  jenis: 'Kelompok' | 'Individu';
  kategori: 'Tugas' | 'Ujian' | 'Organisasi' | 'Pribadi';
  tingkatKesulitan: number;
  tanggal: string;
  terlambat: boolean;
  skor: number;
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
  status: 'Belum Selesai' | 'Sudah Selesai';
  createdAt: string;
};

let kegiatanCache: Kegiatan[] = [];

export function hitungSisaHari(tanggal: string): number {
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  let target: Date;

  // format YYYY-MM-DD
  if (tanggal.includes('-')) {
    const [year, month, day] = tanggal.split('-').map(Number);
    target = new Date(year, month - 1, day);
  } else {
    // fallback format lain
    target = new Date(tanggal);
  }

  const diffTime = target.getTime() - today.getTime();

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatTanggal(tanggal: string): string {
  const date = new Date(tanggal + 'T00:00:00');
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function hitungPrioritas(options: {
  kelompok: boolean;
  kategori: string;
  sisaHari: number;
  tingkatKesulitan: number;
  terlambat: boolean;
}): number {
  let skor = 0;
  skor += options.kelompok ? 15 : 5;
  if (options.kategori === 'Tugas' || options.kategori === 'Ujian') skor += 25;
  else skor += 15;
  if (options.sisaHari <= 8) skor += 25;
  else skor += 10;
  skor += options.tingkatKesulitan * 4;
  if (options.terlambat) skor += 15;
  return skor;
}

export function skorToPrioritas(skor: number): 'Tinggi' | 'Sedang' | 'Rendah' {
  if (skor >= 80) return 'Tinggi';
  if (skor >= 60) return 'Sedang';
  return 'Rendah';
}
export function formatDeadlineLabel(tanggal: string): string {
  const sisa = hitungSisaHari(tanggal);
  if (sisa < 0) return `Lewat ${Math.abs(sisa)} hari`;
  if (sisa === 0) return 'Hari ini';
  if (sisa === 1) return 'Besok';
  return `${sisa} hari lagi`;
}

export async function getKegiatan(): Promise<Kegiatan[]> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('📦 GETKEGIATAN: Session check:', session?.user?.email);

    if (sessionError) {
      console.error('❌ GETKEGIATAN: Session error:', sessionError);
      return kegiatanCache;
    }

    const user = session?.user;
    if (!user) {
      console.warn('⚠️ GETKEGIATAN: No authenticated user');
      return kegiatanCache;
    }

    console.log('📦 GETKEGIATAN: Fetching for user:', user.id);

    const { data, error } = await supabase
      .from('kegiatans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ GETKEGIATAN: Query error:', error);
      return kegiatanCache;
    }

    if (!data) {
      console.warn('⚠️ GETKEGIATAN: No data returned');
      return kegiatanCache;
    }

    const mapped = data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      namaKegiatan: item.nama_kegiatan,
      jenis: item.jenis,
      kategori: item.kategori,
      tingkatKesulitan: item.tingkat_kesulitan,
      tanggal: item.tanggal,
      terlambat: item.terlambat,
      skor: item.skor,
      prioritas: item.prioritas,
      status: item.status,
      createdAt: item.created_at,
    }));

    console.log('✅ GETKEGIATAN: Loaded', mapped.length, 'kegiatans');
    kegiatanCache = mapped;
    return mapped;
  } catch (err) {
    console.error('❌ GETKEGIATAN: Unexpected error:', err);
    return kegiatanCache;
  }
}

export async function addKegiatan(
  item: Omit<Kegiatan, 'id' | 'createdAt'>
): Promise<Kegiatan | null> {
  try {
    console.log('🔄 ADDKEGIATAN: Starting...');

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('🔄 ADDKEGIATAN: Session check:', session?.user?.email);

    if (sessionError) {
      console.error('❌ ADDKEGIATAN: Session error:', sessionError);
      return null;
    }

    const user = session?.user;
    if (!user) {
      console.warn('❌ ADDKEGIATAN: No authenticated user found');
      return null;
    }

    console.log('🔄 ADDKEGIATAN: User ID:', user.id);
    console.log('🔄 ADDKEGIATAN: Kegiatan name:', item.namaKegiatan);

    const newItem: Kegiatan = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    console.log('🔄 ADDKEGIATAN: Inserting to database...');

    const { error } = await supabase
      .from('kegiatans')
      .insert({
        id: newItem.id,
        user_id: user.id,
        nama_kegiatan: newItem.namaKegiatan,
        jenis: newItem.jenis,
        kategori: newItem.kategori,
        tingkat_kesulitan: newItem.tingkatKesulitan,
        tanggal: newItem.tanggal,
        terlambat: newItem.terlambat,
        skor: newItem.skor,
        prioritas: newItem.prioritas,
        status: newItem.status,
        created_at: newItem.createdAt,
      });

    if (error) {
      console.error('❌ ADDKEGIATAN: Insert error:', error);
      return null;
    }

    console.log('✅ ADDKEGIATAN: Insert successful');

    kegiatanCache = [newItem, ...kegiatanCache];
    console.log('✅ ADDKEGIATAN: Cache updated, dispatching event');
    
    window.dispatchEvent(new Event('kegiatan-updated'));

    return newItem;
  } catch (err) {
    console.error('❌ ADDKEGIATAN: Unexpected error:', err);
    return null;
  }
}

