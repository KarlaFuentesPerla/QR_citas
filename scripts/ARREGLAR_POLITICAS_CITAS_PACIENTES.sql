-- Script completo para arreglar las políticas RLS para que los pacientes puedan crear citas
-- Ejecuta este script en Supabase SQL Editor

-- 1. Verificar políticas actuales
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;

-- 2. Asegurar que la política de INSERT para pacientes existe
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;

CREATE POLICY "Users can create own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Asegurar que la política de SELECT para ver horarios ocupados existe
DROP POLICY IF EXISTS "Users can view all appointments for availability" ON public.appointments;

CREATE POLICY "Users can view all appointments for availability" ON public.appointments
  FOR SELECT USING (true);

-- 4. Verificar que las políticas fueron creadas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Permite ver citas'
    WHEN cmd = 'INSERT' THEN 'Permite crear citas'
    WHEN cmd = 'UPDATE' THEN 'Permite actualizar citas'
    ELSE cmd
  END AS descripcion
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;

