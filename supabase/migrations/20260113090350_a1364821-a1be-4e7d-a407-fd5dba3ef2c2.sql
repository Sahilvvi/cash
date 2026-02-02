-- Drop existing restrictive policies and recreate as permissive
-- This allows admins to see ALL stores (including inactive ones)

-- Stores table
DROP POLICY IF EXISTS "Admins can manage stores" ON public.stores;
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON public.stores;

CREATE POLICY "Stores are viewable by everyone" 
ON public.stores 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all stores" 
ON public.stores 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert stores" 
ON public.stores 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update stores" 
ON public.stores 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete stores" 
ON public.stores 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Deals table (same fix)
DROP POLICY IF EXISTS "Admins can manage deals" ON public.deals;
DROP POLICY IF EXISTS "Active deals are viewable by everyone" ON public.deals;

CREATE POLICY "Active deals are viewable by everyone" 
ON public.deals 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all deals" 
ON public.deals 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert deals" 
ON public.deals 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update deals" 
ON public.deals 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete deals" 
ON public.deals 
FOR DELETE 
USING (is_admin(auth.uid()));