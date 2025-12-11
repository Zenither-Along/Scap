"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Send, Loader2 } from "lucide-react";

interface ReplyInputProps {
  postId: string;
  onReplySubmit: (reply: any) => void;
}

export function ReplyInput({ postId, onReplySubmit }: ReplyInputProps) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content: content.trim() })
      });

      if (res.ok) {
        const newReply = await res.json();
        onReplySubmit(newReply);
        setContent("");
      }
    } catch (error) {
      console.error("Failed to submit reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="px-4 py-3 border-b border-white/10 text-center text-neutral-500 text-sm">
        <a href="/sign-in" className="text-blue-400 hover:underline">Sign in</a> to reply
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3 px-4 py-3 border-b border-white/10 bg-black/50">
      <img 
        src={user.imageUrl} 
        alt={user.fullName || ""} 
        className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
      />
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Post your reply"
          className="w-full bg-transparent text-white placeholder-neutral-500 resize-none outline-none text-[15px] leading-relaxed min-h-[60px]"
          rows={2}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-colors"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Reply
          </button>
        </div>
      </div>
    </form>
  );
}
