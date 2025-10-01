-- Add billing popup tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN billing_popup_dismissed BOOLEAN DEFAULT FALSE,
ADD COLUMN billing_popup_shown_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN billing_setup_completed BOOLEAN DEFAULT FALSE;
