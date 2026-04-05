import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

serve(sentryServe("zoho-oauth", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const rateLimit = checkRateLimit(clientIp);
  
  if (!rateLimit.allowed) {
    console.log('[ZOHO-OAUTH] Rate limit exceeded for IP:', clientIp);
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': rateLimit.retryAfter?.toString() || '60' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const clientId = Deno.env.get('ZOHO_CLIENT_ID');
    const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      console.error('Zoho credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Zoho credentials not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);

    // POST endpoint - Generate authorization URL
    if (req.method === 'POST') {
      const { data: { user }, error: userError } = await supabase.auth.getUser(
        req.headers.get('Authorization')?.replace('Bearer ', '') || ''
      );

      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const clientId = Deno.env.get('ZOHO_CLIENT_ID');
      const redirectUri = `${supabaseUrl}/functions/v1/zoho-oauth`;
      
      const authUrl = `https://accounts.zoho.com/oauth/v2/auth?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `scope=ZohoBooks.fullaccess.all&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${user.id}&` +
        `access_type=offline&` +
        `prompt=consent`;

      console.log('Generated Zoho auth URL for user:', user.id);

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET endpoint - Handle OAuth callback
    if (req.method === 'GET') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // user_id
      const error = url.searchParams.get('error');

      if (error) {
        console.error('Zoho OAuth error:', error);
        return new Response(getErrorHtml('Authorization was cancelled or failed'), {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      if (!code || !state) {
        console.error('Missing code or state parameter');
        return new Response(getErrorHtml('Invalid OAuth response'), {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      const userId = state;
      console.log('Processing OAuth callback for user:', userId);

      // Exchange code for tokens
      const clientId = Deno.env.get('ZOHO_CLIENT_ID')!;
      const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET')!;
      const redirectUri = `${supabaseUrl}/functions/v1/zoho-oauth`;

      const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || tokenData.error) {
        console.error('Token exchange error:', tokenData);
        return new Response(getErrorHtml('Failed to obtain access token'), {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      const { access_token, refresh_token, expires_in, api_domain } = tokenData;
      
      // Calculate token expiry
      const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
      
      // Extract API domain and data center
      const apiDomainUrl = api_domain || 'https://www.zohoapis.com';
      const dataCenter = extractDataCenter(apiDomainUrl);
      
      console.log('Token obtained, API domain:', apiDomainUrl, 'Data center:', dataCenter);

      // Fetch organizations
      const orgsResponse = await fetch(`${apiDomainUrl}/books/v3/organizations`, {
        headers: { 'Authorization': `Zoho-oauthtoken ${access_token}` },
      });

      const orgsData = await orgsResponse.json();

      if (!orgsResponse.ok || !orgsData.organizations || orgsData.organizations.length === 0) {
        console.error('Failed to fetch organizations:', orgsData);
        return new Response(getErrorHtml('No Zoho Books organizations found'), {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      // Use first organization
      const org = orgsData.organizations[0];
      console.log('Organization found:', org.name, 'ID:', org.organization_id);

      // Store integration in database
      const { error: insertError } = await supabase
        .from('zoho_integrations')
        .upsert({
          user_id: userId,
          organization_id: org.organization_id,
          organization_name: org.name,
          data_center: dataCenter,
          api_domain: apiDomainUrl,
          access_token: access_token,
          refresh_token: refresh_token,
          token_expires_at: expiresAt,
          currency_code: org.currency_code || 'USD',
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,organization_id',
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        return new Response(getErrorHtml('Failed to save integration'), {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      console.log('Zoho integration saved successfully for user:', userId);

      return new Response(getSuccessHtml(), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Zoho OAuth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractDataCenter(apiDomain: string): string {
  if (apiDomain.includes('.eu')) return 'EU';
  if (apiDomain.includes('.in')) return 'IN';
  if (apiDomain.includes('.com.au')) return 'AU';
  if (apiDomain.includes('.jp')) return 'JP';
  return 'US';
}

function getSuccessHtml(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Zoho Books Connected</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1F4E79 0%, #4A90E2 100%);
          }
          .container {
            background: white;
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          .success-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 1.5rem;
            background: #10B981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
          }
          h1 {
            color: #1F4E79;
            margin-bottom: 1rem;
            font-size: 1.75rem;
          }
          p {
            color: #6B7280;
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Successfully Connected!</h1>
          <p>Your Zoho Books account has been connected. This window will close automatically.</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'zoho-oauth-success' }, '*');
            setTimeout(() => window.close(), 2000);
          }
        </script>
      </body>
    </html>
  `;
}

function getErrorHtml(message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Connection Error</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1F4E79 0%, #4A90E2 100%);
          }
          .container {
            background: white;
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          .error-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 1.5rem;
            background: #EF4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
          }
          h1 {
            color: #1F4E79;
            margin-bottom: 1rem;
            font-size: 1.75rem;
          }
          p {
            color: #6B7280;
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">✕</div>
          <h1>Connection Failed</h1>
          <p>${message}</p>
          <p>You can close this window and try again.</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'zoho-oauth-error', error: '${message}' }, '*');
          }
        </script>
      </body>
    </html>
  `;
}
