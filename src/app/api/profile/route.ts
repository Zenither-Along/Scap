import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

// GET: Fetch any user's profile by username
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    // Fetch user profile
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get follower count
    const { count: followersCount } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id);

    // Get following count
    const { count: followingCount } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id);

    // Get posts count
    const { count: postsCount } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    // Check if current user is following this user
    const user = await currentUser();
    let isFollowing = false;
    let isOwnProfile = false;

    if (user) {
      isOwnProfile = user.id === profile.id;
      
      if (!isOwnProfile) {
        const { data: follow } = await supabaseAdmin
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .single();

        isFollowing = !!follow;
      }
    }

    return NextResponse.json({
      profile: {
        ...profile,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        posts_count: postsCount || 0,
        is_following: isFollowing,
        is_own_profile: isOwnProfile
      }
    });

  } catch (error: any) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bio, location, website } = body;

    // Validate inputs (basic)
    if (bio && bio.length > 500) {
        return NextResponse.json({ error: "Bio too long" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        bio, 
        location, 
        website, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase Update Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data }, { status: 200 });

  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

