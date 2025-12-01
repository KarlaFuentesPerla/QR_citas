# Guía de Configuración Detallada

## Paso 1: Configurar Supabase

### 1.1 Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa el formulario:
   - **Name**: qr-citas (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: Selecciona la región más cercana
5. Espera a que se cree el proyecto (puede tardar 1-2 minutos)

### 1.2 Obtener Credenciales

1. En tu proyecto de Supabase, ve a **Settings** > **API**
2. Copia los siguientes valores:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon public** key (una clave larga que comienza con `eyJ...`)

### 1.3 Configurar Variables de Entorno

1. En la raíz del proyecto, crea un archivo `.env.local`
2. Agrega las siguientes líneas (reemplaza con tus valores reales):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE**: Nunca subas el archivo `.env.local` a Git. Ya está en `.gitignore`.

## Paso 2: Configurar la Base de Datos

### 2.1 Ejecutar Migración SQL

1. En Supabase, ve a **SQL Editor** (ícono de base de datos en el menú lateral)
2. Haz clic en **New Query**
3. Abre el archivo `supabase/migrations/001_initial_schema.sql` en tu editor
4. Copia TODO el contenido del archivo
5. Pégalo en el editor SQL de Supabase
6. Haz clic en **Run** (o presiona Ctrl+Enter)
7. Deberías ver un mensaje de éxito

### 2.2 Verificar que las Tablas se Crearon

1. En Supabase, ve a **Table Editor**
2. Deberías ver 3 tablas:
   - `users`
   - `appointments`
   - `admin_users`

## Paso 3: Crear Usuario Administrador

### 3.1 Registrar un Usuario Normal

1. Ejecuta la aplicación: `npm run dev`
2. Ve a `http://localhost:3000`
3. Haz clic en "Registrarse"
4. Completa el formulario con:
   - Nombre completo
   - Email (ejemplo: `admin@ejemplo.com`)
   - Contraseña
5. Haz clic en "Registrarse"

### 3.2 Obtener el ID del Usuario

1. En Supabase, ve a **Authentication** > **Users**
2. Busca el usuario que acabas de crear
3. Copia el **UUID** del usuario (es un ID largo como `a1b2c3d4-e5f6-...`)

### 3.3 Convertir en Administrador

1. En Supabase, ve a **SQL Editor**
2. Ejecuta el siguiente SQL (reemplaza `TU_USER_ID_AQUI` con el UUID que copiaste):

```sql
INSERT INTO public.admin_users (user_id)
VALUES ('TU_USER_ID_AQUI');
```

3. Haz clic en **Run**
4. Deberías ver "Success. No rows returned"

### 3.4 Verificar

1. Ve a `http://localhost:3000/admin/login`
2. Inicia sesión con las credenciales del usuario que acabas de crear
3. Deberías poder acceder al panel de administración

## Paso 4: Instalar Dependencias

Si aún no lo has hecho:

```bash
npm install
```

Esto instalará todas las dependencias necesarias:
- Next.js
- React
- Supabase
- Tailwind CSS
- Librerías de QR

## Paso 5: Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

## Verificación Final

### ✅ Checklist

- [ ] Proyecto de Supabase creado
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Migración SQL ejecutada exitosamente
- [ ] Tablas creadas (`users`, `appointments`, `admin_users`)
- [ ] Usuario administrador creado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Aplicación ejecutándose (`npm run dev`)
- [ ] Puedo registrarme como usuario normal
- [ ] Puedo iniciar sesión como administrador

## Solución de Problemas Comunes

### Error: "Invalid API key"

- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de usar la clave `anon public`, no la `service_role`
- Reinicia el servidor de desarrollo después de cambiar `.env.local`

### Error: "relation does not exist"

- Asegúrate de haber ejecutado la migración SQL completa
- Verifica en Table Editor que las tablas existan

### Error: "No tienes permisos de administrador"

- Verifica que el usuario esté en la tabla `admin_users`
- Ejecuta este SQL para verificar:
  ```sql
  SELECT * FROM public.admin_users;
  ```

### Error: "No se pudo acceder a la cámara"

- Asegúrate de permitir el acceso a la cámara en tu navegador
- En producción, la cámara solo funciona en HTTPS
- Algunos navegadores requieren permisos explícitos

### La aplicación no carga

- Verifica que el puerto 3000 no esté en uso
- Revisa la consola del navegador para errores
- Verifica que todas las dependencias estén instaladas

## Próximos Pasos

Una vez que todo esté funcionando:

1. **Personalizar horarios**: Edita `app/dashboard/dashboard-client.tsx` para cambiar los horarios disponibles
2. **Personalizar diseño**: Modifica `tailwind.config.ts` para cambiar colores y estilos
3. **Agregar más funcionalidades**: Revisa el README.md para ideas de mejoras

## Soporte

Si encuentras problemas:
1. Revisa los logs en la consola del navegador
2. Revisa los logs en Supabase (Dashboard > Logs)
3. Verifica que todas las políticas RLS estén correctamente configuradas


