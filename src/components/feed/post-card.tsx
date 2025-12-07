"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Code, Play, Trash2, Flag, EyeOff, UserPlus, Edit, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";
import { LivePreview } from "./live-preview";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast"; // Assuming this exists, if not standard alert or remove

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
  created_at: string;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string; // Made optional to match usage if needed
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useUser();
  const isOwner = user?.id === post.user_id;
  
  // Default to code view if language doesn't support live preview
  const isPreviewSupported = !['python', 'sql', 'json'].includes((post.language || '').toLowerCase());
  const [viewMode, setViewMode] = useState<"code" | "preview">(isPreviewSupported ? "preview" : "code");

  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };


  const [showMenu, setShowMenu] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDelete = async () => {
     if (!confirm("Are you sure you want to delete this post?")) return;
     try {
       await fetch(`/api/posts?id=${post.id}`, { method: 'DELETE' });
       setIsDeleted(true);
     } catch (e) {
       alert("Failed to delete");
     }
  };

  if (isDeleted) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 relative group"
    >
      {/* Soft Glow Background */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 via-primary/5 to-purple-500/5 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative bg-black/20 backdrop-blur-xl rounded-[2rem] px-4 py-5 md:p-8 border border-white/5 shadow-xl ring-1 ring-white/5">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10" />
                <img
                  src={post.user.avatar_url || "/default-avatar.png"}
                  alt={post.user.username}
                  className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg"
                />
              </div>
              <div>
                 <h3 className="font-bold text-lg text-white/90">{post.user.full_name}</h3>
                 <p className="text-sm text-muted-foreground">@{post.user.username}</p>
              </div>
           </div>
           
           <div className="relative">
             <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-3 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-white"
             >
                <MoreHorizontal />
             </button>

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
                                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
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
                                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                    <Bookmark size={16} /> Save Post
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                    <Share2 size={16} /> Share
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                    <UserPlus size={16} /> Follow
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                    <EyeOff size={16} /> Hide Post
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                                    <Ban size={16} /> Block User
                                </button>
                                <div className="h-px bg-white/10 my-1" />
                                <button className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2">
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
               {post.content}
            </p>

           {/* Code / Interactive Area */}
           {post.code_snippet && (
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
                             <CodeBlock code={post.code_snippet} language={post.language || 'text'} />
                          </motion.div>
                       ) : (
                          <motion.div
                             key="preview"
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             exit={{ opacity: 0 }}
                             className="p-4"
                          >
                             <LivePreview code={post.code_snippet} language={post.language || 'tsx'} compiledCode={post.compiled_code} />
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
                       icon={<MessageCircle size={22} />} 
                       count={post.comments_count} 
                    />
                    <ActionBtn 
                       icon={<Share2 size={22} />} 
                    />
                </div>
                <ActionBtn icon={<Bookmark size={22} className={isSaved ? "fill-primary text-primary stroke-primary" : ""} />} onClick={() => setIsSaved(!isSaved)} />
           </div>
        </div>

      </div>
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
