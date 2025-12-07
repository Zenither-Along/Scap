"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { MapPin, Link as LinkIcon, Calendar, Sparkles, Code, Zap, TrendingUp, Heart, Grid, List } from "lucide-react";
import { useState, useEffect } from "react";
import { Feed } from "@/components/feed/feed"; 
import { cn } from "@/lib/utils";
import { useSupabase } from "@/lib/supabase";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (user?.id) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (data) setProfileData(data);
      };
      fetchProfile();
    }
  }, [user?.id, supabase]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[200px]" 
        />
      </div>

      <div className="pb-20">
        
        {/* Hero Section - Glass Card Layout */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8">
          
          {/* Main Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 md:p-8 mb-6 overflow-hidden"
          >
            {/* Decorative Corner Gradients */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/30 to-transparent rounded-bl-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-tr-full pointer-events-none" />
            
            <div className="relative z-10">
              {/* Top Row: Avatar + Action */}
              <div className="flex justify-between items-start mb-6">
                
                {/* Avatar with Glow Ring */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-cyan-500 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-black bg-black overflow-hidden">
                    <img 
                      src={user.imageUrl} 
                      alt={user.fullName || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Online Status Indicator */}
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-black" />
                </div>

                {/* Edit Profile Button */}
                <button 
                   onClick={() => setIsEditOpen(true)}
                   className="px-5 py-2 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-all hover:scale-105 shadow-lg shadow-white/10"
                >
                   Edit Profile
                </button>
              </div>

              {/* User Info */}
              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 flex items-center gap-2">
                  {user.fullName}
                  <Sparkles size={24} className="text-primary" />
                </h1>
                <p className="text-neutral-400 text-lg">@{user.username || user.id.slice(0, 8)}</p>
              </div>

              {profileData?.bio && (
                <p className="text-lg text-gray-200 whitespace-pre-wrap leading-relaxed mb-6 max-w-2xl">
                  {profileData.bio}
                </p>
              )}

              {/* Metadata Pills */}
              <div className="flex flex-wrap gap-3 mb-6">
                {profileData?.location && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-neutral-300 border border-white/5">
                    <MapPin size={14} className="text-primary" /> {profileData.location}
                  </span>
                )}
                {profileData?.website && (
                  <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-primary border border-white/5 hover:bg-primary/10 transition-colors">
                    <LinkIcon size={14} /> {profileData.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <span className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-neutral-300 border border-white/5">
                  <Calendar size={14} className="text-primary" /> Joined {new Date(user.createdAt || Date.now()).getFullYear()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Bento Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-xl rounded-2xl p-5 border border-primary/20 group hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-primary" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Following</span>
              </div>
              <p className="text-3xl font-bold text-white">125</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/20 group hover:border-purple-500/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Heart size={18} className="text-purple-400" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Followers</span>
              </div>
              <p className="text-3xl font-bold text-white">240</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 backdrop-blur-xl rounded-2xl p-5 border border-cyan-500/20 group hover:border-cyan-500/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Code size={18} className="text-cyan-400" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Snippets</span>
              </div>
              <p className="text-3xl font-bold text-white">47</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 backdrop-blur-xl rounded-2xl p-5 border border-orange-500/20 group hover:border-orange-500/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-orange-400" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Contributions</span>
              </div>
              <p className="text-3xl font-bold text-white">1.2K</p>
            </motion.div>
          </div>

          {/* Tabs - Pill Style */}
          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 mb-6 w-fit">
            {["posts", "media", "likes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                    "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    activeTab === tab 
                      ? "bg-white text-black shadow-lg" 
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                 {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
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
      {user && (
        <EditProfileDialog 
            isOpen={isEditOpen} 
            onClose={() => setIsEditOpen(false)} 
            initialData={profileData || {}} 
            onSave={(updated) => setProfileData(updated)}
        />
      )}
    </div>
  );
}
