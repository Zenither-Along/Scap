"use client";

import { useUser } from "@clerk/nextjs";
import { MapPin, Link as LinkIcon, Calendar, Edit2, Grid, Heart, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Feed } from "@/components/feed/feed"; 
import { cn } from "@/lib/utils";
import { useSupabase } from "@/lib/supabase";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { FollowsDialog } from "@/components/profile/follows-dialog";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  
  // Follows Dialog State
  const [showFollowsDialog, setShowFollowsDialog] = useState(false);
  const [followsTab, setFollowsTab] = useState<"followers" | "following">("followers");
  
  // Real Stats State
  const [stats, setStats] = useState({
    following: 0,
    followers: 0,
    posts: 0
  });

  useEffect(() => {
    if (user?.id) {
      const fetchProfile = async () => {
        // Fetch user data
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (data) setProfileData(data);
        
        // Fetch stats
        try {
            const res = await fetch(`/api/profile?username=${user.username}`);
            if (res.ok) {
                const data = await res.json();
                setStats({
                    following: data.profile.following_count,
                    followers: data.profile.followers_count,
                    posts: data.profile.posts_count
                });
            }
        } catch (e) {
            console.error(e);
        }
      };
      fetchProfile();
    }
  }, [user?.id, supabase, user?.username]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Helper to open follows dialog
  const openFollows = (tab: "followers" | "following") => {
      setFollowsTab(tab);
      setShowFollowsDialog(true);
  };

  return (
    <div className="min-h-screen pb-20 bg-black text-white">
        
        {/* Header Section */}
        <div className="max-w-2xl mx-auto px-4 pt-12 md:pt-16 pb-8">
            
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Avatar + Mobile Identity Group */}
              <div className="flex items-center md:items-start gap-4 w-full md:w-auto">
                {/* Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-neutral-800 overflow-hidden border border-neutral-800">
                    <img 
                      src={user.imageUrl} 
                      alt={user.fullName || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Mobile Identity */}
                <div className="md:hidden flex-1 min-w-0">
                    <h1 className="text-2xl font-bold truncate">{user.fullName}</h1>
                    <p className="text-neutral-500">@{user.username || user.id.slice(0, 8)}</p>
                </div>
              </div>

              {/* User Details */}
              <div className="flex-1 min-w-0 w-full">
                  {/* Desktop Header */}
                  <div className="hidden md:flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold truncate pr-4">{user.fullName}</h1>
                    <button 
                       onClick={() => setIsEditOpen(true)}
                       className="px-4 py-1.5 rounded-full border border-neutral-700 text-sm font-medium hover:bg-neutral-800 transition-colors"
                    >
                       Edit Profile
                    </button>
                  </div>
                  <p className="hidden md:block text-neutral-500 mb-4">@{user.username || user.id.slice(0, 8)}</p>

                  {/* Mobile Edit Button */}
                  <div className="md:hidden mb-6">
                    <button 
                       onClick={() => setIsEditOpen(true)}
                       className="w-full px-4 py-1.5 rounded-full border border-neutral-700 text-sm font-medium hover:bg-neutral-800 transition-colors"
                    >
                       Edit Profile
                    </button>
                  </div>

                  {profileData?.bio && (
                    <p className="text-neutral-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                      {profileData.bio}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 mb-6">
                     {profileData?.location && (
                       <span className="flex items-center gap-1.5">
                         <MapPin size={14} /> {profileData.location}
                       </span>
                     )}
                     {profileData?.website && (
                       <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:underline">
                         <LinkIcon size={14} /> {profileData.website.replace(/^https?:\/\//, '')}
                       </a>
                     )}
                     <span className="flex items-center gap-1.5">
                       <Calendar size={14} /> Joined {new Date(user.createdAt || Date.now()).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                     </span>
                  </div>

                  {/* Simple Stats Row */}
                  <div className="flex gap-6 text-sm">
                    <button onClick={() => openFollows('following')} className="flex gap-1 hover:opacity-80 transition-opacity">
                      <span className="font-bold text-white">{stats.following}</span>
                      <span className="text-neutral-500">Following</span>
                    </button>
                    <button onClick={() => openFollows('followers')} className="flex gap-1 hover:opacity-80 transition-opacity">
                      <span className="font-bold text-white">{stats.followers}</span>
                      <span className="text-neutral-500">Followers</span>
                    </button>
                  </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-800 mt-10">
              {["posts", "media", "likes"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                      "flex-1 md:flex-none md:w-32 py-3 text-sm font-medium relative transition-colors",
                      activeTab === tab 
                        ? "text-white" 
                        : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
                   {activeTab === tab && (
                     <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                   )}
                </button>
              ))}
            </div>

        </div>

        {/* Content Section */}
        <div className="max-w-2xl mx-auto px-4 min-h-[400px]"> 
            {activeTab === "posts" && (
                <Feed />
            )}
            
            {activeTab === "media" && (
                 <div className="grid grid-cols-3 gap-1">
                    {[1,2,3,4,5,6].map((i) => (
                       <div key={i} className="aspect-square bg-neutral-900 cursor-pointer relative overflow-hidden group">
                            <img src={`https://picsum.photos/500?random=${i}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                    ))}
                 </div>
            )}

            {activeTab === "likes" && (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-600">
                    <Heart size={48} className="mb-4 stroke-1 opacity-20" />
                    <p>No liked posts yet</p>
                </div>
            )}
        </div>

      {user && (
        <>
            <EditProfileDialog 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                initialData={profileData || {}} 
                onSave={(updated) => setProfileData(updated)}
            />
            <FollowsDialog
                isOpen={showFollowsDialog}
                onClose={() => setShowFollowsDialog(false)}
                userId={user.id}
                initialTab={followsTab}
            />
        </>
      )}
    </div>
  );
}
