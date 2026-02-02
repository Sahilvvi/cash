-- Migration: Add notsahil@gmail.com as admin
-- Created: 2026-01-31 15:54:00

-- This migration will add notsahil@gmail.com as an admin user
-- IMPORTANT: The user must sign up first at /auth before running this migration

-- Add notsahil@gmail.com to admin_users table
-- This will only work AFTER the user has signed up
INSERT INTO admin_users (user_id)
SELECT id 
FROM auth.users 
WHERE email = 'notsahil@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify the admin was added
SELECT 
  u.email,
  u.created_at as signed_up_at,
  au.created_at as made_admin_at,
  CASE 
    WHEN au.user_id IS NOT NULL THEN 'Admin access granted ✓'
    ELSE 'User not found - please sign up first'
  END as status
FROM auth.users u
LEFT JOIN admin_users au ON au.user_id = u.id
WHERE u.email = 'notsahil@gmail.com';
