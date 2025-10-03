-- Add password field to otp_verifications table
ALTER TABLE public.otp_verifications
ADD COLUMN IF NOT EXISTS password TEXT;

-- Create user_credentials table to store passwords for email-based auth
CREATE TABLE IF NOT EXISTS public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for user_credentials
CREATE POLICY "Anyone can read credentials for verification"
ON public.user_credentials
FOR SELECT
USING (true);

CREATE POLICY "Service can insert credentials"
ON public.user_credentials
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service can update credentials"
ON public.user_credentials
FOR UPDATE
USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_credentials_email ON public.user_credentials(email);