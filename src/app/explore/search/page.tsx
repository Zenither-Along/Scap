"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PostCard, type Post } from "@/components/feed/post-card";

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio?: string;
  is_following?: boolean;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"people" | "posts">("people");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update local state if URL param changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Main Search (Debounced)
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) return;
      
      setLoading(true);
      try {
        if (activeTab === "people") {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setUsers(data.users || []);
          }
        } else {
          const res = await fetch(`/api/posts?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setPosts(data.posts || []);
          }
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
        fetchResults();
    }, 300); 

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  // Suggestions Fetcher (Debounced)
  useEffect(() => {
    const fetchSuggestions = async () => {
        if (!query.trim() || query.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.users || []);
            }
        } catch (error) {
            console.error("Suggestion error:", error);
        }
    };

    const timer = setTimeout(() => {
        if (showSuggestions) fetchSuggestions();
    }, 200);

    return () => clearTimeout(timer);
  }, [query, showSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (query.trim()) {
      router.push(`/explore/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-4 px-4 md:px-8 max-w-[1000px] mx-auto">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-3xl pb-4 pt-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-white/5 space-y-4 shadow-xl">
          <div className="flex items-center gap-4">
              <Link href="/explore" className="shrink-0 p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white">
                  <ArrowLeft size={24} />
              </Link>
              
              <div className="flex-1 min-w-0 relative">
                  <form onSubmit={handleSearch}>
                      <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-white transition-colors" size={20} />
                          <input 
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                            placeholder="Search users, posts..."
                            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all font-medium placeholder:text-muted-foreground/50"
                            autoFocus
                            autoComplete="off"
                          />
                      </div>
                  </form>

                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 py-2"
                        >
                            <div className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Suggested Users</div>
                            {suggestions.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/user/${user.username}`}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors"
                                    onClick={() => setShowSuggestions(false)}
                                >
                                    <img 
                                        src={user.avatar_url || '/default-avatar.png'} 
                                        alt={user.username} 
                                        className="w-8 h-8 rounded-full bg-neutral-800 object-cover"
                                    />
                                    <div>
                                        <div className="text-sm font-bold text-white">{user.full_name}</div>
                                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                                    </div>
                                </Link>
                            ))}
                        </motion.div>
                    )}
                  </AnimatePresence>
              </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient-x">
              <button 
                  onClick={() => setActiveTab("people")}
                  className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all border shrink-0",
                      activeTab === "people" 
                          ? "bg-white text-black border-white" 
                          : "bg-transparent text-muted-foreground border-transparent hover:bg-white/5 hover:text-white"
                  )}
              >
                  <Users size={18} /> People
              </button>
              <button 
                  onClick={() => setActiveTab("posts")}
                  className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all border shrink-0",
                      activeTab === "posts" 
                          ? "bg-white text-black border-white" 
                          : "bg-transparent text-muted-foreground border-transparent hover:bg-white/5 hover:text-white"
                  )}
              >
                  <FileText size={18} /> Posts
              </button>
          </div>
      </div>

      {/* Results */}
      <div className="mt-6">
          {loading ? (
             <div className="flex justify-center py-20">
                 <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
             </div>
          ) : (
             <AnimatePresence mode="wait">
                 {activeTab === "people" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {users.length === 0 ? (
                            <EmptyState message={`No users found for "${query}"`} />
                        ) : (
                            users.map((user) => (
                                <Link 
                                    key={user.id} 
                                    href={`/user/${user.username}`}
                                    className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                                >
                                    <img 
                                        src={user.avatar_url || '/default-avatar.png'} 
                                        alt={user.full_name} 
                                        className="w-14 h-14 rounded-full bg-neutral-800 object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-white truncate">{user.full_name}</h3>
                                            {user.is_following && (
                                                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider text-white/80">Following</span>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground truncate">@{user.username}</p>
                                        {user.bio && <p className="text-sm text-gray-500 line-clamp-1 mt-1">{user.bio}</p>}
                                    </div>
                                </Link>
                            ))
                        )}
                    </motion.div>
                 )}

                 {activeTab === "posts" && (
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        {posts.length === 0 ? (
                            <EmptyState message={`No posts found for "${query}"`} />
                        ) : (
                            posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))
                        )}
                    </motion.div>
                 )}
             </AnimatePresence>
          )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-lg">{message}</p>
        </div>
    );
}
