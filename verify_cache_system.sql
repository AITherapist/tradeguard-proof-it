-- Verification script to test the cache system with your existing storage_usage table
-- Run this after applying the migration to verify everything works

-- Test 1: Check if the storage_usage table has the required structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'storage_usage' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 2: Check if the cache functions exist
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'refresh_storage_usage_cache',
    'invalidate_storage_usage_cache', 
    'get_user_storage_usage',
    'handle_storage_change'
  );

-- Test 2b: Verify get_user_storage_usage function signature
SELECT 
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters 
WHERE specific_name IN (
  SELECT specific_name 
  FROM information_schema.routines 
  WHERE routine_name = 'get_user_storage_usage' 
    AND routine_schema = 'public'
)
ORDER BY ordinal_position;

-- Test 3: Check if triggers are installed
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'storage_objects_change_trigger';

-- Test 4: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'storage_usage';

-- Test 5: Test the cache functions (replace with a real user_id from your app)
-- Uncomment and replace 'your-user-id-here' with an actual user_id from your profiles table
/*
DO $$
DECLARE
  test_user_id UUID;
  cache_result RECORD;
BEGIN
  -- Get a test user_id from your profiles table
  SELECT user_id INTO test_user_id FROM profiles LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test cache refresh
    PERFORM public.refresh_storage_usage_cache(test_user_id);
    RAISE NOTICE 'Cache refresh test: SUCCESS';
    
    -- Test cache retrieval
    SELECT * INTO cache_result
    FROM public.get_user_storage_usage(test_user_id);
    
    RAISE NOTICE 'Cache retrieval test: SUCCESS - Total size: % bytes', cache_result.total_size_bytes;
  ELSE
    RAISE NOTICE 'No users found in profiles table - cannot test cache functions';
  END IF;
END $$;
*/
