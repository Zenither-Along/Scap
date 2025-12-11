import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch notifications + actor details
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select(`
        *,
        actor:users!notifications_actor_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
        console.error("Fetch Notifications Error:", error);
        throw error;
    }

    return NextResponse.json({ notifications });

  } catch (error: any) {
    console.error("Activity API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
