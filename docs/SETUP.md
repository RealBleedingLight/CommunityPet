# Community Pet Discord Bot - Deployment Guide

This guide walks you through deploying the Community Pet bot to Vercel with a Neon Postgres database.

## Prerequisites

Before you start, make sure you have:
- **Node.js 20 or higher** - [Download here](https://nodejs.org/)
- **GitHub account** - [Sign up](https://github.com/)
- **Vercel account** - [Sign up free](https://vercel.com/)
- **Discord server** - Where you'll test the bot
- **Discord Developer account** - [Discord Developer Portal](https://discord.com/developers/applications)
- **Neon account** (free tier available) - [Neon Database](https://neon.tech/)

## Step 1: Create Discord Bot & Get Credentials

### 1.1 Create a Bot Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Enter a name (e.g., "Community Pet")
4. Accept the terms and click **Create**

### 1.2 Enable Privileged Intents

1. Navigate to the **Bot** tab on the left
2. Under **Privileged Gateway Intents**, enable:
   - ✅ **Message Content Intent** (needed to read messages)
   - ✅ **Server Members Intent** (optional, for member tracking)

### 1.3 Get Your Bot Token

1. In the **Bot** tab, click **Reset Token** (or copy existing)
2. Click **Copy** next to the token
3. **Save this somewhere secure** - you'll need it for environment variables

### 1.4 Copy Client ID and Public Key

1. Go to the **General Information** tab
2. Copy your **Client ID**
3. Copy your **Public Key**
4. Save both - you'll need these later

### 1.5 Set Bot Permissions

1. Go to the **OAuth2** tab
2. Click **URL Generator** under **Scopes**
3. Select these scopes:
   - ✅ `bot`
   - ✅ `applications.commands` (for slash commands)

4. Under **Bot Permissions**, select:
   - ✅ **Send Messages**
   - ✅ **Use Slash Commands**
   - ✅ **Use Public Threads**
   - ✅ **Send Messages in Threads**

5. Copy the generated URL at the bottom
6. Open it in your browser to invite the bot to your server

### 1.6 Verify Bot in Your Server

1. Check your Discord server - the bot should appear in the member list
2. The bot should have a role assigned automatically

## Step 2: Set Up Neon Database

### 2.1 Create a Neon Project

1. Go to [Neon Console](https://console.neon.tech/)
2. Click **Create a project**
3. Choose:
   - **Region**: Pick one closest to you (or where your servers are)
   - **Database name**: `community_pet` (or any name you prefer)
   - **Branch name**: `main` (default is fine)
4. Click **Create project**

### 2.2 Get Connection String

1. In the Neon console, you'll see your project
2. Click **Connection string** or the connection details
3. Copy the full connection string (starts with `postgresql://`)
4. **Save this** - you'll need it for environment variables

**Note**: The connection string contains your password. Keep it secret!

Example format:
```
postgresql://user:password@host.neon.tech:5432/community_pet?sslmode=require
```

## Step 3: Deploy to Vercel

### 3.1 Fork & Clone Repository

1. Go to the [Community Pet repository](https://github.com/your-username/dbots) (or your fork)
2. Click **Fork** to create your own copy
3. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/dbots.git
cd dbots
```

### 3.2 Install Dependencies Locally

```bash
npm install
```

### 3.3 Build and Test Locally (Optional)

Before deploying, you can test locally:

```bash
# Build
npm run build

# Test
npm run test

# Run locally (if you set up .env.local)
npm run dev
```

### 3.4 Connect to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/)
2. Click **Add New** → **Project**
3. Click **Import Git Repository**
4. Select your GitHub account and fork
5. Select the `dbots` repository
6. Click **Import**

#### Option B: Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link      # Follow prompts to create project
vercel deploy    # Deploy preview
```

### 3.5 Add Environment Variables

In the Vercel dashboard:

1. Go to your project settings
2. Click **Environment Variables**
3. Add these variables:

| Name | Value | Source |
|------|-------|--------|
| `DISCORD_BOT_TOKEN` | Your bot token | Step 1.3 |
| `DISCORD_CLIENT_ID` | Your client ID | Step 1.4 |
| `DISCORD_PUBLIC_KEY` | Your public key | Step 1.4 |
| `DATABASE_URL` | Neon connection string | Step 2.2 |
| `CRON_SECRET` | Any random string (e.g., `super-secret-cron-key`) | Create one |
| `NODE_ENV` | `production` | Fixed value |

**Important**: Set these for both **Production** and **Preview** environments (unless you only want to test on preview first).

### 3.6 Configure Discord Webhook

The bot uses Discord interactions (webhooks) to receive commands. You need to update the webhook URL:

1. In Vercel dashboard, copy your **Production URL** (e.g., `https://your-project.vercel.app`)
2. Go back to [Discord Developer Portal](https://discord.com/developers/applications)
3. Select your bot application
4. Go to **General Information**
5. Set **Interactions Endpoint URL** to:
   ```
   https://your-project.vercel.app/api/webhook
   ```
6. Click **Save Changes**
7. If prompted, Discord will verify the endpoint - this should succeed

### 3.7 Trigger Initial Deployment

After adding environment variables:

1. In Vercel dashboard, go to **Deployments**
2. Click the three dots on the most recent deployment
3. Click **Redeploy** (or push a commit to trigger auto-deploy)
4. Wait for deployment to complete (should be green checkmark)

## Step 4: Verify Deployment

### 4.1 Test Bot Commands

1. Go to your Discord server
2. Type `/` in any channel
3. You should see bot commands appear:
   - `/feed`
   - `/play`
   - `/talk`
   - `/pet`
   - `/status`
   - `/rename`

4. Try `/status` first - you should see the pet's current stats
5. Try `/feed` - bot should respond with a message and update stats

### 4.2 Check Logs

If commands aren't working:

1. Go to Vercel dashboard
2. Click **Deployments**
3. Click the latest deployment
4. Go to **Logs**
5. Look for errors in the logs

### 4.3 Verify Cron Jobs

The bot includes a background cron job that runs every 5 minutes:

1. In Vercel dashboard, go to **Crons**
2. You should see `/api/cron/tick` with schedule `*/5 * * * *`
3. Check the **Executions** tab to see if it's running successfully

## Troubleshooting

### Bot Not Responding to Commands

**Problem**: Commands appear in Discord but bot doesn't respond

**Solutions**:
1. Check that **Interactions Endpoint URL** is correctly set in Discord Developer Portal
   - It should be `https://your-project.vercel.app/api/webhook`
   - Verify spelling and no trailing spaces

2. Check Vercel logs:
   - Go to Vercel dashboard → Deployments → Latest → Logs
   - Look for errors in the webhook endpoint

3. Verify environment variables:
   - All 6 variables must be set (check in Vercel dashboard)
   - `DISCORD_PUBLIC_KEY` must match exactly from Developer Portal

4. Try redeploying:
   ```bash
   git push  # Trigger auto-deploy
   # or manually redeploy in Vercel dashboard
   ```

### Database Connection Errors

**Problem**: Database errors in logs, stats not saving

**Solutions**:
1. Verify `DATABASE_URL` is correct:
   - Check Neon console for connection string
   - Ensure it includes `?sslmode=require`
   - Copy-paste to avoid typos

2. Check Neon project status:
   - Go to [Neon Console](https://console.neon.tech/)
   - Ensure your project shows **Available** (not suspended)

3. Test connection:
   - In Vercel logs, you should see `Connected to database` on first request
   - If not, check the error message for specific issues

### Cron Job Not Running

**Problem**: Bot stats don't update, no background activity

**Solutions**:
1. Verify cron configuration in Vercel:
   - Go to Vercel dashboard → Crons
   - `/api/cron/tick` should be listed
   - Check Executions tab for recent runs

2. Check logs:
   - Click on a failed execution to see error details
   - Verify `CRON_SECRET` is set in environment variables

3. The cron job runs on Vercel's infrastructure:
   - It's independent of user commands
   - May take a few minutes to start

### "Invalid Interaction Token" Error

**Problem**: Commands fail with interaction token error

**Solutions**:
1. Redeploy your project:
   - Push code changes to GitHub (or manually trigger in Vercel)
   - Wait for green checkmark in Deployments

2. Update webhook URL if you changed it:
   - In Discord Developer Portal, update **Interactions Endpoint URL**
   - Wait a few seconds for changes to propagate

### Commands Not Appearing in Discord

**Problem**: `/status` and other commands don't show up

**Solutions**:
1. Ensure bot has `applications.commands` scope:
   - Go to Discord Developer Portal → OAuth2 → URL Generator
   - Verify `applications.commands` scope is selected
   - Re-invite bot to server using generated URL

2. Refresh Discord client:
   - Close Discord completely and reopen
   - Or reload in browser (Ctrl+R or Cmd+R)

3. Check bot permissions:
   - In your Discord server, right-click bot role
   - Ensure it has permission to "Use Application Commands"

### Still Having Issues?

1. **Check logs first**: Always look at Vercel logs for specific error messages
2. **Verify environment variables**: Open Vercel dashboard and confirm all 6 are set
3. **Test locally** (optional):
   ```bash
   npm run build
   npm run test
   ```
4. **Discord Server Status**: Check [Discord Status Page](https://status.discord.com/) for any outages

## Next Steps

### Customize Your Bot

1. **Rename the pet**:
   - Use `/rename MyPetName` in Discord
   - Any user can rename it

2. **Adjust settings**:
   - Edit `src/utils/pet-state.ts` to change how stats decay
   - Edit `src/utils/messages.ts` to customize pet messages
   - Rebuild and redeploy: `git push`

3. **Monitor pet activity**:
   - Check Vercel logs to see when bot wakes up
   - Review Cron Executions to track background activity

### Further Configuration

- **Change bot status/presence**: Edit `src/bot/index.ts`
- **Add new commands**: Create files in `src/commands/`
- **Modify database schema**: Update `src/db/schema.ts` (requires Neon schema changes)

## Production Best Practices

1. **Never commit secrets**: `.env` files are in `.gitignore` for a reason
2. **Use environment variables**: All secrets go in Vercel dashboard, not code
3. **Monitor logs regularly**: Check Vercel dashboard for errors
4. **Test on preview first**: Vercel auto-creates preview deploys for PRs
5. **Keep Node.js updated**: Vercel supports Node.js 20.x - we're using that
6. **Review cron costs**: Vercel's free tier includes limited cron executions

## Support & Resources

- **Discord.js Docs**: https://discord.js.org/
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs/
- **Discord Developer Portal**: https://discord.com/developers/applications

## Common Commands for Maintenance

```bash
# Pull latest changes from GitHub
git pull

# Build locally to test changes
npm run build

# Run tests
npm run test

# Push changes to deploy
git push
```

Happy hosting! Your Community Pet is now live! 🐾
