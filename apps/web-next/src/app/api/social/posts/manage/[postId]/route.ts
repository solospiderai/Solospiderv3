import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ postId: string }>;
}

const UpdatePostSchema = z.object({
  caption: z.string().optional(),
  image_url: z.string().url().optional().nullable(),
  scheduled_at: z.string().optional().nullable(),
  status: z.enum(["draft", "scheduled"]).optional(),
});

/**
 * PATCH /api/social/posts/manage/[postId]
 * Update a post — edit caption, reschedule, or change status (draft↔scheduled).
 * Only allows updates for posts in "draft" or "scheduled" status.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const parsed = UpdatePostSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const adminClient = getSupabaseAdminClient();

    // Fetch the post to verify ownership and current status
    const { data: post, error: fetchError } = await adminClient
      .from("social_posts")
      .select("id, project_id, status")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify the user owns the project
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", post.project_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Not authorized to modify this post" }, { status: 403 });
    }

    // Only allow editing draft or scheduled posts
    if (!["draft", "scheduled"].includes(post.status)) {
      return NextResponse.json(
        { error: `Cannot edit a post with status "${post.status}". Only draft or scheduled posts can be modified.` },
        { status: 400 }
      );
    }

    // Build the update payload
    const updatePayload: Record<string, unknown> = {};

    if (parsed.data.caption !== undefined) {
      updatePayload.caption = parsed.data.caption;
    }
    if (parsed.data.image_url !== undefined) {
      updatePayload.image_url = parsed.data.image_url;
    }
    if (parsed.data.scheduled_at !== undefined) {
      updatePayload.scheduled_at = parsed.data.scheduled_at;
      // Auto-set status based on whether a schedule time is provided
      if (parsed.data.scheduled_at) {
        updatePayload.status = "scheduled";
      } else {
        updatePayload.status = "draft";
      }
    }
    if (parsed.data.status !== undefined) {
      updatePayload.status = parsed.data.status;
      // If switching to draft, clear the schedule
      if (parsed.data.status === "draft") {
        updatePayload.scheduled_at = null;
      }
    }

    const { data: updatedPost, error: updateError } = await adminClient
      .from("social_posts")
      .update(updatePayload)
      .eq("id", postId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, post: updatedPost });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/posts/manage/[postId]
 * Cancel/delete a post. Only works for draft or scheduled posts.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  try {
    const adminClient = getSupabaseAdminClient();

    // Fetch the post
    const { data: post, error: fetchError } = await adminClient
      .from("social_posts")
      .select("id, project_id, status")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", post.project_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Not authorized to delete this post" }, { status: 403 });
    }

    // Only allow deleting draft or scheduled posts
    if (!["draft", "scheduled"].includes(post.status)) {
      return NextResponse.json(
        { error: `Cannot delete a post with status "${post.status}". Only draft or scheduled posts can be deleted.` },
        { status: 400 }
      );
    }

    const { error: deleteError } = await adminClient
      .from("social_posts")
      .delete()
      .eq("id", postId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true, deleted: postId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
