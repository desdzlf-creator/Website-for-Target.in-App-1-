/* ─────────────────────────────────────────
   userStore.ts — user session store (Supabase)
   Adds a small React hook `useUserStore` so pages can subscribe
   to the cached user state and ensures events fire when the
   cache changes so components stay in sync.
   ───────────────────────────────────────── */
import { supabase } from './supabaseClient';
import { useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  id?: string;
  nama: string;
  email: string;
}

let cachedUser: UserProfile | null = null;
let cacheLoaded = false;

export async function getUser(): Promise<UserProfile | null> {
  try {
    console.log('👤 GETUSER: Calling supabase.auth.getUser()...');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ GETUSER: Auth error:', authError);
      return cachedUser;
    }

    if (!authUser) {
      console.warn('⚠️ GETUSER: No authenticated user');
      cachedUser = null;
      cacheLoaded = false;
      try { window.dispatchEvent(new Event('user-updated')); } catch {}
      return null;
    }

    console.log('👤 GETUSER: Auth user found:', authUser.email, 'ID:', authUser.id);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('nama, email')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('❌ GETUSER: Profile fetch error:', error.message);
      return cachedUser;
    }

    if (!profile) {
      console.warn('⚠️ GETUSER: No profile found in database');
      cachedUser = null;
      cacheLoaded = false;
      try { window.dispatchEvent(new Event('user-updated')); } catch {}
      return null;
    }

    cachedUser = {
      id: authUser.id,
      nama: profile.nama,
      email: profile.email,
    };
    cacheLoaded = true;
    console.log('✅ GETUSER: Profile loaded:', cachedUser);
    
    // notify listeners
    try { window.dispatchEvent(new Event('user-updated')); } catch {}
    return cachedUser;
  } catch (err) {
    console.error('❌ GETUSER: Unexpected error:', err);
    return cachedUser;
  }
}

export function getCachedUser(): UserProfile | null {
  return cachedUser;
}

export async function saveUser(user: UserProfile): Promise<void> {
  try {
    console.log('💾 SAVEUSER: Saving user:', user.email);

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ SAVEUSER: Auth error:', authError);
      return;
    }

    if (!authUser) {
      console.warn('⚠️ SAVEUSER: No authenticated user found');
      cachedUser = user;
      try { window.dispatchEvent(new Event('user-updated')); } catch {}
      return;
    }

    console.log('💾 SAVEUSER: Upserting profile for user ID:', authUser.id);

    const { error } = await supabase
      .from('profiles')  // ✅ using 'profiles' table
      .upsert({
        id: authUser.id,
        email: user.email,
        nama: user.nama,
      }, { onConflict: 'id' });

    if (error) {
      console.error('❌ SAVEUSER: Database error:', error.message);
      return;
    }

    cachedUser = {
      id: authUser.id,
      ...user,
    };
    console.log('✅ SAVEUSER: User saved successfully');
    
    try { window.dispatchEvent(new Event('user-updated')); } catch {}
  } catch (err) {
    console.error('❌ SAVEUSER: Unexpected error:', err);
  }
}

export async function clearUser(): Promise<void> {
  try {
    console.log('🚪 CLEARUSER: Signing out user...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ CLEARUSER: Sign out error:', error);
      return;
    }

    cachedUser = null;
    cacheLoaded = false;
    console.log('✅ CLEARUSER: User cleared, cache reset');
    
    try { window.dispatchEvent(new Event('user-updated')); } catch {}
  } catch (err) {
    console.error('❌ CLEARUSER: Unexpected error:', err);
  }
}

export function getFirstName(nama: string): string {
  return nama.trim().split(' ')[0] || nama;
}

export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// React hook for components that expect `useUserStore()`
export function useUserStore() {
  const [user, setUser] = useState<UserProfile | null>(() => cachedUser);

  const refresh = useCallback(async () => {
    const u = await getUser();
    setUser(u);
    return u;
  }, []);

  useEffect(() => {
    // on mount try to load cached or fresh user
    let mounted = true;
    (async () => {
      const u = await getUser();
      if (mounted) setUser(u);
    })();

    const onUpdate = () => setUser(cachedUser);
    window.addEventListener('user-updated', onUpdate);
    return () => { mounted = false; window.removeEventListener('user-updated', onUpdate); };
  }, []);

  return {
    user,
    getUser: refresh,
    saveUser,
    clearUser,
  } as const;
}
