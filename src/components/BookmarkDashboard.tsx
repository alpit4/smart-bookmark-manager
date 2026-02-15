"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  Search,
  Copy,
  Check,
  LogOut,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
  user_id: string;
  created_at: string;
}

const supabase = createClient();

export default function BookmarkDashboard({ user }: { user: any }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setBookmarks(data || []);
      setLoading(false);
    };

    fetchBookmarks();

    const channel = supabase
      .channel("bookmarks-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        (payload: { eventType: string; new: any; old: any }) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Bookmark;
            if (newItem.user_id === user.id) {
              setBookmarks((prev) => {
                if (prev.some((b) => b.id === newItem.id)) return prev;
                return [newItem, ...prev];
              });
            }
          } else if (payload.eventType === "DELETE") {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([{ url, title, user_id: user.id }])
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else if (data) {
      setBookmarks((prev) => [data as Bookmark, ...prev]);
      setUrl("");
      setTitle("");
    }
    setSubmitting(false);
  };

  const deleteBookmark = async (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    await supabase.from("bookmarks").delete().match({ id });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredBookmarks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return bookmarks;

    return bookmarks.filter((b) => {
      const title = (b.title || "").toLowerCase();
      const url = (b.url || "").toLowerCase();
      return title.includes(query) || url.includes(query);
    });
  }, [bookmarks, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Smart Bookmark
            </h1>
            <p className="text-zinc-500 text-sm font-medium">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-all hover:border-zinc-700"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </header>

        <div className="grid gap-6">
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <form
              onSubmit={addBookmark}
              className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4"
            >
              <input
                type="text"
                placeholder="Title (e.g. Github)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-zinc-600"
                required
              />
              <input
                type="url"
                placeholder="URL (https://...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-zinc-600"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold px-8 py-3 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Add Link
              </button>
            </form>
          </section>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search links or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/20 border border-zinc-800/60 rounded-2xl px-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-lg"
            />
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-zinc-500 font-medium">Loading bookmarks...</p>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center p-20 bg-zinc-900/10 border-2 border-dashed border-zinc-800/50 rounded-3xl">
              <div className="mb-4 flex justify-center">
                <Search className="w-12 h-12 text-zinc-700" />
              </div>
              <p className="text-zinc-400 text-lg font-medium">
                {searchQuery ? "No results found" : "Your library is empty"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBookmarks.map((bookmark: Bookmark) => (
                <div
                  key={bookmark.id}
                  className="group relative flex items-center justify-between bg-zinc-900/30 border border-zinc-800/40 p-5 rounded-2xl hover:bg-zinc-800/40 transition-all"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-lg text-zinc-100 truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                      {bookmark.title}
                    </h3>
                    <p className="text-sm text-zinc-500 truncate mt-1 font-mono">
                      {bookmark.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(bookmark.url, bookmark.id)}
                      className="p-3 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800/80 rounded-xl transition-all"
                    >
                      {copiedId === bookmark.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800/80 rounded-xl transition-all"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="p-3 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
