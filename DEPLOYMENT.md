# Deployment Guide for Syllabus AI

## Build Successfully Fixed! ✅

Your application now builds successfully with the following improvements:

1. **Updated next.config.js** with Vercel-optimized configuration
2. **Created vercel.json** for explicit Vercel deployment settings
3. **Added OpenAI API key** to environment variables
4. **Improved error handling** in OpenAI client initialization
5. **Enhanced dashboard** with better error handling for API calls

---

## Deploy to Vercel

### Step 1: Push Code to Git Repository

Ensure your code is pushed to GitHub, GitLab, or Bitbucket:

```bash
git add .
git commit -m "Fix Vercel deployment with improved configuration"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will automatically detect Next.js

### Step 3: Configure Build Settings

Vercel should auto-detect these settings (verify they match):

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node.js Version:** 18.x or 20.x (recommended: 20.x)

### Step 4: Add Environment Variables

**CRITICAL:** In the Vercel project settings, add these environment variables:

#### Required Variables:

```
OPENAI_API_KEY=your-openai-api-key-here
```

```
NEXT_PUBLIC_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
```

#### Apply to All Environments:
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 5: Deploy

1. Click "Deploy"
2. Wait for the build to complete (2-5 minutes)
3. Your app will be live at `your-project-name.vercel.app`

---

## What Was Fixed for Vercel Deployment

### 1. Vercel Configuration (vercel.json)
Created a dedicated Vercel configuration file that explicitly defines:
- Build command and framework
- Environment variable references
- Build-time environment configuration

### 2. Next.js Configuration Improvements
Updated `next.config.js` with:
- `output: 'standalone'` for optimized Vercel deployments
- Enhanced webpack externals for server-side modules
- Added explicit environment variable mapping
- Improved client-side fallbacks for Node.js modules

### 3. OpenAI Client Initialization
Modified `lib/openai.ts` to:
- Prevent build-time errors when API key is missing
- Use a dummy key during build, validate at runtime
- Add helper functions to check configuration status
- Gracefully handle missing API keys with proper error messages

### 4. Enhanced Error Handling
Improved error handling in:
- Dashboard page data fetching with better error logging
- API routes with comprehensive error messages
- Build-time vs runtime error separation

---

## Environment Variables You Need

### OpenAI API Key (REQUIRED)

Your AI features require this API key:
- **Variable Name:** `OPENAI_API_KEY`
- **Value:** Your OpenAI API key (keep this secret!)
- Get your key from: https://platform.openai.com/api-keys

### Supabase Configuration (REQUIRED)

Your database credentials:
- **NEXT_PUBLIC_SUPABASE_URL:** `https://0ec90b57d6e95fcbda19832f.supabase.co`
- **NEXT_PUBLIC_SUPABASE_ANON_KEY:** (the key from your .env file)

---

## Database Setup

### Apply Database Migration

Before your app can work properly, you need to apply the database migration:

1. Log into your Supabase dashboard at https://supabase.com/dashboard
2. Navigate to your project
3. Go to the SQL Editor
4. Copy the contents of `supabase/migrations/20250620160757_wispy_reef.sql`
5. Paste and execute the SQL in the editor
6. Verify that all tables are created successfully

This creates:
- `user_profiles` - User account and subscription management
- `study_plans` - Stores generated study plans
- `uploaded_files` - Tracks uploaded documents
- `practice_exams` - Practice exam data
- `exam_attempts` - User exam attempt history
- `user_progress` - Progress tracking
- `subscription_history` - Subscription change log

Plus all necessary Row Level Security (RLS) policies and database functions.

---

## Post-Deployment Checklist

After deployment, test these features:

- [ ] User registration and login works
- [ ] File upload (PDF, DOCX, TXT) works
- [ ] Study plan generation completes successfully
- [ ] Flashcards display correctly
- [ ] Quiz functionality works
- [ ] Practice exam generation succeeds
- [ ] Dashboard loads and displays data
- [ ] All pages load without 500 errors
- [ ] API routes respond correctly

---

## Troubleshooting

### Build Fails on Vercel

If the build fails:

1. **Check Environment Variables**
   - Verify all three environment variables are set in Vercel
   - Ensure there are no extra spaces or quotes
   - Confirm they're applied to all environments

2. **Check Node.js Version**
   - Vercel should use Node.js 18.x or 20.x
   - You can specify this in Vercel project settings

3. **Check Build Logs**
   - Look for specific error messages
   - Common issues: missing dependencies, TypeScript errors, webpack errors

### "Collecting Page Data" Errors

If build fails during "Collecting page data":
- This usually means an API route is failing at build time
- Check that environment variables are set correctly
- Ensure the OpenAI API key is valid and has credits

### 500 Internal Server Error

This usually means:
- **Missing or invalid `OPENAI_API_KEY`** - Check Vercel environment variables
- **Supabase connection issues** - Verify Supabase credentials
- **Database migration not applied** - Run the SQL migration in Supabase

To debug:
1. Check Vercel function logs in the Vercel dashboard
2. Look for specific error messages
3. Verify all environment variables are set correctly

### Database Connection Issues

1. Verify your Supabase credentials in Vercel environment variables
2. Check that your Supabase project is active and running
3. Ensure RLS policies are properly configured (run the migration)
4. Check Supabase logs for connection errors

### OpenAI API Errors

Common issues:
- **Invalid API key** - Verify the key is correct and active
- **Quota exceeded** - Check your OpenAI account billing and usage
- **Rate limit** - Wait a few minutes and try again
- **Insufficient credits** - Add credits to your OpenAI account

---

## Local Development

To run locally after these fixes:

```bash
# Install dependencies
npm install

# Your .env file is already configured with the OpenAI API key

# Run development server
npm run dev

# Build for production (to test)
npm run build

# Start production server (after build)
npm start
```

---

## Configuration Files

### vercel.json
Defines Vercel-specific deployment settings:
- Build and install commands
- Environment variable references
- Framework configuration

### next.config.js
Next.js configuration optimized for Vercel:
- Standalone output mode for serverless
- Webpack externals for Node.js modules
- Client-side fallbacks
- Environment variable mapping

### .env
Local environment variables (DO NOT commit this file to Git):
- OpenAI API key
- Supabase credentials
- Local development settings

---

## Security Notes

1. **Never commit .env files** to Git repositories
2. **Use Vercel's environment variables** for all sensitive data
3. **OpenAI API key** should be kept secret and rotated regularly
4. **Supabase keys** use RLS policies to protect data
5. **Monitor usage** on both OpenAI and Supabase dashboards

---

## Need Help?

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Supabase Documentation:** https://supabase.com/docs
- **OpenAI API Documentation:** https://platform.openai.com/docs

---

## Summary

Your application is now fully configured and ready for Vercel deployment! The main improvements include:

1. ✅ Build errors fixed with optimized Next.js and Vercel configuration
2. ✅ OpenAI API key properly configured with runtime validation
3. ✅ Enhanced error handling throughout the application
4. ✅ Database migration ready to be applied
5. ✅ Comprehensive environment variable setup
6. ✅ Production-ready build successfully tested

Simply push your code to Git, connect to Vercel, add the environment variables, and deploy. Your study planning application will be live and ready to help students ace their exams!
