-- Replace the problematic function with a safer version
CREATE OR REPLACE FUNCTION public.calculate_user_storage_usage(p_user_id UUID)
RETURNS TABLE(
  total_size_bytes BIGINT,
  evidence_size_bytes BIGINT,
  reports_size_bytes BIGINT,
  file_count INTEGER
) AS $$
DECLARE
  evidence_size BIGINT := 0;
  reports_size BIGINT := 0;
  total_files INTEGER := 0;
BEGIN
  -- Calculate evidence storage usage with better error handling
  BEGIN
    SELECT 
      COALESCE(SUM(COALESCE((metadata->>'size')::BIGINT, 0)), 0),
      COUNT(*)
    INTO evidence_size, total_files
    FROM storage.objects 
    WHERE bucket_id = 'evidence' 
      AND name LIKE p_user_id::text || '/%';
  EXCEPTION
    WHEN OTHERS THEN
      evidence_size := 0;
      total_files := 0;
  END;
  
  -- Calculate reports storage usage with better error handling
  BEGIN
    SELECT 
      COALESCE(SUM(COALESCE((metadata->>'size')::BIGINT, 0)), 0)
    INTO reports_size
    FROM storage.objects 
    WHERE bucket_id = 'reports' 
      AND name LIKE p_user_id::text || '/%';
  EXCEPTION
    WHEN OTHERS THEN
      reports_size := 0;
  END;
  
  -- Add reports file count
  total_files := total_files + (
    SELECT COUNT(*) 
    FROM storage.objects 
    WHERE bucket_id = 'reports' 
      AND name LIKE p_user_id::text || '/%'
  );
  
  RETURN QUERY SELECT 
    evidence_size + reports_size,
    evidence_size,
    reports_size,
    total_files;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;