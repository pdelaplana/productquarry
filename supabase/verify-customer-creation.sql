-- Test script to verify customer creation logic
-- Run this after the fix to confirm voting users don't create customer accounts

-- 1. Check the updated trigger function
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';

-- 2. Verify trigger is active
SELECT
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

-- 3. Count existing customers
SELECT
  COUNT(*) as total_customers,
  COUNT(DISTINCT email) as unique_emails
FROM customers;

-- 4. Check for auth users without customer records
-- (These would be voting users after the fix)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'name' as metadata_name,
  CASE
    WHEN c.id IS NULL THEN 'No customer record'
    ELSE 'Has customer record'
  END as customer_status
FROM auth.users au
LEFT JOIN customers c ON au.id = c.id
ORDER BY au.created_at DESC
LIMIT 10;
