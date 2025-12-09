import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (user_id === user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const { data: existingFollow } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', user_id)
      .single();

    if (existingFollow) {
      // Unfollow
      const { error } = await supabaseAdmin
        .from('follows')
        .delete()
        .eq('id', existingFollow.id);

      if (error) throw error;
      return NextResponse.json({ following: false });
    } else {
      // Follow
      const { error } = await supabaseAdmin
        .from('follows')
        .insert({ follower_id: user.id, following_id: user_id });

      if (error) throw error;
      return NextResponse.json({ following: true });
    }

  } catch (error: any) {
    console.error("Follow Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
