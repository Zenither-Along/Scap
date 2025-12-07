import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

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
