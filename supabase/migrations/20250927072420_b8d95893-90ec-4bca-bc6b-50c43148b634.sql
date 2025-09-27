-- Fix subscription status refresh and add custom job type support
-- First, let's add a custom_job_type field to jobs table
ALTER TABLE jobs ADD COLUMN custom_job_type TEXT;

-- Update the job_type enum to ensure proper options
-- Note: Postgres doesn't allow adding to enums easily, so we'll work with what we have

-- Add a trigger to update profiles when subscription status changes
CREATE OR REPLACE FUNCTION update_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp when subscription fields change
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_subscription_trigger
  BEFORE UPDATE OF subscription_id, subscription_status, customer_id
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_subscription();