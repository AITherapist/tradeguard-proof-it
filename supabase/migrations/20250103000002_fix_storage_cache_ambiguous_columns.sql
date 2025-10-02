-- Fix ambiguous column reference in get_user_storage_usage function
-- This migration fixes the "column reference is ambiguous" error

-- Drop and recreate the function with proper column aliases
DROP FUNCTION IF EXISTS public.get_user_storage_usage(UUID);

CREATE OR REPLACE FUNCTION public.get_user_storage_usage(p_user_id UUID)
RETURNS TABLE(
  total_size_bytes BIGINT,
  evidence_size_bytes BIGINT,
  reports_size_bytes BIGINT,
  file_count INTEGER,
  is_cached BOOLEAN,
  last_calculated_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  cached_data RECORD;
  calculated_data RECORD;
BEGIN
  -- Try to get cached data with explicit table aliases
  SELECT 
    su.total_size_bytes,
    su.evidence_size_bytes,
    su.reports_size_bytes,
    su.file_count,
    su.last_calculated_at
  INTO cached_data
  FROM public.storage_usage su
  WHERE su.user_id = p_user_id;
  
  -- If cached data exists and is recent (within 5 minutes), return it
  IF cached_data IS NOT NULL AND 
     cached_data.last_calculated_at > (now() - interval '5 minutes') THEN
    RETURN QUERY SELECT 
      cached_data.total_size_bytes,
      cached_data.evidence_size_bytes,
      cached_data.reports_size_bytes,
      cached_data.file_count,
      true as is_cached,
      cached_data.last_calculated_at;
  ELSE
    -- Calculate fresh data using the existing function with explicit aliases
    SELECT 
      calc.total_size_bytes,
      calc.evidence_size_bytes,
      calc.reports_size_bytes,
      calc.file_count
    INTO calculated_data
    FROM public.calculate_user_storage_usage(p_user_id) calc;
    
    -- Update cache with fresh data
    PERFORM public.refresh_storage_usage_cache(p_user_id);
    
    RETURN QUERY SELECT 
      calculated_data.total_size_bytes,
      calculated_data.evidence_size_bytes,
      calculated_data.reports_size_bytes,
      calculated_data.file_count,
      false as is_cached,
      now() as last_calculated_at;
  END IF;
END;
$$;
