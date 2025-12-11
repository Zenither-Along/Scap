"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PostCard, Post } from "@/components/feed/post-card";
import { ReplyItem } from "@/components/post/reply-item";
import { ReplyInput } from "@/components/post/reply-input";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  user: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export default function PostPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const highlightCommentId = searchParams.get('commentId');
  const replyRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts?id=${id}`);
      if (!res.ok) throw new Error("Post not found");
      
      const data = await res.json();
      if (data.posts && data.posts.length > 0) {
        setPost(data.posts[0]);
      } else {
        setError("Post not found");
      }
    } catch (err) {
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReplies = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/comments?post_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to fetch replies:", err);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchReplies();
    }
  }, [id, fetchPost, fetchReplies]);

  // Scroll to highlighted reply
  useEffect(() => {
    if (highlightCommentId && replies.length > 0) {
      setTimeout(() => {
        const el = replyRefs.current[highlightCommentId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-blue-500/10');
          setTimeout(() => el.classList.remove('bg-blue-500/10'), 2000);
        }
      }, 300);
    }
  }, [highlightCommentId, replies]);

  const handleReplySubmit = (newReply: Reply) => {
    setReplies(prev => [...prev, newReply]);
    // Update post comments count locally
    if (post) {
      setPost({ ...post, comments_count: post.comments_count + 1 });
    }
  };

  const handleReplyDelete = (replyId: string) => {
    setReplies(prev => prev.filter(r => r.id !== replyId));
    if (post) {
      setPost({ ...post, comments_count: Math.max(0, post.comments_count - 1) });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground">
        <p className="mb-4 text-lg">{error || "Post not found"}</p>
        <Link href="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white hover:text-neutral-300 transition-colors"
        >
          <ArrowLeft size={20} /> Post
        </Link>
      </div>
      
      {/* Main Post */}
      <div className="max-w-2xl mx-auto">
        <PostCard post={post} />
        
        {/* Reply Input */}
        <ReplyInput postId={post.id} onReplySubmit={handleReplySubmit} />
        
        {/* Replies Section */}
        <div className="border-t border-white/5">
          {replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <MessageCircle size={40} className="mb-3 opacity-30" />
              <p>No replies yet. Be the first!</p>
            </div>
          ) : (
            <div>
              {replies.map((reply) => (
                <div 
                  key={reply.id} 
                  ref={(el) => { replyRefs.current[reply.id] = el; }}
                  className="transition-colors duration-500"
                >
                  <ReplyItem 
                    reply={reply} 
                    postOwnerId={post.user_id} 
                    onDelete={handleReplyDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
