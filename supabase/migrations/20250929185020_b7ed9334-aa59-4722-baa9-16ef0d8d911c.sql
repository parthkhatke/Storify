-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
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

-- Create files table for metadata
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create policies for files
CREATE POLICY "Users can view their own files" 
ON public.files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files" 
ON public.files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" 
ON public.files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" 
ON public.files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for encrypted files
INSERT INTO storage.buckets (id, name, public) VALUES ('encrypted-files', 'encrypted-files', false);

-- Create storage policies for encrypted files
CREATE POLICY "Users can view their own encrypted files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'encrypted-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own encrypted files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'encrypted-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own encrypted files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'encrypted-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own encrypted files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'encrypted-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();