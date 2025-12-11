"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface ReplyItemProps {
  reply: {
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
  };
  postOwnerId: string;
  onDelete?: (replyId: string) => void;
}

export function ReplyItem({ reply, postOwnerId, onDelete }: ReplyItemProps) {
  const { user } = useUser();
  const isOwner = user?.id === reply.user_id;
  const isPostOwner = user?.id === postOwnerId;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this reply?")) return;
    
    try {
      const res = await fetch(`/api/comments?id=${reply.id}`, { method: 'DELETE' });
      if (res.ok && onDelete) {
        onDelete(reply.id);
      }
    } catch (error) {
      console.error("Failed to delete reply:", error);
    }
  };

  return (
    <div className="flex gap-3 py-4 px-4 border-b border-white/5 hover:bg-white/2 transition-colors group">
      {/* Avatar */}
      <Link href={`/user/${reply.user.username}`} className="shrink-0">
        <img 
          src={reply.user.avatar_url || '/default-avatar.png'} 
          alt={reply.user.full_name}
          className="w-10 h-10 rounded-full object-cover border border-white/10"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/user/${reply.user.username}`} className="font-semibold text-white hover:underline truncate">
            {reply.user.full_name}
          </Link>
          <span className="text-neutral-500 text-sm truncate">@{reply.user.username}</span>
          <span className="text-neutral-600 text-sm">·</span>
          <span className="text-neutral-500 text-sm shrink-0">
            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
          </span>
        </div>
        
        <p className="text-neutral-200 text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word">
          {reply.content}
        </p>
      </div>

      {/* Delete Button (for owner or post owner) */}
      {(isOwner || isPostOwner) && (
        <button 
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
