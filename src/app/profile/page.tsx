"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { MapPin, Link as LinkIcon, Calendar, Edit3, Settings, Grid, List, Heart } from "lucide-react";
import { useState } from "react";
import { Feed } from "@/components/feed/feed"; 
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("posts");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("list");

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="pt-24 md:pt-32">
        
        {/* Profile Info Container (Padded) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {/* Profile Card - Unique 'Floating' Glass Layout */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
               {/* Decorative blurred backdrop behind card */}
               <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-[2.5rem] blur-2xl -z-10 opacity-50" />
               
               <div className="glass rounded-[2rem] border border-white/5 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden group">
                  {/* Subtle shine effect */}
                  <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-white/20 to-transparent opacity-50" />
                  
                  {/* Avatar Section */}
                  <div className="relative shrink-0 mx-auto md:mx-0">
                     <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] p-1 bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/10 overflow-hidden relative z-10">
                        <img 
                          src={user.imageUrl} 
                          alt={user.fullName || ""}
                          className="w-full h-full rounded-[1.8rem] object-cover"
                        />
                     </div>
                     {/* Soft glow under avatar */}
                     <div className="absolute -inset-4 bg-primary/20 blur-xl -z-10 rounded-full opacity-60" />
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 text-center md:text-left space-y-4 w-full">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-white/70 tracking-tight">
                                {user.fullName}
                            </h1>
                            <p className="text-lg text-muted-foreground font-light tracking-wide mt-1">@{user.username}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 justify-center md:justify-end">
                            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all active:scale-95">
                                <Edit3 size={16} /> Edit Profile
                            </button>
                            <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <Settings size={18} />
                            </button>
                        </div>
                     </div>

                     <p className="text-base text-gray-300 font-light leading-relaxed max-w-2xl mx-auto md:mx-0">
                        Digital craftsman based in cyber-space. Building sleek interfaces and exploring the boundaries of web typography.
                     </p>
                     
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-muted-foreground pt-2">
                        <span className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> Tokyo, Japan</span>
                        <a href="#" className="flex items-center gap-2 hover:text-white transition-colors"><LinkIcon size={14} className="text-primary" /> portfolio.design</a>
                        <span className="flex items-center gap-2"><Calendar size={14} className="text-primary" /> Joined 2024</span>
                     </div>
                  </div>
               </div>

               {/* Stats Row - Floating below */}
               <div className="grid grid-cols-3 gap-4 mt-6">
                  {[
                      { label: "Followers", value: "2.4k" },
                      { label: "Following", value: "840" },
                      { label: "Likes", value: "12.8k" }
                  ].map((stat, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        key={stat.label}
                        className="glass rounded-2xl p-4 text-center border border-white/5 hover:bg-white/5 transition-colors"
                      >
                          <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{stat.label}</div>
                      </motion.div>
                  ))}
               </div>
            </motion.div>

            {/* Controls */}
            <div className="mt-16 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                       {["posts", "media", "likes"].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                            )}
                          >
                             {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                       ))}
                    </div>

                    <div className="gap-1 bg-white/5 p-1 rounded-lg hidden md:flex">
                         <button onClick={() => setViewLayout("grid")} className={cn("p-2 rounded-md transition-all", viewLayout === "grid" ? "bg-white/10 text-white" : "text-muted-foreground")}><Grid size={16} /></button>
                         <button onClick={() => setViewLayout("list")} className={cn("p-2 rounded-md transition-all", viewLayout === "list" ? "bg-white/10 text-white" : "text-muted-foreground")}><List size={16} /></button>
                    </div>
                </div>
            </div>
        </div>

        {/* Content Section - Breakout on Mobile */}
        <div className="max-w-5xl mx-auto md:px-6"> 
            <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4 }}
            >
                {activeTab === "posts" && (
                    <div className="max-w-4xl mx-auto">
                        <Feed />
                    </div>
                )}
                
                {activeTab === "media" && (
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-4 md:px-0">
                        {[1,2,3,4,5,6].map((i) => (
                           <div key={i} className="aspect-square bg-white/5 rounded-2xl border border-white/5 hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                   <Heart className="fill-white text-white" />
                                </div>
                                <img src={`https://picsum.photos/500?random=${i}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                           </div>
                        ))}
                     </div>
                )}

                {activeTab === "likes" && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Heart size={48} className="mb-4 stroke-1 opacity-50" />
                        <p>No liked posts yet</p>
                    </div>
                )}
            </motion.div>
        </div>

      </div>
    </div>
  );
}
