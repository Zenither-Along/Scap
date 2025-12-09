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

    // Check if already saved
    const { data: existingSave } = await supabaseAdmin
      .from('saved_posts')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', post_id)
      .single();

    if (existingSave) {
      // Unsave - remove the save
      const { error } = await supabaseAdmin
        .from('saved_posts')
        .delete()
        .eq('id', existingSave.id);

      if (error) throw error;
      return NextResponse.json({ saved: false });
    } else {
      // Save - add new save
      const { error } = await supabaseAdmin
        .from('saved_posts')
        .insert({ user_id: user.id, post_id });

      if (error) throw error;
      return NextResponse.json({ saved: true });
    }

  } catch (error: any) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
