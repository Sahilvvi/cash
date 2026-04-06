-- Run this in your Supabase SQL Editor to fix the schema mismatch identified by diagnostics
ALTER TABLE stores ADD COLUMN IF NOT EXISTS network_type text;
