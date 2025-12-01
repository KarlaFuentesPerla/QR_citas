# 🚀 Inicio Rápido

## ⚠️ PROBLEMA: La app no abre

Si ves el error "ERR_CONNECTION_REFUSED" o "localhost refused to connect", es porque **falta el archivo `.env.local`** con las credenciales de Supabase.

## ✅ Solución Rápida

### Opción 1: Usar el script (Recomendado)

Ejecuta en PowerShell desde la carpeta del proyecto:

```powershell
.\crear-env.ps1
```

Luego edita el archivo `.env.local` y agrega tus credenciales de Supabase.

### Opción 2: Crear manualmente

1. Crea un archivo llamado `.env.local` en la raíz del proyecto
2. Agrega este contenido (reemplaza con tus valores reales):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

## 📝 Cómo obtener las credenciales de Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta (es gratis)
2. Crea un nuevo proyecto
3. Ve a **Settings** > **API**
4. Copia:
   - **Project URL** → va en `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🎯 Después de crear .env.local

1. **Ejecuta la aplicación:**
   ```bash
   npm run dev
   ```

2. **Abre en el navegador:**
   ```
   http://localhost:3000
   ```

3. **Configura la base de datos:**
   - Ve a SQL Editor en Supabase
   - Ejecuta el contenido de `supabase/migrations/001_initial_schema.sql`

## ❓ ¿Todavía no funciona?

1. Verifica que el archivo `.env.local` esté en la raíz del proyecto (mismo nivel que `package.json`)
2. Verifica que no haya espacios extra en las variables
3. Reinicia el servidor después de crear/editar `.env.local`
4. Verifica que las credenciales sean correctas (sin comillas)

## 🔍 Verificar que funciona

Si todo está bien, deberías ver:
- La página de inicio con botones "Iniciar Sesión" y "Registrarse"
- Sin errores en la consola del navegador
- El servidor corriendo en `http://localhost:3000`


