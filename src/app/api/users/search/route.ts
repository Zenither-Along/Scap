import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

// GET: Search for users by username or full name
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    // Search by username or full_name (case-insensitive)
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, full_name, avatar_url, bio, is_verified')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq('id', user.id) // Exclude current user
      .limit(limit);

    if (error) throw error;

    // Get follow status for each user
    const usersWithFollowStatus = await Promise.all(
      users.map(async (u) => {
        const { data: follow } = await supabaseAdmin
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', u.id)
          .single();

        return {
          ...u,
          is_following: !!follow
        };
      })
    );

    return NextResponse.json({ users: usersWithFollowStatus });

  } catch (error: any) {
    console.error("User Search Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
