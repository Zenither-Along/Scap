import { supabaseAdmin } from "@/lib/supabase-admin";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");
    const userId = searchParams.get("user_id");
    
    if (!postId && !userId) {
        return NextResponse.json({ error: "Post ID or User ID required" }, { status: 400 });
    }

    let query = supabaseAdmin
        .from("comments")
        .select(`
            id,
            post_id,
            user_id,
            content,
            created_at,
            user:users (
                username,
                full_name,
                avatar_url
            ),
            post:posts (
                id,
                content,
                user:users (
                    username
                )
            )
        `);

    if (postId) {
        query = query.eq("post_id", postId).order("created_at", { ascending: true });
    } else if (userId) {
        query = query.eq("user_id", userId).order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error("Fetch Comments Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments: data });
}

export async function POST(request: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { post_id, content } = body;

        if (!post_id || !content) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("comments")
            .insert({
                post_id,
                user_id: user.id,
                content,
            })
            .select(`
                *,
                user:users (
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            console.error("Create Comment Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Comment API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get("id");
        
        if (!commentId) {
            return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
        }

        // Check ownership
        const { data: comment } = await supabaseAdmin
            .from("comments")
            .select("user_id")
            .eq("id", commentId)
            .single();

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // Allow deletion if user owns the comment OR if user owns the post (moderation)
        // For now, let's just check comment ownership as per standard.
        // If we want post owner to delete comments, we'd need to fetch post.user_id too.
        if (comment.user_id !== user.id) {
             return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { error } = await supabaseAdmin
            .from("comments")
            .delete()
            .eq("id", commentId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
