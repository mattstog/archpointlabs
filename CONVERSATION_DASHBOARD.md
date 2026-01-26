# Conversation Dashboard & Email Notifications

This document explains the new conversation tracking, admin dashboard, and daily email digest features.

## Features

### 1. Admin Dashboard (`/admin`)

A beautiful, modern dashboard to view and analyze all chat conversations from your website.

**Features:**
- 📊 **Statistics**: View total conversations, today's count, and weekly activity
- 🔍 **Search**: Search by session ID, IP address, or conversation content
- 📅 **Filter**: Filter by date (today, this week, this month, all time)
- 💬 **Detailed View**: Click any conversation to see the full message history
- 🎨 **Modern UI**: Beautiful gradient design with dark mode aesthetics

**Access:** Navigate to `https://yoursite.com/admin`

### 2. Conversations API (`/api/conversations`)

RESTful API endpoint to fetch all conversations programmatically.

**Endpoint:** `GET /api/conversations`

**Response:**
```json
{
  "conversations": [...],
  "count": 42
}
```

### 3. Daily Email Digest

Automatically sends a daily email summary of new conversations to `matt@archpointlabs.com`.

**Features:**
- 📧 Sends once per day at 9:00 AM (configurable)
- 📊 Includes conversation count and full message details
- 🎨 Beautiful HTML email formatting
- ⏭️ Skips sending if no new conversations

## Setup Instructions

### Step 1: Environment Variables

Add the following to your `.env.local` file:

```bash
# Existing variables
OPENAI_API_KEY=your_openai_api_key
POSTGRES_URL=your_neon_postgres_url

# Resend API Key for email notifications
RESEND_API_KEY=your_resend_api_key

# Optional: Secure the cron endpoint
CRON_SECRET=some_random_secret_key

# Optional: Base URL for email links
NEXT_PUBLIC_BASE_URL=https://archpointlabs.com
```

### Step 2: Resend API Setup

This project uses [Resend](https://resend.com) for sending emails - it's simple, reliable, and has a generous free tier.

1. **Sign up for Resend**
   - Go to https://resend.com and create a free account
   - Free tier includes 3,000 emails/month and 100 emails/day

2. **Verify Your Domain** (Recommended for production)
   - In Resend dashboard, go to "Domains"
   - Click "Add Domain" and enter `archpointlabs.com`
   - Add the DNS records shown (TXT, MX, and CNAME)
   - Wait for verification (usually takes a few minutes)
   - Once verified, you can send from `notifications@archpointlabs.com`

3. **Or Use Resend's Test Domain** (For testing)
   - You can use `onboarding@resend.dev` for testing
   - Edit `lib/email.ts` and change the `from` address to:
     ```typescript
     from: 'Archpoint Labs <onboarding@resend.dev>',
     ```

4. **Get Your API Key**
   - In Resend dashboard, go to "API Keys"
   - Click "Create API Key"
   - Give it a name like "Archpoint Labs Production"
   - Copy the API key (starts with `re_`)

5. **Add to Environment Variables**
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   ```

### Step 3: Database Schema

The conversations are already being saved to your Neon database with this schema:

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  message_count INTEGER,
  messages JSONB,
  ai_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

If the table doesn't exist, create it in your Neon dashboard.

### Step 4: Add Environment Variables to Vercel

Before deploying, add your environment variables to Vercel:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `RESEND_API_KEY` - Your Resend API key
   - `CRON_SECRET` - A random secret string for security
   - `NEXT_PUBLIC_BASE_URL` - Your site URL (e.g., https://archpointlabs.com)
4. Redeploy your application

### Step 5: Deploy and Configure Cron

The `vercel.json` file configures a cron job to run daily at 9:00 AM UTC:

```json
{
  "crons": [
    {
      "path": "/api/send-digest",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Cron Schedule Format:**
- `0 9 * * *` = Every day at 9:00 AM UTC
- `0 17 * * *` = Every day at 5:00 PM UTC
- `0 0 * * *` = Every day at midnight UTC

**Note:** Vercel Cron is only available on Pro and Enterprise plans. For the Hobby plan, see "Alternative: Manual Scheduling" below.

## Usage

### View the Admin Dashboard

Navigate to: `https://yoursite.com/admin`

You'll see:
- Total conversation statistics
- Searchable list of all conversations
- Detailed view of any conversation

### Manual Email Testing

To manually trigger the daily digest (useful for testing):

**Development:**
```bash
curl http://localhost:3000/api/send-digest
```

**Production (with secret):**
```bash
curl -X POST https://yoursite.com/api/send-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or visit in browser (development only):
```
http://localhost:3000/api/send-digest?secret=YOUR_CRON_SECRET
```

### Alternative: Manual Scheduling

If you're on Vercel's Hobby plan (which doesn't include Cron), you can use external services:

#### Option 1: Cron-job.org (Free)
1. Sign up at https://cron-job.org
2. Create a new cron job
3. Set URL: `https://yoursite.com/api/send-digest`
4. Add header: `Authorization: Bearer YOUR_CRON_SECRET`
5. Set schedule: Daily at 9:00 AM

#### Option 2: GitHub Actions
Create `.github/workflows/daily-digest.yml`:

```yaml
name: Daily Email Digest

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-digest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Digest
        run: |
          curl -X POST https://archpointlabs.com/api/send-digest \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Then add `CRON_SECRET` to your GitHub repository secrets.

## Customization

### Change Email Schedule

Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/send-digest",
      "schedule": "0 17 * * *"  // 5 PM UTC
    }
  ]
}
```

### Change Email Recipient

Edit `lib/email.ts`, line with `to: 'matt@archpointlabs.com'`:
```typescript
to: 'newemail@example.com',
```

### Customize Email Template

Edit `lib/email.ts` in the `sendDailyDigest` function to modify the HTML email template.

### Add More Stats to Dashboard

Edit `app/admin/page.tsx` to add custom statistics or visualizations.

## Troubleshooting

### Emails not sending

1. **Check Resend API key:**
   ```bash
   # Make sure this is set correctly
   echo $RESEND_API_KEY
   ```

2. **Verify your domain in Resend:**
   - Go to Resend dashboard → Domains
   - Make sure `archpointlabs.com` is verified
   - Or use `onboarding@resend.dev` for testing

3. **Test the endpoint manually:**
   ```bash
   curl http://localhost:3000/api/send-digest
   ```

4. **Check server logs** in Vercel dashboard for error messages

5. **Check Resend logs:**
   - Go to Resend dashboard → Emails
   - Look for recent send attempts and any errors

### Dashboard not loading conversations

1. **Verify database connection:**
   - Check `POSTGRES_URL` is correct
   - Ensure the `conversations` table exists
   - Check Neon dashboard for any issues

2. **Check browser console** for API errors

3. **Test API endpoint directly:**
   ```bash
   curl https://yoursite.com/api/conversations
   ```

### Cron job not running

1. **Verify Vercel plan** includes Cron (Pro/Enterprise only)
2. **Check Vercel Logs** → "Cron Jobs" section
3. **Ensure `vercel.json`** is committed and deployed

## Security Notes

- The admin dashboard has no authentication by default. Consider adding auth middleware if needed.
- Use `CRON_SECRET` to prevent unauthorized access to the digest endpoint
- Keep your `RESEND_API_KEY` secret - never commit it to version control
- Never commit `.env` files to version control
- Resend API keys can be rotated in the dashboard if compromised

## Support

For issues or questions, contact the development team or check the main README.md.
