-- Script para SOLUCIONAR el problema de RLS con admin_users
-- Este script corrige la recursión infinita en las políticas RLS
-- Ejecuta esto en Supabase SQL Editor

-- Primero, deshabilitar RLS temporalmente para poder modificar las políticas
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;

-- Política SIMPLE: Los usuarios pueden verificar si ELLOS MISMOS son administradores
-- Esta es la política principal que evita la recursión infinita
-- Solo permite verificar tu propio estado, no el de otros
CREATE POLICY "Users can check own admin status" ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- Rehabilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Verificar que la política funciona
-- Esta consulta debería funcionar ahora para cualquier usuario autenticado verificando su propio estado
SELECT 
  au.id,
  au.user_id,
  au.created_at
FROM public.admin_users au
WHERE au.user_id = auth.uid();

