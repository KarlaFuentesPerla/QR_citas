-- Script para verificar y crear la política que permite a los pacientes crear citas
-- Ejecuta este script en Supabase SQL Editor

-- Verificar si la política existe
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
  AND policyname = 'Users can create own appointments';

-- Si la consulta anterior no devuelve resultados, crear la política:
-- (Descomentar las siguientes líneas si es necesario)

/*
-- Eliminar la política si existe (para recrearla)
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;

-- Crear la política que permite a los usuarios crear sus propias citas
CREATE POLICY "Users can create own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
*/

-- Verificar que la política fue creada
-- Ejecuta nuevamente la primera consulta SELECT para confirmar

