-- Script para VERIFICAR si el usuario es administrador
-- Ejecuta esto en Supabase SQL Editor para verificar el estado

-- Verificar si el usuario existe en auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'karlifuentes96@gmail.com';

-- Verificar si existe en public.users
SELECT 
  id,
  full_name,
  phone,
  created_at
FROM public.users
WHERE id = '44340dfd-dab6-4872-a9db-00d9fd907e8f';

-- Verificar si existe en admin_users (esta consulta puede fallar por RLS si no eres admin)
-- Si falla, significa que RLS está bloqueando, no que no seas admin
SELECT 
  au.id,
  au.user_id,
  au.created_at
FROM public.admin_users au
WHERE au.user_id = '44340dfd-dab6-4872-a9db-00d9fd907e8f';

-- Verificación completa con JOIN (puede fallar por RLS)
SELECT 
  au.id as admin_id,
  au.user_id,
  auth_u.email,
  pu.full_name,
  au.created_at as admin_desde
FROM public.admin_users au
JOIN auth.users auth_u ON auth_u.id = au.user_id
LEFT JOIN public.users pu ON pu.id = au.user_id
WHERE auth_u.email = 'karlifuentes96@gmail.com';

-- Si las consultas anteriores fallan por RLS, ejecuta esto para verificar sin RLS:
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

SELECT 
  au.id as admin_id,
  au.user_id,
  auth_u.email,
  pu.full_name,
  au.created_at as admin_desde
FROM public.admin_users au
JOIN auth.users auth_u ON auth_u.id = au.user_id
LEFT JOIN public.users pu ON pu.id = au.user_id
WHERE auth_u.email = 'karlifuentes96@gmail.com';

-- Rehabilitar RLS después
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

