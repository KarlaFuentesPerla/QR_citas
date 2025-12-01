-- Script para verificar y corregir usuarios que están en auth.users pero no en public.users
-- Ejecuta este script en Supabase SQL Editor

-- 1. Ver usuarios que están en auth.users pero NO en public.users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ FALTA en public.users'
    ELSE '✅ Existe en public.users'
  END AS estado
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- 2. Insertar usuarios faltantes en public.users
-- Esto crea registros en public.users para todos los usuarios de auth.users que no tengan perfil
INSERT INTO public.users (id, email, full_name, phone)
SELECT 
  au.id,
  au.email,
  COALESCE(
    (au.raw_user_meta_data->>'full_name')::text,
    (au.raw_user_meta_data->>'fullName')::text,
    split_part(au.email, '@', 1)
  ) as full_name,
  (au.raw_user_meta_data->>'phone')::text as phone
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar que todos los usuarios ahora tienen perfil
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_public_users,
  COUNT(*) - (SELECT COUNT(*) FROM public.users) as usuarios_faltantes
FROM auth.users;

-- 4. Si aún hay usuarios faltantes, ejecuta esto para crear perfiles básicos:
/*
INSERT INTO public.users (id, email, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(
    (au.raw_user_meta_data->>'full_name')::text,
    split_part(au.email, '@', 1)
  ) as full_name
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
*/

