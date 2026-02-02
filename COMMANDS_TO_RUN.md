# 🚀 COPY-PASTE COMMANDS FOR DEPLOYMENT

## ⚡ Quick Commands (Copy & Run)

### 1️⃣ First: Create GitHub Repository
Go to: https://github.com/new
- Name: `cashback-tracking-platform`
- Don't check any boxes
- Click "Create repository"
- **Copy your repository URL**

---

### 2️⃣ Then: Push Your Code

**Replace `YOUR_GITHUB_URL` with the URL you copied above!**

```powershell
# Navigate to your project (if not already there)
cd "c:\Users\autiy\Downloads\remix-of-cashback-mirror-main\remix-of-cashback-mirror-main"

# Add GitHub remote (REPLACE WITH YOUR URL!)
git remote add origin https://github.com/YOUR_USERNAME/cashback-tracking-platform.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Example (replace with your actual username):**
```powershell
git remote add origin https://github.com/yourusername/cashback-tracking-platform.git
git branch -M main
git push -u origin main
```

---

### 3️⃣ Finally: Deploy on Vercel

**Go to:** https://vercel.com

**Steps:**
1. Sign up with GitHub
2. Click "Add New" → "Project"
3. Import your repository
4. Add environment variables (see below)
5. Click "Deploy"

---

## 🔑 Environment Variables for Vercel

**Copy these exactly as shown:**

**Variable 1:**
```
Name: VITE_SUPABASE_PROJECT_ID
Value: rmdmcfgifglvtpbmcxov
```

**Variable 2:**
```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZG1jZmdpZmdsdnRwYm1jeG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzg0NzEsImV4cCI6MjA4MjcxNDQ3MX0.LYt63L0FF-QO3rUFNMsm1kNCHEWOZM7dXKhyGmNuZVA
```

**Variable 3:**
```
Name: VITE_SUPABASE_URL
Value: https://rmdmcfgifglvtpbmcxov.supabase.co
```

**Variable 4:**
```
Name: VITE_OFFER18_API_KEY
Value: 81ad73157134a49e6ec27cc8daaed65d
```

**Variable 5:**
```
Name: VITE_OFFER18_AFFILIATE_ID
Value: 744826
```

**Variable 6:**
```
Name: VITE_OFFER18_MERCHANT_ID
Value: 1446
```

⚠️ **Important:** Set these for all 3 environments (Production, Preview, Development)

---

## 📋 Checklist

- [ ] Created GitHub repository
- [ ] Copied repository URL
- [ ] Ran `git remote add origin YOUR_URL`
- [ ] Ran `git push -u origin main`
- [ ] Signed up on Vercel
- [ ] Imported project from GitHub
- [ ] Added all 6 environment variables
- [ ] Clicked "Deploy"
- [ ] Waited 2-3 minutes for build
- [ ] Got live URL (e.g., `https://your-project.vercel.app`)
- [ ] Tested the live site

---

## 🎯 After Deployment

**Test these on your live URL:**
- Login/Signup
- Dashboard
- Offers loading
- Admin panel (notsahil@gmail.com)
- Mobile responsiveness

---

## 🔄 Future Updates (After First Deployment)

```powershell
# Make your code changes
# Then run:
git add .
git commit -m "Description of changes"
git push origin main
```

Vercel will automatically deploy! 🚀

---

## 🆘 Troubleshooting

### Error: "Authentication failed"
Use a GitHub Personal Access Token:
1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Select `repo` scope
4. Use token as password

### Error: "Remote already exists"
```powershell
git remote remove origin
git remote add origin YOUR_URL
git push -u origin main
```

### Build fails on Vercel
Test locally first:
```powershell
npm run build
```

---

**That's it! Your app will be live in 5 minutes! 🎉**
