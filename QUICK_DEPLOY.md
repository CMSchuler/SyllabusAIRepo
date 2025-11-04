# Quick Deployment Reference Card

## ⚡ Fast Track to Vercel Deployment

### Step 1: Add Environment Variables in Vercel
Go to your Vercel project → Settings → Environment Variables

Add these **3 variables** to **ALL environments** (Production, Preview, Development):

```
OPENAI_API_KEY
your-openai-api-key-here
```

```
NEXT_PUBLIC_SUPABASE_URL
https://0ec90b57d6e95fcbda19832f.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
```

### Step 2: Deploy
Push your code to Git, or click "Redeploy" in Vercel dashboard.

### Step 3: Apply Database Migration
1. Go to https://supabase.com/dashboard
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/20250620160757_wispy_reef.sql`
4. Paste and execute

### Step 4: Test
Visit your deployed app and verify:
- [ ] Login/Signup works
- [ ] File upload works
- [ ] Study plan generation works
- [ ] Dashboard loads

---

## 🔧 Build Configuration

### Files Modified:
- ✅ `.env` - OpenAI API key added
- ✅ `vercel.json` - Created for Vercel config
- ✅ `next.config.js` - Optimized for Vercel
- ✅ `lib/openai.ts` - Build-time safety added
- ✅ `app/dashboard/page.tsx` - Error handling improved

### Key Changes:
1. **Vercel Config** - Explicit environment variable handling
2. **Next.js Config** - Standalone output + webpack externals
3. **OpenAI Client** - Dummy key for build, validate at runtime
4. **Error Handling** - Better logging and graceful degradation

---

## 🚨 Troubleshooting

### Build fails during "Collecting page data"?
→ Check that all 3 environment variables are set in Vercel

### 500 error on deployed app?
→ Verify OpenAI API key is valid and has credits
→ Check Supabase credentials are correct
→ Ensure database migration was applied

### Dashboard redirects to /upload immediately?
→ Database migration not applied - run the SQL in Supabase

---

## 📊 Build Status

✅ **Local Build:** Passing
✅ **All Pages:** Generated successfully
✅ **API Routes:** Compiled
✅ **Middleware:** Optimized
✅ **Environment:** Configured

**Ready for deployment!** 🚀

---

For detailed instructions, see `DEPLOYMENT.md`
For technical details, see `VERCEL_DEPLOYMENT_FIXES.md`
