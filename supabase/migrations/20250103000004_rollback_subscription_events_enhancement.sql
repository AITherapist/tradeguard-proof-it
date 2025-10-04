-- Rollback Migration: Revert subscription_events table enhancements
-- This migration safely removes all additions made by the subscription events enhancement
-- Uses conditional logic to avoid errors if columns/functions don't exist

-- Drop the trigger first (if it exists)
DROP TRIGGER IF EXISTS subscription_status_change_trigger ON public.profiles;

-- Drop the trigger function (if it exists)
DROP FUNCTION IF EXISTS public.log_subscription_status_change();

-- Drop the custom functions (if they exist)
DROP FUNCTION IF EXISTS public.log_subscription_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_subscription_analytics(UUID);
DROP FUNCTION IF EXISTS public.get_subscription_status_history(UUID);

-- Drop the indexes (if they exist)
DROP INDEX IF EXISTS idx_subscription_events_stripe_event_id;
DROP INDEX IF EXISTS idx_subscription_events_event_type;
DROP INDEX IF EXISTS idx_subscription_events_user_id_created;

-- Safely remove the added columns (only if they exist)
DO $$ 
BEGIN
    -- Check and drop event_data column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_events' 
        AND column_name = 'event_data' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.subscription_events DROP COLUMN event_data;
    END IF;
    
    -- Check and drop source column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_events' 
        AND column_name = 'source' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.subscription_events DROP COLUMN source;
    END IF;
    
    -- Check and drop processed_at column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_events' 
        AND column_name = 'processed_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.subscription_events DROP COLUMN processed_at;
    END IF;
END $$;

-- Remove comments (only if they exist)
DO $$
BEGIN
    -- Only remove comments if the columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_events' 
        AND column_name = 'event_data' 
        AND table_schema = 'public'
    ) THEN
        COMMENT ON COLUMN public.subscription_events.event_data IS NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_events' 
        AND column_name = 'source' 
        AND table_schema = 'public'
    ) THEN
        COMMENT ON COLUMN public.subscription_events.source IS NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_events' 
        AND column_name = 'processed_at' 
        AND table_schema = 'public'
    ) THEN
        COMMENT ON COLUMN public.subscription_events.processed_at IS NULL;
    END IF;
END $$;

-- Verify the table structure
-- The subscription_events table should now only have the original columns:
-- id, user_id, stripe_event_id, event_type, subscription_id, previous_status, new_status, created_at
