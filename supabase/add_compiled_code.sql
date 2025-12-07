-- Add compiled_code column to posts table for pre-compiled React components
-- This enables instant preview in the feed (no client-side transpilation needed)

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS compiled_code TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.posts.compiled_code IS 'Pre-compiled JavaScript from code_snippet for instant preview';
