-- Script para insertar múltiples pacientes de una vez
-- IMPORTANTE: Este script actualiza public.users con los usuarios que ya existen en auth.users
-- Si los usuarios NO existen en auth.users, créalos primero desde el dashboard de admin
-- o usa la API para crearlos

-- PASO 1: Modifica esta lista con los datos de tus pacientes
-- Puedes agregar o quitar pacientes según necesites
WITH pacientes_data AS (
  SELECT * FROM (VALUES
    ('paciente1@ejemplo.com', 'Juan Pérez', '1234567890'),
    ('paciente2@ejemplo.com', 'María García', '0987654321'),
    ('paciente3@ejemplo.com', 'Carlos López', '5555555555')
    -- Agrega más pacientes aquí, uno por línea:
    -- ('email@ejemplo.com', 'Nombre Completo', 'teléfono'),
  ) AS t(email, full_name, phone)
)
-- PASO 2: Actualizar o insertar en public.users basándose en auth.users
INSERT INTO public.users (id, full_name, email, phone)
SELECT 
  au.id,
  pd.full_name,
  pd.email,
  pd.phone
FROM pacientes_data pd
INNER JOIN auth.users au ON au.email = pd.email
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- Verificar los resultados
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.phone,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ Usuario existe en auth.users'
    ELSE '⚠️ Usuario NO existe en auth.users - créalo desde el dashboard'
  END AS estado
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.email IN (
  'paciente1@ejemplo.com',
  'paciente2@ejemplo.com',
  'paciente3@ejemplo.com'
  -- Agrega aquí los emails que usaste arriba
)
ORDER BY u.full_name;

-- INSTRUCCIONES:
-- 1. Modifica la lista de pacientes en la sección "pacientes_data" arriba
-- 2. Si un paciente NO existe en auth.users, créalo primero desde el dashboard de admin
-- 3. Ejecuta este script
-- 4. Verifica los resultados con la consulta SELECT de arriba

