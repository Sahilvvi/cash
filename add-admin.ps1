# Add Admin User Script
# Run this after notsahil@gmail.com has signed up

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Adding notsahil@gmail.com as Admin" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "IMPORTANT: Make sure notsahil@gmail.com has signed up first!" -ForegroundColor Yellow
Write-Host "Go to: http://localhost:8080/auth and create account" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key once signup is complete..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Running migration..." -ForegroundColor Green

# Run the migration
$migrationFile = "supabase\migrations\20260131095400_add_notsahil_admin.sql"

if (Test-Path $migrationFile) {
    Write-Host "Migration file found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "OPTION 1: Using Supabase CLI (if installed)" -ForegroundColor Cyan
    Write-Host "Run: supabase db reset" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTION 2: Manual SQL (Recommended)" -ForegroundColor Cyan
    Write-Host "1. Open: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql" -ForegroundColor White
    Write-Host "2. Copy and paste the SQL from: $migrationFile" -ForegroundColor White
    Write-Host "3. Click 'Run'" -ForegroundColor White
    Write-Host ""
    Write-Host "Opening SQL file content..." -ForegroundColor Green
    Write-Host ""
    Get-Content $migrationFile | Write-Host -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Copy the above SQL and run it in Supabase SQL Editor" -ForegroundColor Cyan
} else {
    Write-Host "Migration file not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "After running the SQL:" -ForegroundColor Green
Write-Host "1. Go to: http://localhost:8080/admin" -ForegroundColor White
Write-Host "2. Login with: notsahil@gmail.com" -ForegroundColor White
Write-Host "3. You should see the admin dashboard!" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
