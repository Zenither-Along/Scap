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
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    // Check if already blocked
    const { data: existingBlock } = await supabaseAdmin
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', user_id)
      .single();

    if (existingBlock) {
      // Unblock
      const { error } = await supabaseAdmin
        .from('blocked_users')
        .delete()
        .eq('id', existingBlock.id);

      if (error) throw error;
      return NextResponse.json({ blocked: false });
    } else {
      // Block
      const { error } = await supabaseAdmin
        .from('blocked_users')
        .insert({ blocker_id: user.id, blocked_id: user_id });

      if (error) throw error;
      return NextResponse.json({ blocked: true });
    }

  } catch (error: any) {
    console.error("Block Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
