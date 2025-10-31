-- Verification Script for Voting Feature Setup
-- Run this in Supabase SQL Editor to check if migrations 004 and 005 are applied

-- Check 1: Does the votes table exist?
SELECT
  'votes table' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'votes'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - Apply migration 004'
  END AS status;

-- Check 2: Does the vote_count column exist in feedback table?
SELECT
  'vote_count column' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'feedback'
        AND column_name = 'vote_count'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - Apply migration 004'
  END AS status;

-- Check 3: Does the vote count trigger exist?
SELECT
  'vote count trigger' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name = 'trigger_update_vote_count'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - Apply migration 004'
  END AS status;

-- Check 4: Does the trigger function exist?
SELECT
  'vote count function' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'update_feedback_vote_count'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - Apply migration 004'
  END AS status;

-- Check 5: Is RLS enabled on votes table?
SELECT
  'votes RLS enabled' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = 'votes'
        AND rowsecurity = true
    ) THEN '✅ ENABLED'
    WHEN EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = 'votes'
    ) THEN '⚠️ TABLE EXISTS BUT RLS DISABLED - Apply migration 005'
    ELSE '❌ TABLE MISSING - Apply migration 004 first'
  END AS status;

-- Check 6: Count RLS policies on votes table
SELECT
  'votes RLS policies' AS check_name,
  CASE
    WHEN (
      SELECT COUNT(*) FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'votes'
    ) >= 3 THEN '✅ ' || (
      SELECT COUNT(*)::text FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'votes'
    ) || ' POLICIES FOUND'
    WHEN (
      SELECT COUNT(*) FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'votes'
    ) > 0 THEN '⚠️ ONLY ' || (
      SELECT COUNT(*)::text FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'votes'
    ) || ' POLICIES - Should have 3 (Apply migration 005)'
    ELSE '❌ NO POLICIES - Apply migration 005'
  END AS status;

-- Summary: Show all policy names for votes table
SELECT
  policyname AS policy_name,
  cmd AS command
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'votes'
ORDER BY policyname;

-- Additional Info: Show sample feedback with vote counts
SELECT
  f.id,
  f.title,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'feedback' AND column_name = 'vote_count'
    )
    THEN f.vote_count
    ELSE NULL
  END AS vote_count,
  (SELECT COUNT(*) FROM votes WHERE feedback_id = f.id) AS actual_vote_count
FROM feedback f
LIMIT 5;
