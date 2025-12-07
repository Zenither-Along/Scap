"use client";

import { useEffect, useState, useCallback } from "react";
import { PostCard, type Post } from "./post-card";
import { Heart } from "lucide-react";
import { useSupabase } from "@/lib/supabase";
import { CreatePost } from "./create-post";

export function Feed() {
  const supabase = useSupabase();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?limit=20');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data.posts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass h-64 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-0 md:px-6">
      {/* Mobile Header - Unique Glass Strip */}
      <div className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between mb-4 border-b border-white/5">
        <h1 className="text-xl font-bold text-white tracking-tight">Scap</h1>
        
        <a href="/activity" className="p-2 relative bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <Heart size={20} className="text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse" />
        </a>
      </div>

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
