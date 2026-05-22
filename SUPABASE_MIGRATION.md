# Supabase Migration Guide

## Setup Status

✅ **Completed**
- Created Supabase schema in `supabase-db.sql`
  - `profiles` table (linked to `auth.users`)
  - `kegiatans` table with ENUM types
- Created `supabaseClient.ts` for Supabase connection
- Migrated `userStore.ts` to use Supabase with async functions
- Migrated `kegiatanStore.ts` to use Supabase with async functions
- Created `supabaseMigration.ts` for localStorage → Supabase migration

⚠️ **Required Actions**

### 1. Install Supabase Client Package
```bash
npm install @supabase/supabase-js
# or with pnpm
pnpm add @supabase/supabase-js
```

### 2. Deploy Database Schema
1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy contents of `supabase-db.sql` and execute it
4. Verify tables are created: `profiles` and `kegiatans`

### 3. Enable Row-Level Security (RLS) - Optional but Recommended
Create policies to ensure users can only access their own data:

```sql
-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Enable RLS on kegiatans
ALTER TABLE kegiatans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own kegiatans"
  ON kegiatans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own kegiatans"
  ON kegiatans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kegiatans"
  ON kegiatans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own kegiatans"
  ON kegiatans FOR DELETE
  USING (auth.uid() = user_id);
```

## Important Changes to Components

### Async Functions
All store functions are now **async** and return `Promise`:
- `getUser()` → `Promise<UserProfile | null>`
- `getKegiatan()` → `Promise<Kegiatan[]>`
- `saveUser()` → `Promise<void>`
- `addKegiatan()` → `Promise<Kegiatan | null>`
- `updateStatus()` → `Promise<void>`
- `deleteKegiatan()` → `Promise<void>`

### Synchronous Fallback
Two new functions provide cached/synchronous access:
- `getCachedUser()` - returns last cached user (no network call)
- `getCachedKegiatan()` - returns last cached kegiatans (no network call)

### Migration Usage
After user authentication, call migration:
```typescript
import { runFullMigration } from '../utils/supabaseMigration';

// After successful login
await runFullMigration();
```

## Component Update Examples

### Before (localStorage)
```typescript
const user = getUser(); // Synchronous
const kegiatan = getKegiatan(); // Synchronous
```

### After (Supabase)
```typescript
// Option 1: Async/await
const user = await getUser();
const kegiatan = await getKegiatan();

// Option 2: Sync fallback (for initial render)
const user = getCachedUser();
const kegiatan = getCachedKegiatan();

// Then fetch fresh data in useEffect
useEffect(() => {
  getKegiatan().then(data => setKegiatan(data));
}, []);
```

## Updated Components to Modify

The following components use store functions and need updates:

1. **src/app/pages/Dashboard.tsx** - getKegiatan calls
2. **src/app/pages/DaftarKegiatan.tsx** - getKegiatan, deleteKegiatan, updateStatus
3. **src/app/pages/InputKegiatan.tsx** - addKegiatan
4. **src/app/pages/DashboardAnalitik.tsx** - getKegiatan
5. **src/app/pages/Profil.tsx** - getUser
6. **src/app/pages/Login.tsx** - saveUser, getUser
7. **src/app/pages/Register.tsx** - saveUser
8. **src/app/components/Sidebar.tsx** - getUser

### Pattern for Updating Components
```typescript
import { useEffect, useState } from 'react';

export function MyComponent() {
  const [data, setData] = useState<MyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getMyData();
        setData(result);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render data */}</div>;
}
```

## Testing Checklist

- [ ] Install `@supabase/supabase-js` package
- [ ] Execute `supabase-db.sql` schema in Supabase SQL Editor
- [ ] Verify tables exist in Supabase dashboard
- [ ] Test login and user profile save
- [ ] Test adding a new kegiatan (activity)
- [ ] Test updating activity status
- [ ] Test deleting an activity
- [ ] Test logout
- [ ] Verify localStorage data migrates to Supabase on first login
- [ ] Test user data persistence across page reloads

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
→ Run `npm install @supabase/supabase-js`

### "No authenticated user" warnings
→ Ensure user is logged in with Supabase auth before making store calls

### Network errors in console
→ Check Supabase environment variables in `.env`:
- `VITE_SUPABASE_URL` should be your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` should be your anon key

### Data not appearing after migration
→ Check Supabase dashboard to verify tables have data
→ Confirm user ID is correctly saved in profiles table

## Next Steps

1. Install Supabase package
2. Deploy schema to Supabase
3. Update components to handle async functions
4. Test migration workflow
5. Enable RLS policies for production security
