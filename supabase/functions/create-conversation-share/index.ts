import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  conversationId: z.string().uuid(),
  expiresInDays: z.number().min(1).max(90).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { conversationId, expiresInDays } = validation.data;

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabaseClient
      .from('quickbooks_conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation || conversation.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if share already exists
    const { data: existingShare } = await supabaseClient
      .from('shared_conversations')
      .select('share_token')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingShare) {
      return new Response(
        JSON.stringify({ 
          shareToken: existingShare.share_token,
          shareUrl: `${req.headers.get('origin')}/shared/${existingShare.share_token}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new share
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: share, error: shareError } = await supabaseClient
      .from('shared_conversations')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        expires_at: expiresAt
      })
      .select('share_token')
      .single();

    if (shareError) {
      console.error('[CREATE-SHARE] Error:', shareError);
      return new Response(
        JSON.stringify({ error: 'Unable to create share link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        shareToken: share.share_token,
        shareUrl: `${req.headers.get('origin')}/shared/${share.share_token}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CREATE-SHARE] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred creating the share link' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});