# Smart Bookmark Manager

## 🌐 Deploy Link

- **Live Link** : [ Go to Website ](https://smart-bookmark-manager-eta.vercel.app/)

A premium, real-time bookmark manager built with Next.js 15, Supabase, and Tailwind CSS. Features Google OAuth for secure access and instantaneous synchronization across tabs.

## 🚀 Features

- **Google OAuth Only**: Secure login using Google (no passwords required).
- **Private Bookmarks**: User-specific data isolation via Supabase RLS.
- **Real-time Sync**: Instant updates across all open tabs using Supabase Realtime.
- **Premium Design**: Dark-mode first UI with glassmorphism and smooth interactions.
- **Fast CRUD**: Effortlessly add and delete bookmarks.

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Auth & Database**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📝 Challenges & Solutions

### 1. Real-time Synchronization Complexity

**Problem**: Ensuring that adding a bookmark in one tab immediately reflects in another without a manual refresh.

**Solution**: Leveraged Supabase's `postgres_changes` channel. I implemented a `useEffect` hook in the `BookmarkList` component that listens for `INSERT` and `DELETE` events on the `bookmarks` table, updating the local React state instantly.

### 2. User Data Privacy (RLS)

**Problem**: Preventing User A from accidentally or maliciously accessing User B's bookmarks.

**Solution**: Instead of relying solely on frontend filters, I implemented Row Level Security (RLS) in Supabase. The policy `auth.uid() = user_id` ensures that the database itself rejects any unauthorized requests, providing a robust security layer.

### 3. Google OAuth Redirects in Next.js 15

**Problem**: Handling the redirect flow from Google back to the application while maintaining a valid session.

**Solution**: Created a dedicated `auth/callback` route handler. This handler exchanges the temporary code from Supabase for a permanent session and correctly handles redirects for both local development and production (Vercel) environments.

## ⚙️ Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

### 3. Install & Run

```bash
npm install
npm run dev
```

## 🌐 Deployment

Deploy easily to Vercel:

1. Connect your Github Repo.
2. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel environment variables.
3. Git push to deploy!
