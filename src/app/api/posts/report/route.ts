import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { post_id, reason } = await req.json();

    if (!post_id) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    // Check if already reported by this user
    const { data: existingReport } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('post_id', post_id)
      .single();

    if (existingReport) {
      return NextResponse.json({ error: "Already reported", reported: true }, { status: 400 });
    }

    // Create report
    const { error } = await supabaseAdmin
      .from('reports')
      .insert({ 
        reporter_id: user.id, 
        post_id,
        reason: reason || null
      });

    if (error) throw error;
    return NextResponse.json({ reported: true });

  } catch (error: any) {
    console.error("Report Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
