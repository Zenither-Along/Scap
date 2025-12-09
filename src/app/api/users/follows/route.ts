
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type'); // 'followers' or 'following'
    
    if (!userId || !type) {
      return NextResponse.json({ error: "User ID and type required" }, { status: 400 });
    }

    let query;
    if (type === 'followers') {
        // Get users who follow this user
        query = supabaseAdmin
            .from('follows')
            .select(`
                follower_id,
                user:users!follows_follower_id_fkey(id, username, full_name, avatar_url)
            `)
            .eq('following_id', userId);
    } else {
        // Get users this user follows
        query = supabaseAdmin
            .from('follows')
            .select(`
                following_id,
                user:users!follows_following_id_fkey(id, username, full_name, avatar_url)
            `)
            .eq('follower_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Map to simple user list
    const users = data.map((item: any) => item.user);

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Follows Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
