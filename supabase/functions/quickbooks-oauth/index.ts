import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function envTrim(key: string): string | undefined {
  const v = Deno.env.get(key);
  if (v == null) return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

/** Match quickbooks-hotel-oauth; override with QUICKBOOKS_OAUTH_SCOPE secret. */
const DEFAULT_QB_OAUTH_SCOPE = 'com.intuit.quickbooks.accounting openid profile email';
const QB_OAUTH_SCOPE = (envTrim('QUICKBOOKS_OAUTH_SCOPE') ?? DEFAULT_QB_OAUTH_SCOPE).replace(/\s+/g, ' ').trim();

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

serve(sentryServe("quickbooks-oauth", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const rateLimit = checkRateLimit(clientIp);
  
  if (!rateLimit.allowed) {
    console.log('[QB-OAUTH] Rate limit exceeded for IP:', clientIp);
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': rateLimit.retryAfter?.toString() || '60' },
    });
  }

  console.log('QuickBooks OAuth request:', {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get('Authorization')
  });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Check if we have the required QuickBooks credentials
    const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      console.error('Missing QuickBooks credentials');
      return new Response(JSON.stringify({ 
        error: 'QuickBooks credentials not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const { searchParams } = url;

    if (req.method === 'POST') {
      // Initiate OAuth flow - get authenticated user
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        console.error('No authenticated user for OAuth initiation');
        return new Response(JSON.stringify({ 
          error: 'Authentication required. Please log in first.' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Initiating QuickBooks OAuth flow for user:', user.id);
      
      // Get the origin from the request to preserve the environment (preview vs production)
      const requestOrigin = req.headers.get('origin') || req.headers.get('referer');
      console.log('Raw request headers for origin detection:', {
        origin: req.headers.get('origin'),
        referer: req.headers.get('referer'),
        host: req.headers.get('host')
      });
      
      // Known valid origins (including preview URLs)
      const knownOrigins = [
        'https://www.vesta.ai',
        'https://vesta.ai'
      ];
      
      let appOrigin = 'https://www.vesta.ai'; // Default to production

      if (requestOrigin) {
        try {
          const originUrl = new URL(requestOrigin);
          const detectedOrigin = `${originUrl.protocol}//${originUrl.host}`;
          const h = originUrl.host;
          const isTrustedDevHost =
            !!h &&
            (h.includes('.vercel.app') ||
              h.includes('localhost') ||
              h.includes('127.0.0.1'));

          if (h && h.length > 0 &&
              (knownOrigins.includes(detectedOrigin) || isTrustedDevHost)) {
            appOrigin = detectedOrigin;
            console.log('Successfully detected app origin from request:', appOrigin);
          } else {
            console.warn('Detected origin not in allowed list, using default:', { detectedOrigin, appOrigin });
          }
        } catch (e) {
          console.error('Failed to parse origin:', e, 'using default:', appOrigin);
        }
      } else {
        console.log('No origin header found, using default:', appOrigin);
      }
      
      // Final validation - ensure appOrigin is a complete URL
      try {
        const validateUrl = new URL(appOrigin);
        if (!validateUrl.host || validateUrl.host.length === 0) {
          console.error('Invalid appOrigin detected, forcing production default:', appOrigin);
          appOrigin = 'https://www.vesta.ai';
        }
      } catch (e) {
        console.error('appOrigin validation failed, forcing production default:', appOrigin);
        appOrigin = 'https://www.vesta.ai';
      }
      
      console.log('Final appOrigin for OAuth flow:', appOrigin);
      
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/quickbooks-oauth`;
      // Store user ID and app origin in state to retrieve during callback
      const state = `${user.id}:${crypto.randomUUID()}:${encodeURIComponent(appOrigin)}`;

      const authParams = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        scope: QB_OAUTH_SCOPE,
        redirect_uri: redirectUri,
        access_type: 'offline',
        state,
      });
      const authUrl = `https://appcenter.intuit.com/connect/oauth2?${authParams.toString()}`;

      console.log('Generated auth URL:', { redirectUri, scope: QB_OAUTH_SCOPE, userId: user.id, appOrigin });

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (req.method === 'GET' && searchParams.get('code')) {
      // Handle OAuth callback - extract user ID from state
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const realmId = searchParams.get('realmId');

      console.log('OAuth callback received:', { code: !!code, state, realmId });

      const stateParts = state?.split(':') || [];
      if (stateParts.length < 2) {
        console.error('Invalid state parameter:', state);
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head><title>Invalid Request</title></head>
          <body>
            <p>Invalid OAuth state. Please try connecting again.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'QB_AUTH_ERROR', error: 'Invalid state' }, '*');
                window.close();
              }
            </script>
          </body>
          </html>
        `, { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }

      // Extract user ID and app origin from state
      // Join all parts after index 1 (skip userId and nonce) to handle URLs with colons
      const userId = stateParts[0];
      let appOrigin = stateParts.slice(2).join(':');
      if (appOrigin) {
        appOrigin = decodeURIComponent(appOrigin);
      } else {
        appOrigin = 'https://www.vesta.ai';
      }
      
      console.log('Extracted from state:', { userId, rawAppOrigin: appOrigin });
      
      // Validate the extracted appOrigin to ensure it's a complete URL
      try {
        const validateUrl = new URL(appOrigin);
        if (!validateUrl.host || validateUrl.host.length === 0 || validateUrl.protocol === '') {
          console.error('Invalid appOrigin from state, using production default:', appOrigin);
          appOrigin = 'https://www.vesta.ai';
        } else {
          console.log('Validated appOrigin:', appOrigin);
        }
      } catch (e) {
        console.error('appOrigin validation failed:', e, 'using production default');
        appOrigin = 'https://www.vesta.ai';
      }

      // Create admin client to bypass RLS for callback processing
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code!,
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/quickbooks-oauth`
        })
      });

      const tokens = await tokenResponse.json();
      console.log('Token response received');

      if (tokens.error) {
        console.error('Token exchange error:', tokens);
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head><title>Connection Failed</title></head>
          <body>
            <p>Failed to connect to QuickBooks. Please try again.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'QB_AUTH_ERROR', error: 'Token exchange failed' }, '*');
                window.close();
              }
            </script>
          </body>
          </html>
        `, { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }

      // Get company info
      const baseUrl = tokens.base_uri || 'https://sandbox-quickbooks.api.intuit.com';
      const companyInfoResponse = await fetch(
        `${baseUrl}/v3/company/${realmId}/companyinfo/${realmId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Accept': 'application/json'
          }
        }
      );

      const companyData = await companyInfoResponse.json();
      console.log('Company info retrieved:', JSON.stringify(companyData).substring(0, 500));

      const companyInfo = companyData.CompanyInfo || companyData.QueryResponse?.CompanyInfo?.[0];
      const companyName = companyInfo?.CompanyName || companyInfo?.LegalName || 'Unknown Company';
      
      console.log('Extracted company name:', companyName);
      
      // Store integration in database using admin client
      const { error: insertError } = await adminClient
        .from('quickbooks_integrations')
        .insert({
          user_id: userId,
          company_id: realmId,
          company_name: companyName,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
          realm_id: realmId,
          base_url: baseUrl
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head><title>Connection Failed</title></head>
          <body>
            <p>Failed to save QuickBooks integration. Please try again.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'QB_AUTH_ERROR', error: 'Failed to save integration' }, '*');
                window.close();
              }
            </script>
          </body>
          </html>
        `, { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }

      // Update user profile with company info using admin client
      await adminClient
        .from('profiles')
        .update({
          company_name: companyName,
          business_type: 'QuickBooks Connected',
          industry: companyInfo?.Industry || null
        })
        .eq('user_id', userId);

      console.log('QuickBooks integration saved successfully for user:', userId);
      
      // Use the app origin that was stored in the state parameter
      // Redirect to /chat where users actually are
      const chatUrl = `${appOrigin}/chat`;
      console.log('Completing OAuth, will close popup and notify parent');
      
      return new Response(`<!DOCTYPE html>
