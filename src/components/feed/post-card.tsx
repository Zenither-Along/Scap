"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, CornerUpLeft, Share2, Bookmark, MoreHorizontal, Code, Play, Trash2, Flag, EyeOff, UserPlus, UserMinus, Edit, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";
import { LivePreview } from "./live-preview";
import { useUser } from "@clerk/nextjs";
import { EditPostDialog } from "./edit-post-dialog";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

export interface Post {
  id: string;
  user_id: string;
  user: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  content: string;
  code_snippet?: string;
  compiled_code?: string;
  language?: string;
  media_urls: string[];
  media_type: "image" | "video" | "none";
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved?: boolean;
  created_at: string;
}

  interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onHide?: (postId: string) => void;
}

export function PostCard({ post, onHide }: PostCardProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const isOwner = user?.id === post.user_id;
  
  // Default to code view if language doesn't support live preview
  const isPreviewSupported = !['python', 'sql', 'json'].includes((post.language || '').toLowerCase());
  const [viewMode, setViewMode] = useState<"code" | "preview">(isPreviewSupported ? "preview" : "code");

  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasCheckedFollow, setHasCheckedFollow] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  // If props change (e.g. navigation back to page), ensure state updates
  // But usually initial state is enough. However, if we deep link again...
  // Let's stick to initial state for now.
  
  const handleLike = async () => {
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    
    try {
      const res = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id })
      });
      
      if (!res.ok) {
        // Revert on error
        setIsLiked(isLiked);
        setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
      }
    } catch {
      // Revert on error
      setIsLiked(isLiked);
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
    }
  };

  const handleSave = async () => {
    setIsSaved(!isSaved);
    
    try {
      const res = await fetch('/api/posts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id })
      });
      
      if (!res.ok) setIsSaved(isSaved);
    } catch {
      setIsSaved(isSaved);
    }
  };

  const handleDelete = async () => {
    const confirmed = await useConfirm()({
      title: "Delete Post",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      confirmText: "Delete",
      isDanger: true,
    });
    
    if (!confirmed) return;
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/posts?id=${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        setIsDeleted(true);
      } else {
        toast.error("Failed to delete post");
      }
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleHide = async () => {
    try {
      const res = await fetch('/api/posts/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id })
      });
      
      if (res.ok) {
        setIsHidden(true);
        onHide?.(post.id);
      }
    } catch {
      toast.error("Failed to hide post");
    } finally {
      setShowMenu(false);
    }
  };

  const checkFollowStatus = async () => {
      if (hasCheckedFollow || isOwner) return;
      try {
           // We check if "I" follow "them". The API route for 'follows' list is expensive for just check.
           // However, let's use the 'follows' check from profile route logic which passed `is_following`.
           // Since we don't have it on `post`, we might leave it as optimistic "Follow" -> "Following" 
           // BUT the user asked for "properly let the follow option work like when already following it will be unfollow".
           // This implies we need to know. 
           // For now, let's just assume "Follow" until clicked, OR assume the backend toggle tells us the new state.
           // Wait, the backend route returns `{ following: boolean }`.
           // So we can just use that to update state after click.
           // But initial state? If we don't know, maybe text "Follow/Unfollow"?
           // Better: Add a quick check.
           // Actually, `checkFollowStatus` is too heavy to run on every post mount.
           // Let's run it only when opening the menu?
           const res = await fetch(`/api/profile?username=${post.user.username}`);
           if (res.ok) {
               const data = await res.json();
               setIsFollowing(data.profile.is_following);
               setHasCheckedFollow(true);
           }
      } catch (e) { console.error(e); }
  };

  const handleFollow = async () => {
    try {
      const res = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: post.user_id })
      });
      
      if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.following);
          toast.success(data.following ? "Following user!" : "Unfollowed user!");
      }
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setShowMenu(false);
    }
  };

  const handleBlock = async () => {
    const confirmed = await useConfirm()({
      title: "Block User",
      message: `Block @${post.user.username}? You won't see their posts anymore.`,
      confirmText: "Block",
      isDanger: true,
    });
    
    if (!confirmed) return;
    
    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: post.user_id })
      });
      
      if (res.ok) {
        setIsHidden(true);
        onHide?.(post.id);
        toast.success("User blocked");
      }
    } catch {
      toast.error("Failed to block user");
    } finally {
      setShowMenu(false);
    }
  };

  const handleMute = async () => {
    try {
      await fetch('/api/users/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: post.user_id })
      });
      toast.success("User muted");
    } catch {
      toast.error("Failed to mute user");
    } finally {
      setShowMenu(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt("Why are you reporting this post? (optional)");
    
    try {
      const res = await fetch('/api/posts/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, reason })
      });
      
      if (res.ok) {
        toast.success("Post reported. Thank you for helping keep our community safe.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to report post");
      }
    } catch {
      toast.error("Failed to report post");
    } finally {
      setShowMenu(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
    setShowMenu(false);
  };

  const handleEdit = () => {
    setShowEditDialog(true);
    setShowMenu(false);
  };

  const handleEditSuccess = (updatedPost: any) => {
    setCurrentPost(updatedPost);
  };

  if (isDeleted || isHidden) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div className="px-4 py-5 md:px-0 md:py-6 border-b border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
           <Link href={`/user/${post.user.username}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="relative">
                <img
                  src={post.user.avatar_url || "/default-avatar.png"}
                  alt={post.user.username}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
              </div>
              <div>
                 <h3 className="font-bold text-lg text-white/90">{post.user.full_name}</h3>
                 <p className="text-sm text-muted-foreground">@{post.user.username}</p>
              </div>
           </Link>
           
           <div className="relative">
             <button 
                onClick={() => {
                    setShowMenu(!showMenu);
                    if (!showMenu) checkFollowStatus();
                }}
                className="p-3 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-white relative z-50"
             >
                <MoreHorizontal />
             </button>

             {showMenu && (
                 <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
             )}

             <AnimatePresence>
                {showMenu && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        {isOwner ? (
                             <div className="flex flex-col">
                                <button onClick={handleEdit} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                    <Edit size={16} /> Edit Post
                                </button>
                                <button
                                   onClick={handleDelete}
                                   className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-white/5 flex items-center gap-2"
                                >
                                   <Trash2 size={16} /> Delete Post
                                </button>
                             </div>
                        ) : (
                            <div className="flex flex-col">
                                <button onClick={handleSave} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                    <Bookmark size={16} /> {isSaved ? 'Unsave Post' : 'Save Post'}
                                </button>
                                <button onClick={handleShare} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                    <Share2 size={16} /> Share
                                </button>
                                <button onClick={handleFollow} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                    {isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />} 
                                    {isFollowing ? "Unfollow" : "Follow"}
                                </button>
                                
                                {!pathname?.includes('/user/') && !pathname?.includes('/profile') && (
                                    <button onClick={handleHide} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                        <EyeOff size={16} /> Hide Post
                                    </button>
                                )}
                                
                                <button onClick={handleBlock} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                    <Ban size={16} /> Block User
                                </button>
                                <div className="h-px bg-white/10 my-1" />
                                <button onClick={handleReport} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2">
                                    <Flag size={16} /> Report
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
             </AnimatePresence>
           </div>
        </div>

        {/* Content - Full Width */}
        <div className="w-full">
            <p className="text-base leading-relaxed text-gray-200 mb-6 font-light">
               {currentPost.content}
            </p>

           {/* Code / Interactive Area */}
           {currentPost.code_snippet && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-[#080808]">
                 {/* Toggle Switcher Header */}
                 <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                    <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
                        {isPreviewSupported ? (
                           <>
                              <button 
                                 onClick={() => setViewMode("preview")}
                                 className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", viewMode === "preview" ? "bg-green-500 text-white shadow-lg" : "text-muted-foreground hover:text-white")}
                              >
                                 <Play size={14} /> Live
                              </button>
                              <button 
                                 onClick={() => setViewMode("code")}
                                 className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", viewMode === "code" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white")}
                              >
                                 <Code size={14} /> Code
                              </button>
                           </>
                        ) : (
                           <div className="px-4 py-1.5 rounded-lg text-sm font-bold text-muted-foreground flex items-center gap-2">
                              {/* Show language name or generic 'Code' */}
                              <Code size={14} /> {post.language ? post.language.toUpperCase() : 'CODE'} Snippet
                           </div>
                        )}
                    </div>
                 </div>

                 <div className="relative">
                    <AnimatePresence mode="wait">
                       {viewMode === "code" ? (
                          <motion.div
                             key="code"
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             exit={{ opacity: 0 }}
                          >
                             <CodeBlock code={currentPost.code_snippet} language={currentPost.language || 'text'} />
                          </motion.div>
                       ) : (
                          <motion.div
                             key="preview"
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             exit={{ opacity: 0 }}
                             className="p-4"
                          >
                             <LivePreview code={currentPost.code_snippet} language={currentPost.language || 'tsx'} compiledCode={currentPost.compiled_code} />
                          </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
              </div>
           )}

           {/* Image Media */}
           {post.media_type === "image" && post.media_urls.length > 0 && (
              <div className="rounded-3xl overflow-hidden mb-6 border border-white/5 shadow-lg relative group-image cursor-zoom-in">
                 <img
                   src={post.media_urls[0]}
                   alt="Post content"
                   className="w-full h-auto max-h-[600px] object-cover transition-transform duration-700 hover:scale-105"
                 />
              </div>
           )}

           {/* Actions */}
           <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                <div className="flex gap-8">
                    <ActionBtn 
                       icon={<Heart size={22} className={isLiked ? "fill-red-500 text-red-500 stroke-red-500" : ""} />} 
                       count={likesCount} 
                       active={isLiked}
                       color="text-red-500"
                       onClick={handleLike}
                    />
                    <ActionBtn 
                       icon={<CornerUpLeft size={22} />} 
                       count={post.comments_count} 
                       onClick={() => router.push(`/post/${post.id}`)}
                    />
                    <ActionBtn 
                       icon={<Share2 size={22} />}
                       onClick={handleShare}
                    />
                </div>
                <ActionBtn 
                   icon={<Bookmark size={22} className={isSaved ? "fill-white text-white" : ""} />}
                   onClick={handleSave}
                   active={isSaved}
                />
           </div>
        </div>

      </div>

      <EditPostDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        post={currentPost}
        onSuccess={handleEditSuccess}
      />
    </motion.article>
  );
}

function ActionBtn({ icon, count, onClick, active, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn("flex items-center gap-3 transition-colors group", active ? color : "text-muted-foreground hover:text-white")}
    >
      <div className={cn("p-2 rounded-full group-hover:bg-white/5 transition-colors")}>
        {icon}
      </div>
      {count !== undefined && <span className="font-medium text-sm">{count}</span>}
    </button>
  );
}
