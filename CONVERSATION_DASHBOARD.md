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

# New variables for email
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Optional: Secure the cron endpoint
CRON_SECRET=some_random_secret_key

# Optional: Base URL for email links
NEXT_PUBLIC_BASE_URL=https://archpointlabs.com
```

### Step 2: Gmail App Password Setup

To use Gmail for sending emails, you need to create an App Password:

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create an App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Archpoint Labs Notifications"
   - Click "Generate"
   - Copy the 16-character password

3. **Add to Environment Variables**
   ```bash
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  # The generated password
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

### Step 4: Deploy to Vercel

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

### Step 5: Add Environment Variables to Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all the variables from `.env.local`
4. Redeploy your application

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

1. **Check Gmail credentials:**
   ```bash
   # Make sure these are set correctly
   echo $GMAIL_USER
   echo $GMAIL_APP_PASSWORD
   ```

2. **Test the endpoint manually:**
   ```bash
   curl http://localhost:3000/api/send-digest
   ```

3. **Check server logs** in Vercel dashboard for error messages

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
- Gmail App Passwords are more secure than using your main password
- Never commit `.env` files to version control

## Support

For issues or questions, contact the development team or check the main README.md.
