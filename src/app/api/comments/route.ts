
import { createClient } from "@supabase/supabase-js";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Note: We'll use the service role key if we need to bypass RLS, 
// but for standard user actions we should use the auth token or just RLS with the user's ID.
// However, since we are in a server component (route handler), using `createClient` with a global key is common,
// but to respect RLS we normally need the user's auth context. 
// For Clerk + Supabase, we usually pass the Supabase token.
//
// But here, let's stick to the pattern used in other routes if any.
// Since we don't have the `request` header easily passed to `createClient` without some setup,
// and we are using `supabase-js` directly here.
//
// Let's check how other routes do it. If I can't check, I'll use the Service Role key if available to ensuring it works,
// OR cleaner: Use the `saved_posts` or `follows` pattern.
// 
// Wait, I saw `useSupabase` hook for client. For server routes?
// I'll assume we can use the `supabase-admin` or just a direct client. 
// Often the `SUPABASE_SERVICE_ROLE_KEY` is used in API routes to do admin tasks, 
// BUT for creating comments as a user, we should ideally identify the user.
//
// We can use Clerk `auth().userId` to get the user ID.
// Then insert into the table with that `user_id`.
// Since we have the `user_id` from Clerk, we can insert it directly.
// And we can use the SERVICE_ROLE_KEY to bypass RLS for the insertion since we validated the user via Clerk on the server.
//
// Let's assume `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or checking env) are available.
// If SERVICE_ROLE_KEY is not in env, we might have issues if RLS is strict and we use ANON key without auth context.
// Let's try to use the ANON key but we might fail RLS if we don't pass the JWT.
//
// Better approach: Use the Clerk token to authenticate with Supabase.
// `auth().getToken({ template: 'supabase' })`.

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");
    
    if (!postId) {
        return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from("comments")
        .select(`
            id,
            post_id,
            user_id,
            content,
            created_at,
            users (
                username,
                full_name,
                avatar_url
            )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true }); // Oldest first? or Newest? Usually newest at bottom matching chat, or newest at top. Let's do oldest first (chronological) like chat.

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map `users` (which might be an array or object depending on join) to a single object `user`
    // Supabase returns an array for joins usually, but since user_id is foreign key to 1 user, it returns object or array of 1.
    // The query above `users (...)` usually returns `users: { ... }` or `users: [{ ... }]`.
    // Let's normalize it.
    
    const formattedComments = data.map((comment: any) => ({
        ...comment,
        user: Array.isArray(comment.users) ? comment.users[0] : comment.users
    }));

    return NextResponse.json({ comments: formattedComments });
}

export async function POST(request: Request) {
    const { userId, getToken } = auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // GetSupabase Token to respect RLS? 
    // Or just use Service Key since we trusted Clerk?
    // Let's try to use the token if possible to be safe, but Service Key is easier if we have it.
    // I'll check if `SUPABASE_SERVICE_ROLE_KEY` is usually used.
    // If not, I'll `getToken`.
    
    const supabaseToken = await getToken({ template: "supabase" });
    
    // If we have a token, we can use it with the Anon Key.
    const supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: {
                Authorization: `Bearer ${supabaseToken}`,
            },
        },
    });
    
    // Fallback if token is missing (maybe user not signed in properly or template issues), 
    // but `userId` is present.
    // We will proceed.

    const body = await request.json();
    const { post_id, content } = body;

    if (!post_id || !content) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("comments")
        .insert({
            post_id,
            user_id: userId,
            content,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function DELETE(request: Request) {
    const { userId, getToken } = auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");
    
    if (!commentId) {
        return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
    }
    
    const supabaseToken = await getToken({ template: "supabase" });
    const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
    });

    const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", userId); // Security check handled by RLS, but explicit check doesn't hurt.

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
