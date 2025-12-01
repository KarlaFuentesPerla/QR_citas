# Cómo Agregar un Administrador

## Método 1: Usando el Script SQL (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `supabase/migrations/002_add_admin.sql`
4. Ejecuta el script
5. Deberías ver el mensaje: "Administrador agregado exitosamente para karlifuentes96@gmail.com"

## Método 2: SQL Directo

Si prefieres ejecutar el SQL directamente:

```sql
-- Primero, obtén el user_id del usuario
-- Reemplaza 'karlifuentes96@gmail.com' con el email correcto
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Buscar el user_id por email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'karlifuentes96@gmail.com';

  -- Si el usuario no existe, mostrar error
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Usuario con email karlifuentes96@gmail.com no encontrado. Asegúrate de que el usuario esté registrado primero.';
  END IF;

  -- Asegurar que existe en public.users
  INSERT INTO public.users (id, full_name, phone, created_at, updated_at)
  VALUES (user_uuid, NULL, NULL, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Agregar a admin_users
  INSERT INTO public.admin_users (user_id, created_at)
  VALUES (user_uuid, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Administrador agregado exitosamente';
END $$;
```

## Método 3: SQL Simple (Si ya conoces el user_id)

Si ya conoces el UUID del usuario, puedes ejecutar directamente:

```sql
-- Reemplaza 'USER_ID_AQUI' con el UUID real del usuario
INSERT INTO public.admin_users (user_id, created_at)
VALUES ('USER_ID_AQUI', NOW())
ON CONFLICT (user_id) DO NOTHING;
```

## Verificar que Funcionó

Para verificar que el usuario ahora es administrador, ejecuta:

```sql
SELECT 
  au.id,
  au.user_id,
  u.email,
  u.full_name,
  au.created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'karlifuentes96@gmail.com';
```

Si la consulta devuelve un resultado, el usuario es administrador.

## Solución de Problemas

### Error: "Usuario no encontrado"
- Asegúrate de que el usuario se haya registrado primero en el sistema
- Verifica que el email sea exactamente el mismo (case-sensitive en algunos casos)
- Puedes verificar los usuarios registrados con:
  ```sql
  SELECT id, email, created_at FROM auth.users;
  ```

### Error: "Ya es administrador"
- El usuario ya tiene permisos de administrador
- Puedes verificar con la consulta de verificación arriba

### Error de permisos
- Asegúrate de estar ejecutando el SQL como superusuario o con permisos suficientes
- El script usa `SECURITY DEFINER` para evitar problemas de permisos

