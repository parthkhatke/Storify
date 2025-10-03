-- Create OTP verifications table
CREATE TABLE public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to create OTP verifications
CREATE POLICY "Anyone can create OTP verifications"
ON public.otp_verifications
FOR INSERT
WITH CHECK (true);

-- Create policy to allow reading OTP verifications (for verification process)
CREATE POLICY "Anyone can read OTP verifications"
ON public.otp_verifications
FOR SELECT
USING (true);

-- Create policy to allow updating OTP verifications (for marking as verified)
CREATE POLICY "Anyone can update OTP verifications"
ON public.otp_verifications
FOR UPDATE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_otp_verifications_email_code ON public.otp_verifications(email, otp_code);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);
CREATE INDEX idx_otp_verifications_verified ON public.otp_verifications(verified);