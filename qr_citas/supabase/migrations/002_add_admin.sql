-- Script para agregar un administrador
-- Ejecuta este script en el SQL Editor de Supabase
-- IMPORTANTE: Este script debe ejecutarse como superusuario o con permisos de bypass RLS

-- Primero, deshabilitar temporalmente RLS para poder insertar el primer administrador
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Función helper para agregar un administrador por email
CREATE OR REPLACE FUNCTION public.add_admin_by_email(admin_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_uuid UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Buscar el user_id por email en auth.users
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = admin_email;

  -- Verificar si el usuario existe
  IF user_uuid IS NULL THEN
    RETURN 'Error: Usuario con email ' || admin_email || ' no encontrado en auth.users. Asegúrate de que el usuario esté registrado primero.';
  END IF;

  -- Verificar si ya es administrador
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = user_uuid
  ) INTO admin_exists;

  IF admin_exists THEN
    RETURN 'El usuario ' || admin_email || ' ya es administrador.';
  END IF;

  -- Asegurar que existe en public.users
  INSERT INTO public.users (id, full_name, phone, created_at, updated_at)
  VALUES (user_uuid, NULL, NULL, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Agregar a admin_users
  INSERT INTO public.admin_users (user_id, created_at)
  VALUES (user_uuid, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN 'Administrador agregado exitosamente para ' || admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar el administrador específico
SELECT public.add_admin_by_email('karlifuentes96@gmail.com');

-- Rehabilitar RLS después de agregar el administrador
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

