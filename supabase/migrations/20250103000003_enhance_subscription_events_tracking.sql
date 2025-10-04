-- Migration: Enhance subscription_events table for comprehensive tracking
-- This migration adds additional columns and indexes to support better subscription management

-- Add new columns to subscription_events table for enhanced tracking
ALTER TABLE public.subscription_events 
ADD COLUMN IF NOT EXISTS event_data JSONB,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id_created 
ON public.subscription_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type 
ON public.subscription_events(event_type);

CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe_event_id 
ON public.subscription_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- Add function to get subscription status history
CREATE OR REPLACE FUNCTION public.get_subscription_status_history(p_user_id UUID)
RETURNS TABLE (
  event_type TEXT,
  previous_status TEXT,
  new_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  stripe_event_id TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    se.event_type,
    se.previous_status,
    se.new_status,
    se.created_at,
    se.stripe_event_id
  FROM public.subscription_events se
  WHERE se.user_id = p_user_id
  ORDER BY se.created_at DESC;
$$;

-- Add function to get subscription analytics
CREATE OR REPLACE FUNCTION public.get_subscription_analytics(p_user_id UUID)
RETURNS TABLE (
  total_events BIGINT,
  events_by_type JSONB,
  events_by_status JSONB,
  recent_activity BIGINT,
  payment_success_rate NUMERIC
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  WITH event_stats AS (
    SELECT 
      COUNT(*) as total_events,
      jsonb_object_agg(event_type, event_count) as events_by_type,
      jsonb_object_agg(new_status, status_count) as events_by_status
    FROM (
      SELECT 
        event_type,
        new_status,
        COUNT(*) as event_count,
        COUNT(*) as status_count
      FROM public.subscription_events 
      WHERE user_id = p_user_id
      GROUP BY event_type, new_status
    ) stats
  ),
  recent_activity AS (
    SELECT COUNT(*) as recent_count
    FROM public.subscription_events 
    WHERE user_id = p_user_id 
    AND created_at >= NOW() - INTERVAL '30 days'
  ),
  payment_stats AS (
    SELECT 
      COUNT(*) as total_payments,
      COUNT(*) FILTER (WHERE event_type = 'invoice.payment_succeeded') as successful_payments
    FROM public.subscription_events 
    WHERE user_id = p_user_id 
    AND event_type LIKE '%payment%'
  )
  SELECT 
    es.total_events,
    es.events_by_type,
    es.events_by_status,
    ra.recent_count as recent_activity,
    CASE 
      WHEN ps.total_payments > 0 
      THEN (ps.successful_payments::NUMERIC / ps.total_payments::NUMERIC) * 100
      ELSE 0 
    END as payment_success_rate
  FROM event_stats es, recent_activity ra, payment_stats ps;
$$;

-- Add function to log subscription events (for use in edge functions)
CREATE OR REPLACE FUNCTION public.log_subscription_event(
  p_user_id UUID,
  p_stripe_event_id TEXT,
  p_event_type TEXT,
  p_subscription_id TEXT DEFAULT NULL,
  p_previous_status TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.subscription_events (
    user_id,
    stripe_event_id,
    event_type,
    subscription_id,
    previous_status,
    new_status,
    event_data,
    created_at
  ) VALUES (
    p_user_id,
    p_stripe_event_id,
    p_event_type,
    p_subscription_id,
    p_previous_status,
    p_new_status,
    p_event_data,
    now()
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Add RLS policy for subscription events analytics
CREATE POLICY "Users can view their own subscription events" 
ON public.subscription_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add trigger to automatically log subscription status changes
CREATE OR REPLACE FUNCTION public.log_subscription_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if subscription_status actually changed
  IF OLD.subscription_status IS DISTINCT FROM NEW.subscription_status THEN
    INSERT INTO public.subscription_events (
      user_id,
      event_type,
      previous_status,
      new_status,
      event_data,
      created_at
    ) VALUES (
      NEW.user_id,
      'subscription.status_changed',
      OLD.subscription_status,
      NEW.subscription_status,
      jsonb_build_object(
        'trigger', 'database_trigger',
        'updated_at', NEW.updated_at
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic subscription status change logging
DROP TRIGGER IF EXISTS subscription_status_change_trigger ON public.profiles;
CREATE TRIGGER subscription_status_change_trigger
  AFTER UPDATE OF subscription_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_subscription_status_change();

-- Add comments for documentation
COMMENT ON TABLE public.subscription_events IS 'Tracks all subscription-related events and status changes';
COMMENT ON COLUMN public.subscription_events.event_data IS 'Additional event-specific data in JSON format';
COMMENT ON COLUMN public.subscription_events.source IS 'Source of the event (stripe, manual, system)';
COMMENT ON COLUMN public.subscription_events.processed_at IS 'When the event was processed by the system';

COMMENT ON FUNCTION public.get_subscription_status_history(UUID) IS 'Returns subscription status history for a user';
COMMENT ON FUNCTION public.get_subscription_analytics(UUID) IS 'Returns subscription analytics and statistics for a user';
COMMENT ON FUNCTION public.log_subscription_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) IS 'Logs a subscription event with all relevant data';
