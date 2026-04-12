import { sentryServe } from "../_shared/sentry-edge.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(ip: string, maxRequests = 15, windowMs = 60000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userRequests = rateLimiter.get(ip) || [];
  const recentRequests = userRequests.filter((time) => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    const oldestRequest = Math.min(...recentRequests);
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return { allowed: true };
}

Deno.serve(sentryServe("wave-oauth", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const rateLimit = checkRateLimit(clientIp);
  
  if (!rateLimit.allowed) {
    console.log('[WAVE-OAUTH] Rate limit exceeded for IP:', clientIp);
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': rateLimit.retryAfter?.toString() || '60' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const waveClientId = Deno.env.get('WAVE_CLIENT_ID');
    const waveClientSecret = Deno.env.get('WAVE_CLIENT_SECRET');

    if (!waveClientId || !waveClientSecret) {
      throw new Error('Wave credentials not configured');
    }

    const url = new URL(req.url);

    // POST: Generate auth URL
    if (req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No authorization header' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const redirectUri = `${supabaseUrl}/functions/v1/wave-oauth`;
      const state = user.id;
      
      // Wave uses GraphQL API with simpler scope requirements
      const authUrl = `https://api.waveapps.com/oauth2/authorize/?` +
        `client_id=${waveClientId}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=user:read%20business:read` +
        `&state=${state}`;

      console.log('Generated Wave auth URL for user:', user.id);

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET: OAuth callback
    if (req.method === 'GET') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        const errorDescription = url.searchParams.get('error_description') || error;
        console.error('Wave OAuth error:', error, 'Description:', errorDescription);
        const safeHtml = errorDescription.replace(/[&<>"']/g, (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
        const safeJson = JSON.stringify(errorDescription);
        return new Response(
          `<html><body><h2>Authorization Failed</h2><p>${safeHtml}</p><script>window.opener.postMessage({ type: 'WAVE_AUTH_ERROR', error: ${safeJson} }, '*'); setTimeout(() => window.close(), 3000);</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }

      if (!code || !state) {
        throw new Error('Missing code or state parameter');
      }

      const userId = state;
      const redirectUri = `${supabaseUrl}/functions/v1/wave-oauth`;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://api.waveapps.com/oauth2/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: waveClientId,
          client_secret: waveClientSecret,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Wave token exchange failed:', errorText);
        throw new Error('Token exchange failed');
      }

      const tokens = await tokenResponse.json();
      const { access_token, refresh_token, expires_in } = tokens;

      // Fetch business info using GraphQL
      const businessQuery = `
        query {
          user {
            businesses(page: 1, pageSize: 1) {
              edges {
                node {
                  id
                  name
                  currency {
                    code
                  }
                }
              }
            }
          }
        }
      `;

      const businessResponse = await fetch('https://gql.waveapps.com/graphql/public', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: businessQuery }),
      });

      if (!businessResponse.ok) {
        throw new Error('Failed to fetch Wave business info');
      }

      const businessData = await businessResponse.json();
      const business = businessData?.data?.user?.businesses?.edges?.[0]?.node;

      if (!business) {
        throw new Error('No Wave business found for this account');
      }

      const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

      // Store integration
      const { error: dbError } = await supabase
        .from('wave_integrations')
        .upsert({
          user_id: userId,
          business_id: business.id,
          business_name: business.name,
          access_token: access_token,
          refresh_token: refresh_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          currency: business.currency?.code,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,business_id'
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Wave integration stored successfully for user:', userId);

      return new Response(
        `<html><body><script>window.opener.postMessage({ type: 'WAVE_AUTH_SUCCESS' }, '*'); window.close();</script></body></html>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Wave OAuth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));
