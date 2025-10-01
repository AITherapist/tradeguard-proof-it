-- Create enum types
CREATE TYPE public.job_type AS ENUM (
  'plumbing', 'electrical', 'construction', 'roofing', 'painting', 
  'flooring', 'kitchen_fitting', 'bathroom_fitting', 'heating', 'other'
);

CREATE TYPE public.evidence_type AS ENUM (
  'before', 'progress', 'after', 'defect', 'approval', 'contract', 'receipt'
);

CREATE TYPE public.subscription_status AS ENUM (
  'trial', 'active', 'past_due', 'cancelled', 'incomplete'
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  phone TEXT,
  address TEXT,
  subscription_status subscription_status DEFAULT 'trial',
  subscription_id TEXT, -- Stripe subscription ID
  customer_id TEXT, -- Stripe customer ID
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_address TEXT NOT NULL,
  client_phone TEXT,
  job_type job_type NOT NULL,
  job_description TEXT,
  contract_value DECIMAL(10,2),
  start_date DATE,
  completion_date DATE,
  protection_status INTEGER DEFAULT 0 CHECK (protection_status >= 0 AND protection_status <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evidence_items table
CREATE TABLE public.evidence_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  evidence_type evidence_type NOT NULL,
  file_path TEXT,
  file_hash TEXT, -- SHA-256 hash
  blockchain_timestamp TEXT, -- OpenTimestamps proof
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  gps_accuracy DECIMAL(8, 2),
  device_timestamp TIMESTAMP WITH TIME ZONE,
  server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT NOT NULL,
  client_approval BOOLEAN DEFAULT FALSE,
  client_signature TEXT, -- Base64 encoded signature
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription_events table for tracking subscription changes
CREATE TABLE public.subscription_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  subscription_id TEXT,
  previous_status subscription_status,
  new_status subscription_status,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for jobs
CREATE POLICY "Users can view their own jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs" 
ON public.jobs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for evidence_items
CREATE POLICY "Users can view evidence for their jobs" 
ON public.evidence_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = evidence_items.job_id 
    AND jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create evidence for their jobs" 
ON public.evidence_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = evidence_items.job_id 
    AND jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update evidence for their jobs" 
ON public.evidence_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = evidence_items.job_id 
    AND jobs.user_id = auth.uid()
  )
);

-- Create RLS policies for audit_logs
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create RLS policies for subscription_events
CREATE POLICY "Users can view their own subscription events" 
ON public.subscription_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to calculate job protection status
CREATE OR REPLACE FUNCTION public.calculate_protection_status(job_id UUID)
RETURNS INTEGER AS $$
DECLARE
  before_count INTEGER;
  progress_count INTEGER;
  after_count INTEGER;
  approval_count INTEGER;
  total_score INTEGER := 0;
BEGIN
  -- Count evidence types
  SELECT 
    COALESCE(SUM(CASE WHEN evidence_type = 'before' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN evidence_type = 'progress' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN evidence_type = 'after' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN evidence_type = 'approval' THEN 1 ELSE 0 END), 0)
  INTO before_count, progress_count, after_count, approval_count
  FROM public.evidence_items
  WHERE evidence_items.job_id = calculate_protection_status.job_id;
  
  -- Calculate protection score (out of 100)
  -- Before photos: 25 points (max 1)
  total_score := total_score + LEAST(before_count * 25, 25);
  
  -- Progress photos: 25 points (max 5 photos, 5 points each)
  total_score := total_score + LEAST(progress_count * 5, 25);
  
  -- After photos: 25 points (max 1)
  total_score := total_score + LEAST(after_count * 25, 25);
  
  -- Client approvals: 25 points (max 1)
  total_score := total_score + LEAST(approval_count * 25, 25);
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to update job protection status
CREATE OR REPLACE FUNCTION public.update_job_protection_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update protection status
CREATE TRIGGER update_protection_status_on_evidence_change
  AFTER INSERT OR UPDATE OR DELETE ON public.evidence_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_protection_status();

-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence', 
  'evidence', 
  false, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for evidence bucket
CREATE POLICY "Users can upload evidence for their jobs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view evidence for their jobs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update evidence for their jobs" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_evidence_job_id ON public.evidence_items(job_id);
CREATE INDEX idx_evidence_type ON public.evidence_items(evidence_type);
CREATE INDEX idx_evidence_created_at ON public.evidence_items(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_subscription_events_user_id ON public.subscription_events(user_id);