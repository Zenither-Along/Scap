"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { MapPin, Link as LinkIcon, Calendar } from "lucide-react";
import { useState } from "react";
import { Feed } from "@/components/feed/feed"; // Re-using Feed for now, eventually filter by user
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("posts");

  if (!isLoaded || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Cover Image (Placeholder) */}
      <div className="h-48 md:h-64 bg-linear-to-r from-primary/20 to-purple-900/40 relative">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
        {/* Profile Header */}
        <div className="-mt-16 sm:-mt-24 mb-6 flex flex-col sm:flex-row items-end sm:items-end gap-6">
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={user.imageUrl}
            alt={user.fullName || ""}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-background bg-background object-cover shadow-xl"
          />
          
          <div className="flex-1 pb-2 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">{user.fullName}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>

          <div className="pb-4 w-full sm:w-auto flex justify-center sm:justify-start gap-3">
             <button className="btn btn-primary px-6 py-2 rounded-full font-medium bg-primary text-white hover:bg-primary/90 transition-colors">
               Follow
             </button>
             <button className="px-6 py-2 rounded-full font-medium border border-border hover:bg-secondary transition-colors">
               Message
             </button>
          </div>
        </div>

        {/* Bio & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <p className="text-lg leading-relaxed">
              Digital artist & UI Designer. Passionate about glassmorphism and neon aesthetics. 
              Creating the next generation of social experiences.
            </p>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                <LinkIcon size={16} />
                <span>scap.social</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Joined December 2025</span>
              </div>
            </div>
          </div>

          <div className="flex justify-around md:justify-start md:gap-8 p-4 rounded-2xl bg-secondary/30 border border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold">1.2k</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">843</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">128</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Posts</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          {["posts", "media", "likes"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 md:flex-none md:w-32 py-4 text-sm font-medium transition-colors relative",
                activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabProfile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {activeTab === "posts" && <Feed />}
          {activeTab === "media" && (
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="aspect-square bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          )}
          {activeTab === "likes" && (
             <div className="text-center py-10 text-muted-foreground">No liked posts yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
