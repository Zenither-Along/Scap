"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, UserPlus, MessageCircle, Zap, Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock Notifications
const NOTIFICATIONS = [
  { id: 1, type: "like", user: "ui_wizard", avatar: "https://i.pravatar.cc/150?u=1", text: "liked your glassmorphism post", time: "2m ago" },
  { id: 2, type: "follow", user: "dev_jane", avatar: "https://i.pravatar.cc/150?u=2", text: "started following you", time: "1h ago" },
  { id: 3, type: "comment", user: "react_fan", avatar: "https://i.pravatar.cc/150?u=3", text: "commented: 'This is insane! 🤯'", time: "3h ago" },
  { id: 4, type: "star", user: "scap_official", avatar: "https://i.pravatar.cc/150?u=99", text: "featured your snippet in Weekly Top 10", time: "1d ago" },
  { id: 5, type: "like", user: "frontend_dude", avatar: "https://i.pravatar.cc/150?u=4", text: "liked your post", time: "1d ago" },
  { id: 6, type: "follow", user: "newbie_coder", avatar: "https://i.pravatar.cc/150?u=5", text: "started following you", time: "2d ago" },
];

export default function ActivityPage() {
  const [filter, setFilter] = useState("all");

  const filteredNotifications = NOTIFICATIONS.filter(item => {
    if (filter === "all") return true;
    if (filter === "nears") return item.type === "like" || item.type === "star" || item.type === "comment"; // Grouping interaction-like stuff
    if (filter === "system") return item.type === "system"; // Assuming system type exists or mapping others
    // For simplicity, let's map: 
    // All, Likes, Mentions
    if (filter === "likes") return item.type === "like";
    if (filter === "mentions") return item.type === "comment" || item.type === "mention"; // assuming mention type
    return true;
  });

  // Let's implement specific consistent tabs requested commonly: All, Likes, Comments, Follows
  const actualFiltered = NOTIFICATIONS.filter(item => {
      if (filter === "all") return true;
      if (filter === "likes") return item.type === "like";
      if (filter === "comments") return item.type === "comment";
      if (filter === "follows") return item.type === "follow";
      return true;
  });

  return (
    <div className="min-h-screen pb-20 pt-8 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 pl-4 border-l-4 border-primary">Activity</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 select-none no-scrollbar">
          {["all", "likes", "comments", "follows"].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                    filter === tab 
                        ? "bg-white text-black border-white" 
                        : "bg-black/20 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white"
                )}
              >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
          ))}
      </div>

      <div className="relative">
         {/* Liquid Connector Line */}
         <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-linear-to-b from-primary/50 via-purple-500/20 to-transparent" />

         <div className="space-y-6">
            <AnimatePresence mode="popLayout">
            {actualFiltered.map((item, i) => (
               <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4 relative group cursor-pointer"
               >
                  {/* Icon Bubble */}
                  <div className="relative z-10 shrink-0">
                     <div className="w-12 h-12 rounded-full glass flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300 bg-background">
                        {item.type === 'like' && <Heart size={18} className="text-red-500" />}
                        {item.type === 'follow' && <UserPlus size={18} className="text-blue-500" />}
                        {item.type === 'comment' && <MessageCircle size={18} className="text-green-500" />}
                        {item.type === 'star' && <Star size={18} className="text-yellow-500" />}
                     </div>
                     {/* User Avatar Mini Badge */}
                     <img src={item.avatar} className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-black" />
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 glass p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                     <p className="text-sm text-gray-200">
                        <span className="font-bold text-white hover:underline">{item.user}</span> {item.text}
                     </p>
                     <p className="text-xs text-muted-foreground mt-1 font-mono">{item.time}</p>
                  </div>
               </motion.div>
            ))}
            </AnimatePresence>
            
            {actualFiltered.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>No activity yet in this category.</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
}
