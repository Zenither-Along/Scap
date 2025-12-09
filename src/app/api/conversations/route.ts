import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

// GET: List user's conversations with last message and other user info
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch conversations where user is either user1 or user2
    // AND user is NOT in the deleted_by_users array
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        updated_at,
        deleted_by_users,
        user1:users!conversations_user1_id_fkey(id, username, full_name, avatar_url),
        user2:users!conversations_user2_id_fkey(id, username, full_name, avatar_url)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Filter out deleted conversations manually since Supabase filter on array content can be tricky with OR conditions
    const visibleConversations = conversations.filter(conv => {
       const deletedBy = conv.deleted_by_users || [];
       return !deletedBy.includes(user.id);
    });

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      visibleConversations.map(async (conv) => {
        const { data: lastMessage } = await supabaseAdmin
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        // Determine the "other" user
        const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1;

        return {
          id: conv.id,
          user: otherUser,
          lastMessage: lastMessage?.content || null,
          lastMessageTime: lastMessage?.created_at || conv.updated_at,
          unreadCount: unreadCount || 0
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithLastMessage });

  } catch (error: any) {
    console.error("Conversations Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create or get existing conversation with another user
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
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    // Use the database function to get or create conversation
    const { data: conversationId, error } = await supabaseAdmin
      .rpc('get_or_create_conversation', {
        p_user1: user.id,
        p_user2: user_id
      });

    if (error) throw error;

    // Retrieve the conversation to check if it was deleted
    // If we are starting a chat, we should ensure it's visible to us
    // But typically initiating a chat doesn't auto-send a message, so we just show it.
    // If previous history exists and was deleted, we might want to un-delete it?
    // Let's rely on the Message POST to clear the deleted flag. 
    // Just opening the chat (POST conversation) shouldn't verify deletion status unless we want to "Search" hidden chats.
    // For now, let's just make sure we un-delete it for the current user so it shows up in their list
    
    // Fetch current deleted_by_users to see if we need to update
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('deleted_by_users')
      .eq('id', conversationId)
      .single();
      
    if (conv && conv.deleted_by_users && conv.deleted_by_users.includes(user.id)) {
        const newDeletedBy = conv.deleted_by_users.filter((id: string) => id !== user.id);
        await supabaseAdmin
            .from('conversations')
            .update({ deleted_by_users: newDeletedBy })
            .eq('id', conversationId);
    }

    return NextResponse.json({ conversation_id: conversationId });

  } catch (error: any) {
    console.error("Create Conversation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hide conversation for the current user (One-sided delete)
export async function DELETE(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    // Fetch current state
    const { data: conv, error: fetchError } = await supabaseAdmin
      .from('conversations')
      .select('deleted_by_users, user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (fetchError || !conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify user is part of conversation
    if (conv.user1_id !== user.id && conv.user2_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Add user to deleted_by_users if not already there
    const currentDeleted = conv.deleted_by_users || [];
    if (!currentDeleted.includes(user.id)) {
      const newDeleted = [...currentDeleted, user.id];
      const { error: updateError } = await supabaseAdmin
        .from('conversations')
        .update({ deleted_by_users: newDeleted })
        .eq('id', conversationId);
        
      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete Conversation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
