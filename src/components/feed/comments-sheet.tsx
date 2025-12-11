"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Trash2, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postOwnerId: string;
}

export function CommentsSheet({ isOpen, onClose, postId, postOwnerId }: CommentsSheetProps) {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Responsive check: md breakpoint is usually 768px
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/comments?post_id=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (e) {
      console.error("Failed to fetch comments", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content: newComment }),
      });

      if (res.ok) {
        await fetchComments(); 
        setNewComment("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if(!confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Sheet Container */}
          <motion.div
            initial={isDesktop ? { x: "100%" } : { y: "100%" }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: "100%" } : { y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-[101] bg-[#121212] border-white/10 shadow-2xl flex flex-col overflow-hidden
              ${isDesktop 
                ? "top-0 right-0 h-full w-[400px] border-l" 
                : "bottom-0 left-0 w-full h-[85vh] rounded-t-2xl border-t"
              }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#121212]">
              <h2 className="text-lg font-bold text-white">Comments</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 group">
                    <Link href={`/user/${comment.user.username}`} className="shrink-0">
                      <img
                        src={comment.user.avatar_url || "/default-avatar.png"}
                        alt={comment.user.username}
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                         <div className="flex flex-col">
                            <Link href={`/user/${comment.user.username}`} className="font-semibold text-sm hover:underline text-white">
                                {comment.user.full_name}
                            </Link>
                            <span className="text-xs text-muted-foreground">@{comment.user.username} • {new Date(comment.created_at).toLocaleDateString()}</span>
                         </div>
                         {(user?.id === comment.user_id || user?.id === postOwnerId) && (
                             <button 
                                onClick={() => handleDelete(comment.id)} 
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded text-red-400 transition-all"
                                title="Delete comment"
                             >
                                 <Trash2 size={14} />
                             </button>
                         )}
                      </div>
                      <p className="text-sm text-gray-300 mt-1 wrap-break-word whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-[#121212] pb-8 md:pb-4">
              <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <img 
                    src={user?.imageUrl || "/default-avatar.png"} 
                    className="w-8 h-8 rounded-full object-cover mb-1" 
                    alt="Current user" 
                />
                <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white placeholder:text-gray-500 pr-12"
                      autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmitting}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
