"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Highlight, themes } from "prism-react-renderer";

export interface Post {
  id: string;
  user: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  content: string;
  code_snippet?: string;
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
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const copyCode = () => {
    if (post.code_snippet) {
      navigator.clipboard.writeText(post.code_snippet);
      // Optional: Show toast
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl overflow-hidden mb-6 border border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <img
            src={post.user.avatar_url || "/default-avatar.png"}
            alt={post.user.username}
            className="w-10 h-10 rounded-full object-cover border border-border"
          />
          <div>
            <h3 className="font-semibold text-sm hover:underline cursor-pointer">
              {post.user.full_name}
            </h3>
            <p className="text-xs text-muted-foreground">@{post.user.username}</p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <p className="whitespace-pre-wrap text-sm md:text-base mb-3 leading-relaxed">
          {post.content}
        </p>

        {post.code_snippet && (
           <div className="rounded-lg overflow-hidden my-3 text-sm border border-border/50 shadow-2xl relative group">
              <div className="bg-[#1e1e1e] px-4 py-2 flex items-center justify-between border-b border-border/10">
                 <span className="text-xs text-muted-foreground font-mono">{post.language || 'text'}</span>
                 <button 
                  onClick={copyCode}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
                 >
                   <Copy size={12} /> Copy
                 </button>
              </div>
              <Highlight
                theme={themes.vsDark}
                code={post.code_snippet}
                language={post.language || 'tsx'}
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre style={{ ...style, margin: 0, padding: '1.5rem', borderRadius: 0, fontSize: '0.9rem', lineHeight: '1.5', overflowX: 'auto' }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
           </div>
        )}
      </div>

      {/* Media */}
      {post.media_type === "image" && post.media_urls.length > 0 && (
        <div className="relative w-full aspect-square md:aspect-video bg-secondary/30">
          <img
            src={post.media_urls[0]}
            alt="Post content"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className="group flex items-center gap-2 focus:outline-none"
          >
            <motion.div
              whileTap={{ scale: 0.8 }}
              animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart
                size={24}
                className={cn(
                  "transition-colors duration-300",
                  isLiked
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground group-hover:text-red-500"
                )}
              />
            </motion.div>
            <span className="text-sm font-medium text-muted-foreground">
              {likesCount}
            </span>
          </button>

          <button className="group flex items-center gap-2 focus:outline-none">
            <MessageCircle
              size={24}
              className="text-muted-foreground group-hover:text-primary transition-colors"
            />
            <span className="text-sm font-medium text-muted-foreground">
              {post.comments_count}
            </span>
          </button>

          <button className="group focus:outline-none">
            <Share2
              size={24}
              className="text-muted-foreground group-hover:text-primary transition-colors"
            />
          </button>
        </div>

        <button
          onClick={() => setIsSaved(!isSaved)}
          className="focus:outline-none"
        >
          <motion.div whileTap={{ scale: 0.8 }}>
            <Bookmark
              size={24}
              className={cn(
                "transition-colors duration-300",
                isSaved
                  ? "fill-primary text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            />
          </motion.div>
        </button>
      </div>
    </motion.article>
  );
}