<html>
<head>
  <title>QuickBooks Connected</title>
  <meta charset="utf-8">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 40px;
      background: #f8f9fa;
    }
    .success {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 400px;
      margin: 0 auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .checkmark {
      color: #22c55e;
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      color: #1a1a1a;
      margin: 0 0 8px;
      font-size: 24px;
    }
    p {
      color: #64748b;
      margin: 0 0 24px;
    }
    button {
      background: #22c55e;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #16a34a;
    }
  </style>
</head>
<body>
  <div class="success">
    <div class="checkmark">✓</div>
    <h1>Successfully Connected!</h1>
    <p>Your QuickBooks account is now linked.</p>
    <button onclick="window.close()">Close Window</button>
  </div>
  <script>
    (function() {
      const companyName = ${JSON.stringify(companyName)};
      const appOrigin = ${JSON.stringify(appOrigin)};
      
      console.log('QuickBooks OAuth success page loaded');
      
      // Send success message to parent window with delay to ensure it's delivered
      function sendMessage() {
        if (window.opener && !window.opener.closed) {
          try {
            const message = { 
              type: 'QB_AUTH_SUCCESS',
              companyName: companyName
            };
            
            console.log('Sending success message to parent:', message);
            
            // Send to both specific origin and wildcard for reliability
            window.opener.postMessage(message, appOrigin);
            window.opener.postMessage(message, '*');
            
            console.log('Success message sent to parent window');
            
            // Try to close after a short delay to ensure message is delivered
            setTimeout(() => {
              try {
                window.close();
              } catch (e) {
                console.log('Window close failed (expected in some browsers):', e);
              }
            }, 500);
            
          } catch (e) {
            console.error('Failed to send message:', e);
          }
        } else {
          console.warn('No opener window available');
        }
      }
      
      // Send message after a brief delay to ensure page is fully loaded
      setTimeout(sendMessage, 100);
      
    })();
  </script>
</body>
</html>`, {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/html; charset=utf-8'
        },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid request method or missing parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('QuickBooks OAuth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));