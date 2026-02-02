-- Drop existing restrictive SELECT policies and recreate as PERMISSIVE
-- This allows EITHER condition to pass (admins OR public active stores)

-- Stores table
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON public.stores;
DROP POLICY IF EXISTS "Admins can view all stores" ON public.stores;

-- Recreate as PERMISSIVE (default) - either condition will allow access
CREATE POLICY "Stores are viewable by everyone" 
ON public.stores 
FOR SELECT 
TO public
USING (is_active = true);

CREATE POLICY "Admins can view all stores" 
ON public.stores 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

-- Same fix for deals
DROP POLICY IF EXISTS "Active deals are viewable by everyone" ON public.deals;
DROP POLICY IF EXISTS "Admins can view all deals" ON public.deals;

CREATE POLICY "Active deals are viewable by everyone" 
ON public.deals 
FOR SELECT 
TO public
USING (is_active = true);

CREATE POLICY "Admins can view all deals" 
ON public.deals 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));