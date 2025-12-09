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
      return NextResponse.json({ error: "Cannot mute yourself" }, { status: 400 });
    }

    // Check if already muted
    const { data: existingMute } = await supabaseAdmin
      .from('muted_users')
      .select('id')
      .eq('muter_id', user.id)
      .eq('muted_id', user_id)
      .single();

    if (existingMute) {
      // Unmute
      const { error } = await supabaseAdmin
        .from('muted_users')
        .delete()
        .eq('id', existingMute.id);

      if (error) throw error;
      return NextResponse.json({ muted: false });
    } else {
      // Mute
      const { error } = await supabaseAdmin
        .from('muted_users')
        .insert({ muter_id: user.id, muted_id: user_id });

      if (error) throw error;
      return NextResponse.json({ muted: true });
    }

  } catch (error: any) {
    console.error("Mute Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
