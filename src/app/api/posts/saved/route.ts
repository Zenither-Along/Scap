import { supabaseAdmin } from "@/lib/supabase-admin";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch saved posts with full post data
    const { data, error } = await supabaseAdmin
      .from("saved_posts")
      .select(`
        post_id,
        created_at,
        post:posts (
          *,
          user:users (id, username, full_name, avatar_url),
          likes (user_id)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch Saved Posts Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to return posts with is_liked and is_saved flags
    const posts = data
      ?.filter((item: any) => item.post) // Filter out any null posts (deleted)
      .map((item: any) => ({
        ...item.post,
        is_liked: item.post.likes?.some((like: any) => like.user_id === user.id) || false,
        is_saved: true, // All these are saved
        likes_count: item.post.likes?.length || 0,
      })) || [];

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error("Saved Posts API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
