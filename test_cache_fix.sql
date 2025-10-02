-- Test script to verify the cache fix works
-- This script tests the get_user_storage_usage function to ensure no ambiguous column errors

-- Test 1: Check if the function exists and has the correct signature
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_user_storage_usage';

-- Test 2: Test the function with a real user (replace with actual user_id)
-- Uncomment and replace 'your-user-id-here' with an actual user_id from your profiles table
/*
DO $$
DECLARE
  test_user_id UUID;
  result RECORD;
BEGIN
  -- Get a test user_id from your profiles table
  SELECT user_id INTO test_user_id FROM profiles LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test the function
    SELECT * INTO result
    FROM public.get_user_storage_usage(test_user_id);
    
    RAISE NOTICE 'Function test: SUCCESS';
    RAISE NOTICE 'Total size: % bytes', result.total_size_bytes;
    RAISE NOTICE 'Is cached: %', result.is_cached;
    RAISE NOTICE 'Last calculated: %', result.last_calculated_at;
  ELSE
    RAISE NOTICE 'No users found in profiles table - cannot test function';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Function test: FAILED - %', SQLERRM;
END $$;
*/

-- Test 3: Check if there are any existing cache entries
SELECT 
  COUNT(*) as cache_entries,
  MIN(last_calculated_at) as oldest_cache,
  MAX(last_calculated_at) as newest_cache
FROM public.storage_usage;
