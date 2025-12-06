"use client";

import { useEffect, useState } from "react";
import { PostCard, type Post } from "./post-card";
import { useSupabase } from "@/lib/supabase";

export function Feed() {
  const supabase = useSupabase();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for initial UI dev until DB is populated
    const MOCK_POSTS: Post[] = [
      {
        id: "1",
        user: {
          username: "design_guru",
          full_name: "Alex Designer",
          avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
        },
        content: "Exploring the depth of glassmorphism in modern UI design. It's not just about blur, it's about hierarchy and depth. 🎨✨ #design #uiux",
        media_urls: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"],
        media_type: "image",
        likes_count: 124,
        comments_count: 18,
        is_liked: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        user: {
          username: "tech_enthusiast",
          full_name: "Sarah Tech",
          avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        },
        content: "Just shipped the new feature! Performance improved by 40%. 🚀",
        media_urls: [],
        media_type: "none",
        likes_count: 89,
        comments_count: 12,
        is_liked: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "3",
        user: {
          username: "react_lover",
          full_name: "Jordan Walke Fan",
          avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
        },
        content: "Here is a cool little hook I wrote for handling local storage safely in Next.js 14. #react #hooks",
        code_snippet: `export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });
  // ... rest of implementation
}`,
        language: 'typescript',
        media_urls: [],
        media_type: "none",
        likes_count: 245,
        comments_count: 42,
        is_liked: true,
        created_at: new Date().toISOString(),
      },
    ];

    setPosts(MOCK_POSTS);
    setLoading(false);

    // TODO: Fetch real posts from Supabase once table is populated
    // const fetchPosts = async () => { ... }
  }, [supabase]);

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
    <div className="max-w-2xl mx-auto py-6 px-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
