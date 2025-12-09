import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

// POST: Toggle reaction on a message
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message_id, reaction } = await req.json();

    if (!message_id || !reaction) {
      return NextResponse.json({ error: "Message ID and reaction required" }, { status: 400 });
    }

    // Validate reaction is one of the allowed emojis
    const allowedReactions = ['❤️', '👍', '😂', '😮', '😢', '🔥'];
    if (!allowedReactions.includes(reaction)) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }

    // Check if user already reacted with this emoji
    const { data: existingReaction } = await supabaseAdmin
      .from('message_reactions')
      .select('id')
      .eq('message_id', message_id)
      .eq('user_id', user.id)
      .eq('reaction', reaction)
      .single();

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabaseAdmin
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) throw error;
      return NextResponse.json({ action: 'removed', reaction });
    } else {
      // Add reaction
      const { error } = await supabaseAdmin
        .from('message_reactions')
        .insert({
          message_id,
          user_id: user.id,
          reaction
        });

      if (error) throw error;
      return NextResponse.json({ action: 'added', reaction });
    }

  } catch (error: any) {
    console.error("Reaction Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Fetch reactions for messages
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageIds = searchParams.get('message_ids')?.split(',');

    if (!messageIds || messageIds.length === 0) {
      return NextResponse.json({ error: "Message IDs required" }, { status: 400 });
    }

    const { data: reactions, error } = await supabaseAdmin
      .from('message_reactions')
      .select('message_id, reaction, user_id')
      .in('message_id', messageIds);

    if (error) throw error;

    // Group reactions by message_id
    const grouped = reactions.reduce((acc: any, r) => {
      if (!acc[r.message_id]) acc[r.message_id] = [];
      acc[r.message_id].push({ reaction: r.reaction, user_id: r.user_id });
      return acc;
    }, {});

    return NextResponse.json({ reactions: grouped });

  } catch (error: any) {
    console.error("Get Reactions Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
