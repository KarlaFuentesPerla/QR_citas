-- Script DIRECTO usando tu User UID
-- Tu User UID: 44340dfd-dab6-4872-a9db-00d9fd907e8f

-- Deshabilitar RLS temporalmente
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Asegurar que existe en public.users
INSERT INTO public.users (id, full_name, phone, created_at, updated_at)
VALUES (
  '44340dfd-dab6-4872-a9db-00d9fd907e8f',
  NULL,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Agregar a admin_users
INSERT INTO public.admin_users (user_id, created_at)
VALUES (
  '44340dfd-dab6-4872-a9db-00d9fd907e8f',
  NOW()
)
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

