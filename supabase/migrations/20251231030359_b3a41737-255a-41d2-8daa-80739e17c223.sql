-- Create subcategories table
CREATE TABLE public.subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  icon text DEFAULT 'tag'::text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Subcategories are viewable by everyone"
ON public.subcategories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage subcategories"
ON public.subcategories
FOR ALL
USING (is_admin(auth.uid()));

-- Add subcategory_id to stores, deals, and gift_cards
ALTER TABLE public.stores ADD COLUMN subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL;
ALTER TABLE public.deals ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.deals ADD COLUMN subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL;
ALTER TABLE public.gift_cards ADD COLUMN subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Add category_id to stores (currently using text)
ALTER TABLE public.stores ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create admin-images bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('admin-images', 'admin-images', true);

-- Storage policies for admin-images bucket
CREATE POLICY "Admin images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'admin-images');

CREATE POLICY "Admins can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'admin-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'admin-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'admin-images' AND is_admin(auth.uid()));