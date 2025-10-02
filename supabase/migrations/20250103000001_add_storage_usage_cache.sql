-- Storage usage table already exists, just ensure it has the required structure
-- The table should already have the necessary columns and constraints

-- Ensure the table has the required columns (in case they're missing)
ALTER TABLE public.storage_usage 
ADD COLUMN IF NOT EXISTS last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Ensure RLS is enabled
ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;

-- Ensure the RLS policy exists
DROP POLICY IF EXISTS "Users can view their own storage usage" ON public.storage_usage;
CREATE POLICY "Users can view their own storage usage" 
ON public.storage_usage 
FOR SELECT 
USING (auth.uid() = user_id);

-- Function to refresh storage usage cache for a user
CREATE OR REPLACE FUNCTION public.refresh_storage_usage_cache(p_user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  usage_data RECORD;
BEGIN
  -- Calculate current storage usage
  SELECT * INTO usage_data
  FROM public.calculate_user_storage_usage(p_user_id);
  
  -- Insert or update the cache
  INSERT INTO public.storage_usage (
    user_id,
    total_size_bytes,
    evidence_size_bytes,
    reports_size_bytes,
    file_count,
    last_calculated_at,
    updated_at
  ) VALUES (
    p_user_id,
    usage_data.total_size_bytes,
    usage_data.evidence_size_bytes,
    usage_data.reports_size_bytes,
    usage_data.file_count,
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_size_bytes = EXCLUDED.total_size_bytes,
    evidence_size_bytes = EXCLUDED.evidence_size_bytes,
    reports_size_bytes = EXCLUDED.reports_size_bytes,
    file_count = EXCLUDED.file_count,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Function to invalidate storage usage cache for a user
CREATE OR REPLACE FUNCTION public.invalidate_storage_usage_cache(p_user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Delete the cached entry to force recalculation
  DELETE FROM public.storage_usage WHERE user_id = p_user_id;
END;
$$;

-- Trigger function to invalidate cache when storage objects change
CREATE OR REPLACE FUNCTION public.handle_storage_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  -- Extract user_id from the object name (format: user_id/path)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Extract user_id from the new object name
    affected_user_id := (string_to_array(NEW.name, '/'))[1]::UUID;
  ELSIF TG_OP = 'DELETE' THEN
    -- Extract user_id from the old object name
    affected_user_id := (string_to_array(OLD.name, '/'))[1]::UUID;
  END IF;
  
  -- Only invalidate if we have a valid user_id
  IF affected_user_id IS NOT NULL THEN
    PERFORM public.invalidate_storage_usage_cache(affected_user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RAISE WARNING 'Failed to invalidate storage cache: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers on storage.objects table
CREATE TRIGGER storage_objects_change_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_storage_change();

-- Function to get cached storage usage or calculate if not cached
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
  -- Try to get cached data
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
    -- Calculate fresh data using the existing function
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
