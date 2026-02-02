# 🚀 Vercel Deployment Guide - Cashback Tracking Platform

## Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Git installed on your computer

---

## 📦 Step 1: Push Code to GitHub

### 1.1 Create a New GitHub Repository
1. Go to [GitHub](https://github.com) and log in
2. Click the **+** icon (top right) → **New repository**
3. Repository name: `cashback-tracking-platform` (or your preferred name)
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **Create repository**

### 1.2 Push Your Local Code
Run these commands in your project directory:

```bash
# Add GitHub remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/yourusername/cashback-tracking-platform.git
git branch -M main
git push -u origin main
```

> **Note:** You may be prompted to authenticate. Use your GitHub username and a [Personal Access Token](https://github.com/settings/tokens) as the password.

---

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** or **Log In**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub account

### 2.2 Import Your Project
1. Click **Add New** → **Project**
2. Find your repository (`cashback-tracking-platform`)
3. Click **Import**

### 2.3 Configure Project Settings
Vercel will auto-detect Vite. Verify these settings:

- **Framework Preset:** Vite
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 2.4 Add Environment Variables
Click **Environment Variables** and add these:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_PROJECT_ID` | `rmdmcfgifglvtpbmcxov` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZG1jZmdpZmdsdnRwYm1jeG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzg0NzEsImV4cCI6MjA4MjcxNDQ3MX0.LYt63L0FF-QO3rUFNMsm1kNCHEWOZM7dXKhyGmNuZVA` |
| `VITE_SUPABASE_URL` | `https://rmdmcfgifglvtpbmcxov.supabase.co` |
| `VITE_OFFER18_API_KEY` | `81ad73157134a49e6ec27cc8daaed65d` |
| `VITE_OFFER18_AFFILIATE_ID` | `744826` |
| `VITE_OFFER18_MERCHANT_ID` | `1446` |

> **Important:** Set all environment variables for **Production**, **Preview**, and **Development**

### 2.5 Deploy
1. Click **Deploy**
2. Wait 2-3 minutes for the build to complete
3. You'll get a live URL like: `https://your-project.vercel.app`

---

## ✅ Step 3: Verify Deployment

### 3.1 Check Your Live Site
1. Click the deployment URL
2. Test the following:
   - ✅ Homepage loads correctly
   - ✅ Login/Signup works
   - ✅ Dashboard displays
   - ✅ Offers from Offer18 API load
   - ✅ Navigation works (React Router)

### 3.2 Common Issues & Fixes

#### Issue: Blank Page or 404 Errors
**Cause:** SPA routing not configured  
**Fix:** The `vercel.json` file handles this. If missing, create it:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Issue: Environment Variables Not Working
**Cause:** Variables not set in Vercel  
**Fix:** 
1. Go to your project in Vercel
2. **Settings** → **Environment Variables**
3. Add all `VITE_*` variables
4. **Redeploy** from the Deployments tab

#### Issue: Build Fails
**Cause:** Missing dependencies or TypeScript errors  
**Fix:**
1. Check the build logs in Vercel
2. Fix any errors locally first
3. Test with `npm run build` before pushing

---

## 🔄 Step 4: Continuous Deployment (Automatic Updates)

Once connected, **every push to GitHub** triggers a new deployment:

```bash
# Make changes to your code
git add .
git commit -m "Updated features"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your app
3. Deploy the new version
4. Provide a unique URL for each deployment

---

## 🔗 Step 5: Custom Domain (Optional)

### 5.1 Add Your Domain
1. In Vercel, go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `mycashbackapp.com`)
4. Follow DNS configuration instructions

### 5.2 Configure DNS
Add these records to your domain registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

---

## 📊 Monitoring & Analytics

### View Deployment Logs
1. Go to **Deployments** tab
2. Click any deployment
3. View **Build Logs** and **Function Logs**

### Real-Time Analytics
1. Go to **Analytics** tab
2. Monitor:
   - Page views
   - Load times
   - User locations
   - Top pages

---

## 🛠️ Advanced Configuration

### Edge Functions (for API routes)
If you add API routes later, create `api/` folder:

```
api/
  └── postback.ts  // Example serverless function
```

### Production Optimizations
In `vite.config.ts`, add:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
```

---

## 📞 Support & Resources

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Vite Deployment:** [vitejs.dev/guide/static-deploy](https://vitejs.dev/guide/static-deploy.html)
- **Supabase + Vercel:** [supabase.com/docs/guides/hosting/vercel](https://supabase.com/docs/guides/hosting/vercel)

---

## 🎯 Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Push code to GitHub
git add .
git commit -m "Your message"
git push origin main

# Check git status
git status

# View remote URL
git remote -v
```

---

## ✨ Testing Checklist

After deployment, test these features:

- [ ] User registration and login
- [ ] Admin login (notsahil@gmail.com)
- [ ] Offer18 integration (offers loading)
- [ ] Cashback tracking (click tracking)
- [ ] User dashboard
- [ ] Admin panel
- [ ] Responsive design (mobile/tablet)
- [ ] All navigation routes

---

**🎉 Your cashback tracking platform is now live!**

Your deployment URL: `https://[your-project-name].vercel.app`
