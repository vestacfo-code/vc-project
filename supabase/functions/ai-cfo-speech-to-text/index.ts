// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  audio: z.string().min(1).max(10000000) // Max ~10MB base64 audio
});

// Map user settings to Whisper language codes
const languageMap: Record<string, string> = {
  'auto': '', // Empty means auto-detect
  'en': 'en',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'it': 'it',
  'pt': 'pt',
  'zh': 'zh',
  'ja': 'ja',
  'ko': 'ko',
};

serve(sentryServe("ai-cfo-speech-to-text", async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Get user authentication
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    
    // Get user's spoken language preference
    let userLanguage = 'auto';
    if (user) {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('spoken_language')
        .eq('user_id', user.id)
        .single();
      
      if (settings?.spoken_language) {
        userLanguage = settings.spoken_language;
      }
    }

    const body = await req.json();
    const { audio } = requestSchema.parse(body);

    console.log('🎤 Processing speech-to-text request...');

    // Convert base64 audio to binary
    const audioBuffer = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    
    // Create form data for OpenAI Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    
    // Add language parameter if user has a specific preference
    const whisperLanguage = languageMap[userLanguage] || '';
    if (whisperLanguage) {
      formData.append('language', whisperLanguage);
    }
    
    formData.append('response_format', 'json');
    
    console.log(`🌐 Using language setting: ${userLanguage} (Whisper: ${whisperLanguage || 'auto-detect'})`);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI Whisper API error:', response.status, errorData);
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Speech-to-text completed:', data.text);

    return new Response(JSON.stringify({ 
      text: data.text || '',
      confidence: data.confidence || 1.0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Speech-to-text function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process speech',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});