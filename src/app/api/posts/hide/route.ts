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

    // Check if already hidden
    const { data: existingHide } = await supabaseAdmin
      .from('hidden_posts')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', post_id)
      .single();

    if (existingHide) {
      // Unhide
      const { error } = await supabaseAdmin
        .from('hidden_posts')
        .delete()
        .eq('id', existingHide.id);

      if (error) throw error;
      return NextResponse.json({ hidden: false });
    } else {
      // Hide
      const { error } = await supabaseAdmin
        .from('hidden_posts')
        .insert({ user_id: user.id, post_id });

      if (error) throw error;
      return NextResponse.json({ hidden: true });
    }

  } catch (error: any) {
    console.error("Hide Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
