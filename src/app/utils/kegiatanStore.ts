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
  const target = new Date(tanggal + 'T00:00:00');
  const diff = target.getTime() - now.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function skorToPrioritas(skor: number): 'Tinggi' | 'Sedang' | 'Rendah' {
  if (skor >= 70) return 'Tinggi';
  if (skor >= 40) return 'Sedang';
  return 'Rendah';
}

export function hitungPrioritas(options: {
  kelompok: boolean;
  kategori: string;
  sisaHari: number;
  tingkatKesulitan: number;
  terlambat: boolean;
}): number {
  const base = options.tingkatKesulitan * 10;
  const kelompokBonus = options.kelompok ? 5 : 0;
  const timeFactor = Math.max(0, 30 - options.sisaHari * 2);
  const lateBonus = options.terlambat ? 20 : 0;
  return Math.min(100, Math.max(0, base + kelompokBonus + timeFactor + lateBonus));
}

export function formatTanggal(tanggal: string): string {
  const date = new Date(tanggal + 'T00:00:00');
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
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

