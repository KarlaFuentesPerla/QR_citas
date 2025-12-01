# 🗄️ Crear Base de Datos en Supabase

## Pasos para crear la base de datos

### 1. Acceder a tu proyecto de Supabase

1. Ve a: https://supabase.com/dashboard/project/ujfwhpyurprmnrytibls
2. O ve a https://supabase.com/dashboard y selecciona tu proyecto

### 2. Ejecutar la migración SQL

1. En el menú lateral, haz clic en **SQL Editor** (ícono de base de datos)
2. Haz clic en **New Query**
3. Abre el archivo `supabase/migrations/001_initial_schema.sql` en tu editor de código
4. **Copia TODO el contenido** del archivo
5. Pégalo en el editor SQL de Supabase
6. Haz clic en **Run** (o presiona `Ctrl+Enter` / `Cmd+Enter`)

### 3. Verificar que se crearon las tablas

1. En el menú lateral, haz clic en **Table Editor**
2. Deberías ver 3 tablas:
   - ✅ `users` - Perfiles de usuarios
   - ✅ `appointments` - Citas
   - ✅ `admin_users` - Administradores

### 4. Verificar las políticas RLS

1. Ve a **Authentication** > **Policies**
2. Deberías ver políticas para:
   - `users` (SELECT, UPDATE, INSERT)
   - `appointments` (SELECT, INSERT, UPDATE)
   - `admin_users` (SELECT)

## ✅ Listo!

Una vez ejecutada la migración, tu aplicación debería funcionar correctamente.

## 🔍 Si hay errores

### Error: "relation already exists"
- Las tablas ya existen, está bien. Puedes continuar.

### Error: "permission denied"
- Verifica que estés usando las credenciales correctas
- Asegúrate de estar en el proyecto correcto

### Error: "extension uuid-ossp does not exist"
- Esto es raro, pero si ocurre, ejecuta primero:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ```

## 📝 Nota

Si ya ejecutaste la migración antes, no pasa nada si la ejecutas de nuevo. El script usa `IF NOT EXISTS` para evitar duplicados.


