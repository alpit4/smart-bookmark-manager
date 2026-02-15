"use client";

import { createClient } from "@/utils/supabase/client";
import { Bookmark, Chrome } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
            <Bookmark className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Smart Bookmark</h1>
          <p className="text-zinc-400">
            Save and manage your links with real-time sync
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98]"
        >
          <Chrome className="w-5 h-5" />
          Sign in with Google
        </button>

        <p className="text-xs text-zinc-500">
          Your private, secure bookmark manager.
        </p>
      </div>
    </div>
  );
}
