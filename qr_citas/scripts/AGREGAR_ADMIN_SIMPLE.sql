-- Script SIMPLE para agregar administrador
-- Copia y pega esto directamente en el SQL Editor de Supabase

-- Paso 1: Obtener el user_id del email (ejecuta esto primero para verificar)
-- SELECT id, email FROM auth.users WHERE email = 'karlifuentes96@gmail.com';

-- Paso 2: Reemplaza 'USER_ID_AQUI' con el ID que obtuviste arriba y ejecuta:

-- Deshabilitar RLS temporalmente
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Asegurar que existe en public.users (reemplaza USER_ID_AQUI)
INSERT INTO public.users (id, full_name, phone, created_at, updated_at)
SELECT 
  id,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'karlifuentes96@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Agregar a admin_users (reemplaza USER_ID_AQUI)
INSERT INTO public.admin_users (user_id, created_at)
SELECT 
  id,
  NOW()
FROM auth.users
WHERE email = 'karlifuentes96@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Rehabilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Verificar que se agregó correctamente
SELECT 
  au.id,
  au.user_id,
  auth_u.email,
  pu.full_name,
  au.created_at as admin_desde
FROM public.admin_users au
JOIN auth.users auth_u ON auth_u.id = au.user_id
LEFT JOIN public.users pu ON pu.id = au.user_id
WHERE auth_u.email = 'karlifuentes96@gmail.com';

