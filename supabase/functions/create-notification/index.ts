// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  scheduled_for?: string;
}

// Generate enriched notification content using Groq AI
const generateEnhancedContent = async (baseContent: string, type: string) => {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  
  if (!groqApiKey) {
    return baseContent; // Return original content if no API key
  }

  try {
    const prompt = type === 'weekly_report' 
      ? `Enhance this financial report with actionable insights and professional formatting. Keep it concise but informative:\n\n${baseContent}`
      : `Enhance this financial alert with context and actionable recommendations:\n\n${baseContent}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: 'You are a financial advisor AI. Provide clear, actionable insights.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content || baseContent;
    }
  } catch (error) {
    console.error('Error enhancing content with Groq:', error);
  }

  return baseContent;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, title, message, data, scheduled_for }: NotificationRequest = await req.json();

    if (!userId || !type || !title || !message) {
      throw new Error("Missing required fields: userId, type, title, message");
    }

    // Enhance content with Groq AI if available
    const enhancedMessage = await generateEnhancedContent(message, type);

    // Create in-app notification with enhanced content
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message: enhancedMessage,
        data: data || {},
        scheduled_for: scheduled_for ? new Date(scheduled_for).toISOString() : null
      })
      .select()
      .single();

    if (notificationError) {
      throw notificationError;
    }

    console.log("Notification created successfully:", notification.id);

    // Auto-send email for critical notifications
    const criticalTypes = ['credit_depleted', 'credit_low', 'strategic_alert', 'weekly_report'];
    const shouldSendEmail = criticalTypes.includes(type);

    if (shouldSendEmail) {
      // Check if user has email alerts enabled
      const { data: emailSettings } = await supabase
        .from('email_settings')
        .select('alerts_enabled, email')
        .eq('user_id', userId)
        .single();

      if (emailSettings?.alerts_enabled) {
        // Get user profile for name
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', userId)
          .single();

        const userEmail = profile?.email || emailSettings.email;

        if (userEmail) {
          // Send email in background (non-blocking)
          supabase.functions.invoke('send-notification-email', {
            body: {
              userEmail,
              userName: profile?.full_name || 'Valued User',
              notificationTitle: title,
              notificationMessage: enhancedMessage,
              notificationType: type,
              dashboardUrl: `${(Deno.env.get('PUBLIC_SITE_URL') ?? Deno.env.get('SITE_URL') ?? 'https://www.vesta.ai').replace(/\/$/, '')}/dashboard`
            }
          }).then(({ error: emailError }) => {
            if (!emailError) {
              // Update notification to mark email sent
              supabase
                .from('notifications')
                .update({ email_sent: true })
                .eq('id', notification.id)
                .then(() => console.log("Email sent for notification:", notification.id));
            } else {
              console.error("Email sending failed:", emailError);
            }
          }).catch(err => console.error("Email invocation error:", err));
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      notificationId: notification.id,
      enhancedContent: enhancedMessage !== message,
      emailQueued: shouldSendEmail,
      message: "Notification created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error creating notification:", error);

    return new Response(JSON.stringify({ 
      error: "Notification creation failed", 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});