-- Fix security linter issues
-- 1. Fix function search path for security
CREATE OR REPLACE FUNCTION public.update_profile_subscription()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Update the updated_at timestamp when subscription fields change
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Update other functions to have proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_protection_status(job_id uuid)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  before_count INTEGER;
  progress_count INTEGER;
  after_count INTEGER;
  approval_count INTEGER;
  blockchain_verified_count INTEGER;
  total_evidence_count INTEGER;
  blockchain_bonus INTEGER := 0;
  total_score INTEGER := 0;
BEGIN
  -- Count evidence types and blockchain verification
  SELECT 
    COALESCE(SUM(CASE WHEN evidence_type = 'before' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN evidence_type = 'progress' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN evidence_type = 'after' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN evidence_type = 'approval' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN blockchain_timestamp IS NOT NULL THEN 1 ELSE 0 END), 0),
    COUNT(*)
  INTO before_count, progress_count, after_count, approval_count, blockchain_verified_count, total_evidence_count
  FROM public.evidence_items
  WHERE evidence_items.job_id = calculate_protection_status.job_id;
  
  -- Calculate base protection score (out of 80)
  -- Before photos: 20 points (max 1)
  total_score := total_score + LEAST(before_count * 20, 20);
  
  -- Progress photos: 20 points (max 5 photos, 4 points each)
  total_score := total_score + LEAST(progress_count * 4, 20);
  
  -- After photos: 20 points (max 1)
  total_score := total_score + LEAST(after_count * 20, 20);
  
  -- Client approvals: 20 points (max 1)
  total_score := total_score + LEAST(approval_count * 20, 20);
  
  -- Blockchain verification bonus (up to 20 points)
  -- If all evidence is blockchain verified, get full 20 points
  -- If some evidence is verified, get proportional bonus
  IF total_evidence_count > 0 THEN
    blockchain_bonus := LEAST((blockchain_verified_count * 20) / total_evidence_count, 20);
  END IF;
  
  total_score := total_score + blockchain_bonus;
  
  RETURN LEAST(total_score, 100);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_job_protection_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.jobs 
  SET protection_status = public.calculate_protection_status(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.job_id
      ELSE NEW.job_id
    END
  )
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.job_id
    ELSE NEW.job_id
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;