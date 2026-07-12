# Campus Revenu — Supabase Setup (do this once)

The whole backend is already coded. The app runs in **mock mode** until you add
your Supabase keys, then everything (auth, tasks, submissions, wallet, realtime)
goes live automatically. Follow these steps.

## 1. Create the project (you must do this — needs a DB password)
1. Go to <https://supabase.com/dashboard> → **New project**.
2. Name: `campus-revenu`. Set a **database password** (save it somewhere).
3. Region: pick an **EU** region (e.g. Frankfurt or Paris) — required for GDPR.
4. Plan: Free is fine to start. Click **Create new project** and wait ~2 min.

## 2. Run the database schema
1. In the project, open **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this repo, copy everything, paste, click **Run**.
3. It creates all tables, security rules, business functions, the `proofs`
   storage bucket, realtime, and 5 seed tasks.

## 3. Add your keys to the app
1. In Supabase: **Project Settings → API**.
2. Copy **Project URL** and the **anon / public** key.
3. Open `.env.local` in this folder and fill:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

## 4. Configure auth URLs
1. Supabase → **Authentication → URL Configuration**.
2. **Site URL:** `http://localhost:3001`
3. **Redirect URLs:** add `http://localhost:3001/auth/callback`
   (add your production domain later too).
4. Email auth is on by default. (Optional: for quick testing you can turn off
   "Confirm email" under Authentication → Providers → Email.)

## 5. Make yourself the admin
1. Restart the dev server: `pnpm dev`.
2. Sign up in the app with your email (creates a `student` profile automatically).
3. Back in Supabase **SQL Editor**, run (with your email):
   ```sql
   update public.profiles set role = 'admin', verified = true
   where email = 'YOUR_EMAIL@example.com';
   ```
4. Log out and back in → you now land on the **/admin** panel.

## 6. (Optional) Google login
Supabase → Authentication → Providers → **Google** → enable and add your Google
OAuth client id/secret. The "Continue with Google" buttons already call it.

---

## How it works once live
- **Sign up / login** → real Supabase Auth, session cookies, role-based routing
  (student → `/dashboard`, admin/moderator → `/admin`), enforced in `proxy.ts`.
- **Submit proof** → image uploads to the private `proofs` bucket, `submit_proof`
  RPC adds the reward to your **pending** balance.
- **Approve/reject** (admin) → `review_submission` RPC moves pending→available,
  bumps tasks-completed, writes a transaction, notification, and audit entry.
- **Withdraw** → `request_withdrawal` RPC checks the €20 min + French IBAN and
  debits available balance; admin `process_withdrawal` marks it paid.
- **Realtime** → any change to submissions / notifications / balances / withdrawals
  instantly refreshes every open screen (see `realtime-sync.tsx`).

All money logic runs inside `security definer` Postgres functions, and every table
is protected by Row Level Security — the browser can never write balances directly.

> Remove the dev view-switcher pill (`dev-view-switcher.tsx`) before production —
> it's only there because mock mode has no login.
