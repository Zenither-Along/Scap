"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Link as LinkIcon, Calendar, MessageCircle, UserPlus, UserMinus, ArrowLeft, Grid, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { PostCard, type Post } from "@/components/feed/post-card";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  website?: string;
  is_verified: boolean;
  created_at: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
  is_own_profile: boolean;
}

import { FollowsDialog } from "@/components/profile/follows-dialog";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  // Follows Dialog State
  const [showFollowsDialog, setShowFollowsDialog] = useState(false);
  const [followsTab, setFollowsTab] = useState<"followers" | "following">("followers");

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/profile?username=${username}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setProfile(data.profile);
      setIsFollowing(data.profile.is_following);
      
      // Redirect to own profile page if viewing own profile
      if (data.profile.is_own_profile) {
        router.push('/profile');
        return;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [username, router]);

  const fetchUserPosts = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const res = await fetch(`/api/posts?user_id=${profile.id}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error(error);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile?.id) {
      fetchUserPosts();
    }
  }, [profile?.id, fetchUserPosts]);

  const handleFollow = async () => {
    if (!profile || followLoading) return;
    
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      const res = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile.id })
      });

      if (!res.ok) {
        setIsFollowing(wasFollowing);
      } else {
        // Update follower count
        setProfile(prev => prev ? {
          ...prev,
          followers_count: wasFollowing ? prev.followers_count - 1 : prev.followers_count + 1
        } : null);
      }
    } catch {
      setIsFollowing(wasFollowing);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!profile) return;

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile.id })
      });

      if (res.ok) {
        router.push('/messages');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Helper to open follows dialog
  const openFollows = (tab: "followers" | "following") => {
      setFollowsTab(tab);
      setShowFollowsDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-black text-white">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50 md:static p-4">
        <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
            <ArrowLeft size={20} />
            <span className="hidden md:inline">Back</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-20 md:pt-0 pb-8">
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Avatar + Mobile Identity Group */}
            <div className="flex items-center md:items-start gap-4 w-full md:w-auto">
                {/* Avatar */}
                <div className="shrink-0">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-neutral-800 overflow-hidden border border-neutral-800">
                        <img 
                            src={profile.avatar_url || '/default-avatar.png'} 
                            alt={profile.full_name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Mobile Identity */}
                <div className="md:hidden flex-1 min-w-0">
                    <h1 className="text-2xl font-bold truncate">{profile.full_name}</h1>
                    <p className="text-neutral-500">@{profile.username}</p>
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 w-full">
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-2xl font-bold truncate">{profile.full_name}</h1>
                        <p className="text-neutral-500">@{profile.username}</p>
                    </div>

                    {/* Action Buttons (Desktop) */}
                    <div className="flex gap-3 shrink-0">
                        <button
                            onClick={handleMessage}
                            className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-neutral-700 text-sm font-medium hover:bg-neutral-800 transition-colors"
                        >
                            <MessageCircle size={16} />
                            Message
                        </button>
                        <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all min-w-[100px]",
                                isFollowing 
                                    ? "border border-neutral-700 hover:border-red-500/50 hover:text-red-400" 
                                    : "bg-white text-black hover:bg-neutral-200"
                            )}
                        >
                            {isFollowing ? "Following" : "Follow"}
                        </button>
                    </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="md:hidden flex gap-3 mb-6">
                    <button
                        onClick={handleMessage}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-neutral-700 text-sm font-medium hover:bg-neutral-800 transition-colors"
                    >
                        <MessageCircle size={16} />
                        Message
                    </button>
                    <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all min-w-[100px]",
                            isFollowing 
                                ? "border border-neutral-700 hover:border-red-500/50 hover:text-red-400" 
                                : "bg-white text-black hover:bg-neutral-200"
                        )}
                    >
                        {isFollowing ? "Following" : "Follow"}
                    </button>
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="text-neutral-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                        {profile.bio}
                    </p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 mb-6">
                    {profile.location && (
                        <span className="flex items-center gap-1.5">
                            <MapPin size={14} /> {profile.location}
                        </span>
                    )}
                    {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:underline">
                            <LinkIcon size={14} /> {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                    <span className="flex items-center gap-1.5">
                        <Calendar size={14} /> Joined {new Date(profile.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                    </span>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-sm">
                    <button onClick={() => openFollows('following')} className="flex gap-1 hover:opacity-80 transition-opacity">
                        <span className="font-bold text-white">{profile.following_count}</span>
                        <span className="text-neutral-500">Following</span>
                    </button>
                    <button onClick={() => openFollows('followers')} className="flex gap-1 hover:opacity-80 transition-opacity">
                        <span className="font-bold text-white">{profile.followers_count}</span>
                        <span className="text-neutral-500">Followers</span>
                    </button>
                    <div className="flex gap-1">
                        <span className="font-bold text-white">{profile.posts_count}</span>
                        <span className="text-neutral-500">Posts</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Dialog for Followers/Following */}
        {profile && (
            <FollowsDialog
                isOpen={showFollowsDialog}
                onClose={() => setShowFollowsDialog(false)}
                userId={profile.id}
                initialTab={followsTab}
            />
        )}

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 mt-10 mb-6">
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

        {/* Content */}
        <div className="min-h-[200px]">
            {activeTab === "posts" && (
                posts.length === 0 ? (
                    <div className="text-center py-12 text-neutral-600">
                        <Grid size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No posts yet</p>
                    </div>
                ) : (
                    <div>
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )
            )}

             {activeTab === "media" && (
                 <div className="grid grid-cols-3 gap-1">
                    {[1,2,3].map((i) => (
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

      </div>
    </div>
  );
}
