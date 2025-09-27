-- Add missing enum value for trialing status
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'trialing';