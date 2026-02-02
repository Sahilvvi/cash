# Quick Push to GitHub Script
# Replace YOUR_USERNAME and YOUR_REPO with your actual GitHub username and repository name

Write-Host "🚀 Pushing code to GitHub..." -ForegroundColor Cyan
Write-Host ""

# Check if remote already exists
$remoteExists = git remote | Select-String -Pattern "origin"

if (-not $remoteExists) {
    Write-Host "⚙️  Setting up GitHub remote..." -ForegroundColor Yellow
    Write-Host "📝 Please enter your GitHub repository URL (e.g., https://github.com/username/repo.git):" -ForegroundColor Yellow
    $repoUrl = Read-Host
    
    git remote add origin $repoUrl
    Write-Host "✅ Remote added successfully!" -ForegroundColor Green
}

# Push to GitHub
Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan

git branch -M main
git push -u origin main

Write-Host ""
Write-Host "✅ Code pushed successfully!" -ForegroundColor Green
Write-Host "🌐 Next step: Deploy to Vercel (check VERCEL_DEPLOYMENT_GUIDE.md)" -ForegroundColor Cyan
