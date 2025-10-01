-- Add unique constraint to prevent duplicate user records
ALTER TABLE public.storage_usage 
ADD CONSTRAINT unique_storage_usage_user_id UNIQUE (user_id);

-- Update the storage_usage table to have proper constraints
ALTER TABLE public.storage_usage 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_storage_usage_user_id_updated ON public.storage_usage(user_id, updated_at DESC);