# 🎯 Quick Start: Push Code & Deploy to Vercel

## ⚡ TL;DR - 5 Minute Deployment

### Step 1: Create GitHub Repository (2 minutes)
1. Go to https://github.com/new
2. Repository name: `cashback-tracking-platform`
3. Choose **Public** or **Private**
4. **Do NOT check** any boxes (no README, .gitignore, license)
5. Click **Create repository**
6. **Copy the repository URL** (e.g., `https://github.com/yourusername/cashback-tracking-platform.git`)

### Step 2: Push Your Code (1 minute)

Run these commands in PowerShell (in your project directory):

```powershell
# Add your GitHub repository (replace with YOUR URL from Step 1)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push code
git branch -M main
git push -u origin main
```

**OR** use the automated script:
```powershell
.\push-to-github.ps1
```

### Step 3: Deploy to Vercel (2 minutes)
1. Go to https://vercel.com
2. Click **Sign Up** → **Continue with GitHub**
3. Click **Add New** → **Project**
4. Select your repository → **Import**
5. Add environment variables:
   - `VITE_SUPABASE_PROJECT_ID` = `rmdmcfgifglvtpbmcxov`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZG1jZmdpZmdsdnRwYm1jeG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzg0NzEsImV4cCI6MjA4MjcxNDQ3MX0.LYt63L0FF-QO3rUFNMsm1kNCHEWOZM7dXKhyGmNuZVA`
   - `VITE_SUPABASE_URL` = `https://rmdmcfgifglvtpbmcxov.supabase.co`
   - `VITE_OFFER18_API_KEY` = `81ad73157134a49e6ec27cc8daaed65d`
   - `VITE_OFFER18_AFFILIATE_ID` = `744826`
   - `VITE_OFFER18_MERCHANT_ID` = `1446`
6. Click **Deploy**
7. Wait 2-3 minutes ⏱️
8. **Done!** 🎉 Your app is live at `https://your-project.vercel.app`

---

## 📋 Detailed Instructions

### Option A: Manual Commands

```powershell
# 1. Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 2. Rename branch to main
git branch -M main

# 3. Push to GitHub
git push -u origin main
```

### Option B: Use the Script

```powershell
# Run the automated script
.\push-to-github.ps1
```

---

## 🔑 Environment Variables for Vercel

Copy and paste these into Vercel's Environment Variables section:

**Name:** `VITE_SUPABASE_PROJECT_ID`  
**Value:** `rmdmcfgifglvtpbmcxov`

**Name:** `VITE_SUPABASE_PUBLISHABLE_KEY`  
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZG1jZmdpZmdsdnRwYm1jeG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzg0NzEsImV4cCI6MjA4MjcxNDQ3MX0.LYt63L0FF-QO3rUFNMsm1kNCHEWOZM7dXKhyGmNuZVA`

**Name:** `VITE_SUPABASE_URL`  
**Value:** `https://rmdmcfgifglvtpbmcxov.supabase.co`

**Name:** `VITE_OFFER18_API_KEY`  
**Value:** `81ad73157134a49e6ec27cc8daaed65d`

**Name:** `VITE_OFFER18_AFFILIATE_ID`  
**Value:** `744826`

**Name:** `VITE_OFFER18_MERCHANT_ID`  
**Value:** `1446`

> **Important:** Set these for all environments (Production, Preview, Development)

---

## 🐛 Troubleshooting

### Issue: "Authentication failed"
**Solution:** Use a GitHub Personal Access Token instead of your password
1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Classic**
3. Select scopes: `repo` (all)
4. Click **Generate token**
5. Copy the token
6. Use it as your password when pushing

### Issue: "Remote already exists"
```powershell
# Remove existing remote and add new one
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Issue: Build fails on Vercel
**Solution:** Test build locally first
```powershell
npm run build
```
Fix any errors, commit, and push again.

---

## ✅ After Deployment Checklist

Test these features on your live Vercel URL:

- [ ] Homepage loads
- [ ] Login/Signup works
- [ ] Dashboard shows correctly
- [ ] Offer18 offers are loading
- [ ] Admin panel accessible (notsahil@gmail.com)
- [ ] Click tracking works
- [ ] Responsive on mobile
- [ ] All routes work (no 404s)

---

## 🔄 Future Updates

After initial deployment, updating is easy:

```powershell
# Make changes to code
# Then:
git add .
git commit -m "Your update description"
git push origin main
```

Vercel automatically deploys every push! 🚀

---

## 📚 Full Documentation

For detailed information, see:
- **Vercel specifics:** `VERCEL_DEPLOYMENT_GUIDE.md`
- **Offer18 setup:** `OFFER18_INTEGRATION_GUIDE.md`
- **Admin access:** `ADMIN_SETUP_COMPLETE.md`

---

**Need help?** Check the full guide in `VERCEL_DEPLOYMENT_GUIDE.md`
