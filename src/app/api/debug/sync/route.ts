import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    
    // Construct user object matching the webhook logic
    const userData = {
      id: user.id,
      email: email,
      username: user.username || `user_${user.id.slice(0, 8)}`,
      full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      avatar_url: user.imageUrl,
      is_verified: false,
      updated_at: new Date().toISOString(),
    };

    console.log("Force Syncing User:", userData);

    const { data, error } = await supabaseAdmin.from('users').upsert(userData).select();

    if (error) {
      console.error("Supabase Sync Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data }, { status: 200 });

  } catch (error: any) {
    console.error("Sync Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
