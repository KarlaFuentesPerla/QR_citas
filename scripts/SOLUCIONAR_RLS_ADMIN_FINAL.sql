-- Script FINAL para SOLUCIONAR el problema de recursión infinita en RLS
-- Ejecuta esto en Supabase SQL Editor

-- Paso 1: Deshabilitar RLS temporalmente
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar TODAS las políticas existentes (esto elimina la recursión)
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;

-- Paso 3: Crear SOLO una política simple que no cause recursión
-- Esta política permite que cualquier usuario autenticado verifique si ÉL MISMO es admin
-- No consulta admin_users dentro de la política, evitando la recursión
CREATE POLICY "Users can check own admin status" ON public.admin_users
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Paso 4: Rehabilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Paso 5: Verificar que funciona
-- Esta consulta debería funcionar para cualquier usuario autenticado
SELECT 
  'Verificación exitosa' as resultado,
  au.id,
  au.user_id,
  au.created_at
FROM public.admin_users au
WHERE au.user_id = auth.uid();

