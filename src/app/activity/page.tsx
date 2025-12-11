"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, UserPlus, MessageCircle, Zap, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'mention';
  created_at: string;
  read: boolean;
  actor: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  entity_id?: string;
  metadata?: {
    comment_id?: string;
  };
}

export default function ActivityPage() {
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/activity');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const filteredNotifications = notifications.filter(item => {
    if (filter === "all") return true;
    if (filter === "likes") return item.type === "like";
    if (filter === "replies") return item.type === "comment" || item.type === "mention";
    if (filter === "follows") return item.type === "follow";
    return true;
  });

  const getNotificationText = (type: string) => {
    switch (type) {
      case 'like': return "liked your post";
      case 'follow': return "started following you";
      case 'comment': return "replied to your post";
      case 'mention': return "mentioned you in a reply";
      default: return "interacted with you";
    }
  };

  const getLinkHref = (item: Notification) => {
      if (item.type === 'follow') {
        return `/user/${item.actor.username}`;
      }
      if (item.type === 'comment' || item.type === 'mention') {
         // Deep link to reply if metadata exists
         const commentId = item.metadata?.comment_id;
         if (commentId) {
             return `/post/${item.entity_id}?commentId=${commentId}`;
         }
         return `/post/${item.entity_id}`;
      }
      return `/post/${item.entity_id}`;
  };

  return (
    <div className="min-h-screen pb-20 pt-8 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 pl-4 border-l-4 border-primary">Activity</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 select-none no-scrollbar">
          {["all", "likes", "replies", "follows"].map(tab => (
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
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                {filteredNotifications.map((item) => (
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
                            {item.type === 'mention' && <Zap size={18} className="text-yellow-500" />}
                        </div>
                        {/* User Avatar Mini Badge */}
                        <img 
                            src={item.actor.avatar_url || '/default-avatar.png'} 
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-black object-cover bg-neutral-800" 
                        />
                    </div>

                    {/* Content Card */}
                    <Link href={getLinkHref(item)} className="flex-1 block">
                        <div className="glass p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                            <p className="text-sm text-gray-200">
                                <span className="font-bold text-white hover:underline mr-1">{item.actor.full_name || item.actor.username}</span> 
                                {getNotificationText(item.type)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </Link>
                </motion.div>
                ))}
                </AnimatePresence>
            )}
            
            {!loading && filteredNotifications.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>No activity yet in this category.</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
}
