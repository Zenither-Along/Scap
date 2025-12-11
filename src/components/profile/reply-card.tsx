"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ReplyCardProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    post: {
      id: string;
      content: string;
      user: {
        username: string;
      };
    };
  };
}

export function ReplyCard({ comment }: ReplyCardProps) {
  if (!comment.post) return null; // Handle deleted posts

  return (
    <div className="border-b border-white/10 py-4 px-4 hover:bg-white/5 transition-colors cursor-pointer block">
       <Link href={`/post/${comment.post.id}?openComments=true&commentId=${comment.id}`}>
          <div className="flex flex-col gap-1">
             <span className="text-neutral-500 text-sm">
                Replying to <span className="text-blue-400">@{comment.post.user?.username}</span>
             </span>
             <p className="text-white text-base mt-1">{comment.content}</p>
             <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/5 text-sm text-neutral-400 line-clamp-2">
                {comment.post.content}
             </div>
             <span className="text-neutral-600 text-xs mt-2">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
             </span>
          </div>
       </Link>
    </div>
  );
}
