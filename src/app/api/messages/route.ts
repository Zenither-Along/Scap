import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

// GET: Fetch messages for a conversation
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversation_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    // Verify user is part of this conversation
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (!conversation || (conversation.user1_id !== user.id && conversation.user2_id !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch messages (excluding deleted ones)
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        is_read,
        is_deleted,
        edited_at,
        created_at,
        replied_to_message_id,
        replied_to:replied_to_message_id (
          id,
          content,
          sender_id
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Mark messages as read
    await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({ messages });

  } catch (error: any) {
    console.error("Messages Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Send a new message
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversation_id, content, replied_to_message_id } = await req.json();

    if (!conversation_id || !content?.trim()) {
      return NextResponse.json({ error: "Conversation ID and content required" }, { status: 400 });
    }

    // Verify user is part of this conversation
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversation_id)
      .single();

    if (!conversation || (conversation.user1_id !== user.id && conversation.user2_id !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert message
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id,
        sender_id: user.id,
        content: content.trim(),
        ...(replied_to_message_id && { replied_to_message_id })
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation's updated_at and ensure it is visible to everyone (clear deleted_by_users)
    await supabaseAdmin
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        deleted_by_users: [] 
      })
      .eq('id', conversation_id);

    return NextResponse.json({ message });

  } catch (error: any) {
    console.error("Send Message Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Edit a message
export async function PATCH(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message_id, content } = await req.json();

    if (!message_id || !content?.trim()) {
      return NextResponse.json({ error: "Message ID and content required" }, { status: 400 });
    }

    // Verify message ownership
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('sender_id')
      .eq('id', message_id)
      .single();

    if (!message || message.sender_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update message
    const { data: updated, error } = await supabaseAdmin
      .from('messages')
      .update({ 
        content: content.trim(),
        edited_at: new Date().toISOString()
      })
      .eq('id', message_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: updated });

  } catch (error: any) {
    console.error("Edit Message Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Soft delete a message
export async function DELETE(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 });
    }

    // Verify message ownership
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (!message || message.sender_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete Message Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
