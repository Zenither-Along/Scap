"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Hash, Star, Zap, Code, Image as ImageIcon, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

// Mock Data for "Unregular" Layout
const EXPLORE_ITEMS = [
  { id: 1, type: "code", title: "Glassmorphism CSS Snippet", author: "ui_wizard", tags: ["css", "ui"], size: "large", color: "from-purple-500/20 to-blue-500/20" },
  { id: 2, type: "image", title: "Neon Nights", author: "cyber_junkie", tags: ["art", "cyberpunk"], size: "medium", image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2670&auto=format&fit=crop" },
  { id: 3, type: "text", title: "Why React Server Components change everything.", author: "dan_a", tags: ["react", "blog"], size: "small", color: "from-green-500/20 to-emerald-500/20" },
  { id: 4, type: "code", title: "Python Data Viz", author: "data_sci", tags: ["python", "data"], size: "medium", color: "from-yellow-500/20 to-orange-500/20" },
  { id: 5, type: "image", title: "Abstract Flow", author: "motion_guy", tags: ["3d", "render"], size: "tall", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" },
  { id: 6, type: "text", title: "Design Systems 101", author: "design_sys", tags: ["ux"], size: "wide", color: "from-pink-500/20 to-rose-500/20" },
  { id: 7, type: "code", title: "Rust Async Await", author: "ferris", tags: ["rust"], size: "small", color: "from-orange-600/20 to-red-600/20" },
];

export default function ExplorePage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Suggestions State
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Suggestions Fetcher (Debounced)
  useEffect(() => {
    const fetchSuggestions = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
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
  }, [searchQuery, showSuggestions]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/explore/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-8 px-4 md:px-8 max-w-[1600px] mx-auto">
      
      {/* 1. Header Area: Floating Search & Tags */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12 z-40 pointer-events-none relative">
         {/* 'Morphing' Search Bar */}
         <div className={cn(
             "relative pointer-events-auto transition-all duration-500 ease-out bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-visible z-50",
             isSearchFocused ? "w-full md:w-[600px] border-white/30 bg-black/80 shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]" : "w-full md:w-[400px] rounded-full"
         )}>
             <div className="flex items-center px-6 gap-3 w-full">
                <Search size={20} className="text-muted-foreground min-w-[20px]" />
                <input 
                  type="text" 
                  placeholder="Search the universe..." 
                  className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 py-4 text-lg placeholder:text-muted-foreground/50"
                  onFocus={() => { setIsSearchFocused(true); setShowSuggestions(true); }}
                  onBlur={() => { setIsSearchFocused(false); setTimeout(() => setShowSuggestions(false), 200); }}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
             </div>

             {/* Suggestions Dropdown */}
             <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && isSearchFocused && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full px-2 pb-2"
                    >
                        <div className="h-px bg-white/10 mx-4 mb-2" />
                        <div className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Suggested Users</div>
                        {suggestions.map((user) => (
                            <Link
                                key={user.id}
                                href={`/user/${user.username}`}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors rounded-xl"
                            >
                                <img 
                                    src={user.avatar_url || '/default-avatar.png'} 
                                    alt={user.username} 
                                    className="w-10 h-10 rounded-full bg-neutral-800 object-cover"
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

         {/* Floating Tags */}
         <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto mask-gradient-x">
             {[
               { id: "all", icon: Star, label: "For You" },
               { id: "code", icon: Code, label: "Code" },
               { id: "art", icon: ImageIcon, label: "Visuals" },
               { id: "trending", icon: Zap, label: "Trending" }
             ].map(tag => (
                <button
                   key={tag.id}
                   onClick={() => setActiveFilter(tag.id)}
                   className={cn(
                      "flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all border",
                      activeFilter === tag.id ? "bg-white text-black border-white scale-105" : "bg-black/40 text-muted-foreground border-white/10 hover:border-white/30 hover:text-white"
                   )}
                >
                    <tag.icon size={14} /> {tag.label}
                </button>
             ))}
         </div>
      </div>

      {/* 2. dynamic styling with CSS Columns (Masonry) */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
         {EXPLORE_ITEMS.map((item, i) => (
             <motion.div
                layoutId={`card-${item.id}`}
                key={item.id}
                initial={{ opacity: 0, scale: 0.9, y: 50, rotate: (i % 2 === 0 ? 2 : -2) }} // Deterministic rotation
                whileInView={{ opacity: 1, scale: 1, y: 0, rotate: 0 }} // Straighten on view
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: i * 0.1, type: "spring" }}
                className={cn(
                    "break-inside-avoid relative rounded-4xl overflow-hidden border border-white/5 group bg-[#0a0a0a] cursor-pointer",
                    item.size === "tall" && "h-[500px]",
                    item.size === "wide" && "h-[300px]",
                    item.size === "medium" && "h-[400px]",
                    item.size === "small" && "min-h-[200px]"
                )}
             >
                {/* Background or Image */}
                {item.image ? (
                    <>
                       <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${item.image})` }} />
                       <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />
                    </> 
                ) : (
                    <div className={cn("absolute inset-0 bg-linear-to-br opacity-50 transition-opacity group-hover:opacity-80", item.color)} />
                )}

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="flex justify-between items-start absolute top-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
                         <div className="flex gap-2">
                            {item.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">#{tag}</span>
                            ))}
                         </div>
                         <button className="p-2 rounded-full bg-white text-black hover:scale-110 transition-transform">
                             <ArrowUpRight size={16} />
                         </button>
                    </div>

                    <div className="transform group-hover:-translate-y-2 transition-transform duration-300">
                      <div className="flex items-center gap-2 mb-2 text-white/60 text-xs font-mono">
                         {item.type === 'code' && <Code size={12} />}
                         {item.type === 'image' && <ImageIcon size={12} />}
                         @{item.author}
                      </div>
                      <h3 className={cn("font-bold leading-tight text-white", item.size === 'small' ? "text-xl" : "text-3xl")}>
                          {item.title}
                      </h3>
                    </div>
                </div>

                {/* Interactive 'Noise' or 'Glitch' overlay optional */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 mix-blend-overlay transition-opacity duration-300 pointer-events-none" />
             </motion.div>
         ))}
      </div>

    </div>
  );
}
