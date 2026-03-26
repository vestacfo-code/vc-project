// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  text: z.string().min(1).max(4096), // OpenAI TTS limit
  voice: z.enum(['onyx', 'echo', 'nova', 'alloy', 'fable', 'shimmer']).optional()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Get user settings for voice preference
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    let voicePreference = 'onyx'; // default

    if (user) {
      const { data: settings } = await supabaseClient
        .from('user_settings')
        .select('voice')
        .eq('user_id', user.id)
        .single();

      if (settings?.voice) {
        // Map user-friendly voice names to OpenAI voice names
        const voiceMap: Record<string, string> = {
          'spruce': 'onyx',
          'oak': 'echo',
          'birch': 'nova',
        };
        voicePreference = voiceMap[settings.voice] || 'onyx';
      }
    }

    const body = await req.json();
    const { text, voice } = requestSchema.parse(body);

    // Use provided voice or user preference
    const selectedVoice = voice || voicePreference;

    console.log('🔊 Processing text-to-speech request with voice:', selectedVoice);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: selectedVoice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI TTS API error:', response.status, errorData);
      throw new Error(`TTS API error: ${response.status}`);
    }

    // Convert audio buffer to base64 safely
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 in chunks to avoid stack overflow
    let base64Audio = '';
    const chunkSize = 0x8000; // 32KB chunks
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      base64Audio += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
    }

    console.log('✅ Text-to-speech completed, audio length:', base64Audio.length);

    return new Response(JSON.stringify({ 
      audioContent: base64Audio,
      format: 'mp3'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Text-to-speech function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate speech',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});