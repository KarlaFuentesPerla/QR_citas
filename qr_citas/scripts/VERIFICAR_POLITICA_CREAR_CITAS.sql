-- Script para verificar y crear la política "Admins can create appointments"
-- Ejecuta este script en Supabase SQL Editor si tienes problemas al crear citas

-- Primero, verificar si la política existe
DO $$
BEGIN
  -- Eliminar la política si existe (para recrearla)
  DROP POLICY IF EXISTS "Admins can create appointments" ON public.appointments;
  
  -- Crear la política
  CREATE POLICY "Admins can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
      )
    );
  
  RAISE NOTICE 'Política "Admins can create appointments" creada exitosamente.';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error al crear la política: %', SQLERRM;
END $$;

-- Verificar que la política fue creada
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'appointments' 
  AND policyname = 'Admins can create appointments';

-- Si la consulta anterior no devuelve resultados, la política no se creó correctamente
-- Verifica que:
-- 1. Tienes permisos de administrador en Supabase
-- 2. La tabla appointments existe
-- 3. La tabla admin_users existe y tiene tu user_id

