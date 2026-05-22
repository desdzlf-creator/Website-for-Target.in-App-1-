/* ─────────────────────────────────────────
   Supabase migration helper
   Sync localStorage data to Supabase
   ───────────────────────────────────────── */

import { supabase } from './supabaseClient';
import type { Kegiatan } from './kegiatanStore';

/**
 * Migrate localStorage user data to Supabase
 */
export async function migrateLocalStorageUser(): Promise<boolean> {
  try {
    const localStorageKey = 'target_in_user';
    const localData = localStorage.getItem(localStorageKey);
    
    if (!localData) {
      console.log('No localStorage user data to migrate');
      return true;
    }

    const user = JSON.parse(localData);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      console.warn('No authenticated user for migration');
      return false;
    }

    // Upsert profile
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: user.email,
        nama: user.nama,
      }, { onConflict: 'id' });

    if (error) {
      console.error('Failed to migrate user:', error);
      return false;
    }

    console.log('User data migrated successfully');
    // Clear localStorage after successful migration
    localStorage.removeItem(localStorageKey);
    return true;
  } catch (err) {
    console.error('migrateLocalStorageUser error:', err);
    return false;
  }
}

/**
 * Migrate localStorage kegiatans to Supabase
 */
export async function migrateLocalStorageKegiatans(): Promise<boolean> {
  try {
    const localStorageKey = 'target_in_kegiatan';
    const localData = localStorage.getItem(localStorageKey);
    
    if (!localData) {
      console.log('No localStorage kegiatans data to migrate');
      return true;
    }

    const kegiatans: Kegiatan[] = JSON.parse(localData);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No authenticated user for kegiatans migration');
      return false;
    }

    if (kegiatans.length === 0) {
      console.log('No kegiatans to migrate');
      return true;
    }

    // Transform and insert kegiatans
    const { error } = await supabase
      .from('kegiatans')
      .insert(
        kegiatans.map((k) => ({
          id: k.id,
          user_id: user.id,
          nama_kegiatan: k.namaKegiatan,
          jenis: k.jenis,
          kategori: k.kategori,
          tingkat_kesulitan: k.tingkatKesulitan,
          tanggal: k.tanggal,
          terlambat: k.terlambat,
          skor: k.skor,
          prioritas: k.prioritas,
          status: k.status,
          created_at: k.createdAt,
        }))
      );

    if (error) {
      console.error('Failed to migrate kegiatans:', error);
      return false;
    }

    console.log(`${kegiatans.length} kegiatans migrated successfully`);
    // Clear localStorage after successful migration
    localStorage.removeItem(localStorageKey);
    return true;
  } catch (err) {
    console.error('migrateLocalStorageKegiatans error:', err);
    return false;
  }
}

/**
 * Run full migration from localStorage to Supabase
 * Call this after user authentication
 */
export async function runFullMigration(): Promise<boolean> {
  try {
    console.log('Starting migration from localStorage to Supabase...');
    
    const userMigrated = await migrateLocalStorageUser();
    const kegiatanMigrated = await migrateLocalStorageKegiatans();

    if (userMigrated && kegiatanMigrated) {
      console.log('Migration completed successfully');
      return true;
    } else {
      console.warn('Migration completed with errors');
      return false;
    }
  } catch (err) {
    console.error('runFullMigration error:', err);
    return false;
  }
}
