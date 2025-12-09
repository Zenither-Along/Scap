import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { post_id } = await req.json();

    if (!post_id) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    // Check if already liked
    const { data: existingLike } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', post_id)
      .single();

    if (existingLike) {
      // Unlike - remove the like
      const { error } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      return NextResponse.json({ liked: false });
    } else {
      // Like - add new like
      const { error } = await supabaseAdmin
        .from('likes')
        .insert({ user_id: user.id, post_id });

      if (error) throw error;
      return NextResponse.json({ liked: true });
    }

  } catch (error: any) {
    console.error("Like Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
