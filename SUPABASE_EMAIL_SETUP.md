# Supabase Email Setup Instructions

To enable email notifications in your Finlo application, you need to configure SMTP settings in your Supabase dashboard.

## Setup Steps

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project: `godnomficzhjaclmvomh`

2. **Configure SMTP Settings**
   - Go to Settings > Auth > SMTP Settings
   - Enable "Enable custom SMTP"

3. **Choose SMTP Provider**
   You can use any of these popular providers:
   
   ### Gmail SMTP
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: Your Gmail address
   - Password: Use App Password (not your regular password)
   - Secure: Yes

   ### SendGrid
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: Your SendGrid API key
   - Secure: Yes

   ### Mailgun
   - Host: `smtp.mailgun.org`
   - Port: `587`
   - Username: Your Mailgun SMTP username
   - Password: Your Mailgun SMTP password
   - Secure: Yes

4. **Configure Email Templates** (Optional)
   - In the same Auth settings, you can customize email templates
   - The application already includes beautiful HTML templates

5. **Test Email Delivery**
   - Once configured, test the notification system
   - Check your email provider's delivery logs

## Benefits of Supabase Email vs Resend

- ✅ No domain verification required
- ✅ Integrated with your existing Supabase setup
- ✅ Reliable delivery through established SMTP providers
- ✅ Better error handling and logging
- ✅ No additional API keys to manage

## Troubleshooting

If emails still don't send:
1. Check SMTP credentials are correct
2. Verify SMTP settings in Supabase dashboard
3. Check email provider logs
4. Ensure "Enable custom SMTP" is turned on
5. Test with a simple email first

## Current Status

The application has been updated to use Supabase's email system instead of Resend. Once you configure SMTP in the dashboard, all notification emails will be delivered automatically.