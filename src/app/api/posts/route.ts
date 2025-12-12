import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import { transform } from 'sucrase';

// Pre-compile React/JSX code for instant preview in feed
function preCompileCode(code: string): string | null {
  if (!code) return null;
  try {
    let wrappedCode = code;
    if (code.includes('<') && code.includes('>')) {
      if (!code.includes('function') && !code.includes('const') && !code.includes('class')) {
        wrappedCode = `render(${code});`;
      } else if (code.includes('export default')) {
        wrappedCode = code.replace(/export\s+default\s+/, '') + '\nrender(<App />);';
      } else {
        const componentMatch = code.match(/(?:function|const)\s+(\w+)/);
        if (componentMatch) {
          wrappedCode = code + `\nrender(<${componentMatch[1]} />);`;
        }
      }
    }
    const result = transform(wrappedCode, { transforms: ["jsx", "typescript"], jsxRuntime: "classic" });
    return result.code;
  } catch {
    return null; // Store null if compilation fails - client will show error
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('user_id');
    const searchQuery = searchParams.get('q');
    const postId = searchParams.get('id');
    
    // Get current user for feed logic
    const user = await currentUser();
    const currentUserId = user?.id;

    let posts;
    let error;

    // SCENARIO 1: Search, Single Post, or Profile View - Use standard query
    if (userId || searchQuery || postId) {
        let query = supabaseAdmin
        .from('posts')
        .select(`
            *,
            user:users(id, username, full_name, avatar_url),
            likes(user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

        if (postId) {
            query = query.eq('id', postId);
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (searchQuery) {
            query = query.ilike('content', `%${searchQuery}%`);
        }
        
        const result = await query;
        posts = result.data;
        error = result.error;

    } 
    // SCENARIO 2: Main Feed - Use Hybrid Algorithm
    else if (currentUserId) {
        // Use the RPC to get sorted IDs/Records, then join Relation Data
        // Note: RPC returns 'setof posts', so we can chain .select()!
        const result = await supabaseAdmin
            .rpc('get_hybrid_feed', { 
                p_user_id: currentUserId, 
                p_limit: limit, 
                p_offset: 0 
            })
            .select(`
                *,
                user:users(id, username, full_name, avatar_url),
                likes(user_id)
            `);
            
        posts = result.data;
        error = result.error;
    } 
    // SCENARIO 3: Public Feed (No Auth) - Standard fallback
    else {
        const result = await supabaseAdmin
            .from('posts')
            .select(`
                *,
                user:users(id, username, full_name, avatar_url),
                likes(user_id)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
            
        posts = result.data;
        error = result.error;
    }

    if (error) {
        console.error("Supabase Fetch Error:", error);
        throw error;
    }

    const formattedPosts = (posts || []).map((post: any) => ({
        ...post,
        likes_count: post.likes ? post.likes.length : 0,
        is_liked: currentUserId ? post.likes.some((like: any) => like.user_id === currentUserId) : false,
        likes: undefined
    }));

    return NextResponse.json({ posts: formattedPosts });

  } catch (error: any) {
    console.error("Feed Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!");
        return NextResponse.json({ error: "Server Configuration Error: Missing Service Role Key" }, { status: 500 });
    }

    const body = await req.json();
    const { content, media_urls, media_type, code_snippet, language } = body;

    if (!content && !media_urls?.length && !code_snippet) {
        return NextResponse.json({ error: "Post cannot be empty" }, { status: 400 });
    }

    // Pre-compile code for instant preview
    const compiled_code = code_snippet ? preCompileCode(code_snippet) : null;

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        media_urls: media_urls || [],
        media_type: media_type || 'none',
        code_snippet,
        language,
        compiled_code
      })
      .select(`
        *,
        user:users(id, username, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data });

  } catch (error: any) {
    console.error("Create Post Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    // Verify ownership before deletion
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete Post Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Edit an existing post
export async function PATCH(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    const body = await req.json();
    const { content, code_snippet, language } = body;

    if (!content && !code_snippet) {
      return NextResponse.json({ error: "Content or code snippet required" }, { status: 400 });
    }

    // Verify ownership before updating
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Pre-compile code if provided
    const compiled_code = code_snippet ? preCompileCode(code_snippet) : null;

    // Update the post
    const { data: updatedPost, error: updateError } = await supabaseAdmin
      .from('posts')
      .update({
        content,
        code_snippet,
        language,
        compiled_code
      })
      .eq('id', postId)
      .select(`
        *,
        user:users(id, username, full_name, avatar_url),
        likes(user_id)
      `)
      .single();

    if (updateError) throw updateError;

    // Format response similar to GET
    const formattedPost = {
      ...updatedPost,
      is_liked: updatedPost.likes?.some((like: any) => like.user_id === user.id) || false,
      likes_count: updatedPost.likes?.length || 0,
    };

    return NextResponse.json({ post: formattedPost });

  } catch (error: any) {
    console.error("Update Post Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
