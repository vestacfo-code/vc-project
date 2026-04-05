import { sentryServe } from "../_shared/sentry-edge.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  token: z.string().uuid({ message: "Invalid token format" }),
});

Deno.serve(sentryServe("validate-share-token", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { token } = validation.data;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Use the security definer function to validate the token
    const { data: isValid, error: rpcError } = await supabaseAdmin.rpc('can_access_shared_conversation', {
      p_token: token
    });

    if (rpcError || !isValid) {
      console.error('[VALIDATE-SHARE] Token validation failed');
      return new Response(
        JSON.stringify({ error: 'Share link not found or expired' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get share details using admin client
    const { data: share, error: shareError } = await supabaseAdmin
      .from('shared_conversations')
      .select('conversation_id, expires_at')
      .eq('share_token', token)
      .single();

    if (shareError || !share) {
      console.error('[VALIDATE-SHARE] Failed to fetch share details');
      return new Response(
        JSON.stringify({ error: 'Unable to access conversation' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('quickbooks_conversations')
      .select('title')
      .eq('id', share.conversation_id)
      .single();

    // Get messages
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('quickbooks_messages')
      .select('*')
      .eq('conversation_id', share.conversation_id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[VALIDATE-SHARE] Failed to fetch messages');
      return new Response(
        JSON.stringify({ error: 'Unable to load conversation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        conversation: {
          title: conversation?.title || 'Shared Conversation',
          messages: messages || []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[VALIDATE-SHARE] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while loading the conversation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}));
