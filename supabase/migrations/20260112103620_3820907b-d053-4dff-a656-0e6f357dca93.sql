-- Create sponsors table
CREATE TABLE public.sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Public can view active sponsors
CREATE POLICY "Sponsors are viewable by everyone" 
ON public.sponsors 
FOR SELECT 
USING (is_active = true);

-- Admins can manage sponsors
CREATE POLICY "Admins can manage sponsors" 
ON public.sponsors 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_sponsors_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();