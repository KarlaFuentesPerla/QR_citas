# 🚀 Guía de Despliegue en Vercel

## Preparación para Vercel

Tu aplicación ya está lista para desplegarse en Vercel. Sigue estos pasos:

### 1. Preparar el Repositorio

1. Inicializa Git (si no lo has hecho):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Crea un repositorio en GitHub/GitLab/Bitbucket

3. Conecta tu repositorio local:
   ```bash
   git remote add origin TU_REPOSITORIO_URL
   git push -u origin main
   ```

### 2. Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión

2. Haz clic en "Add New Project"

3. Importa tu repositorio de Git

4. Configura las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL` = Tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Tu clave anon de Supabase

5. Haz clic en "Deploy"

### 3. Configuración Adicional

#### Variables de Entorno en Vercel

En el dashboard de Vercel, ve a:
- Settings → Environment Variables
- Agrega:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Configurar Dominio Personalizado (Opcional)

1. En Vercel, ve a Settings → Domains
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS

### 4. Configurar Supabase para Producción

1. En Supabase, ve a Settings → API
2. Agrega tu dominio de Vercel a "Allowed Redirect URLs":
   - `https://tu-dominio.vercel.app/auth/callback`
   - `https://tu-dominio.vercel.app/**`

### 5. Verificar el Despliegue

Después del despliegue:
1. Verifica que la aplicación carga correctamente
2. Prueba el login
3. Verifica que el dashboard funciona
4. Prueba agendar una cita

## ✅ Checklist Pre-Deploy

- [ ] Variables de entorno configuradas en Vercel
- [ ] Base de datos configurada en Supabase
- [ ] Migración SQL ejecutada
- [ ] Usuario administrador creado
- [ ] Redirect URLs configuradas en Supabase
- [ ] Código subido a Git
- [ ] Build exitoso en Vercel

## 🔧 Solución de Problemas

### Error: "Invalid API key"
- Verifica que las variables de entorno estén correctas en Vercel
- Asegúrate de usar la clave `anon public`, no `service_role`

### Error: "Redirect URI mismatch"
- Agrega tu dominio de Vercel a las URLs permitidas en Supabase
- Formato: `https://tu-dominio.vercel.app/auth/callback`

### Error: Build falla
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel

## 📝 Notas

- Vercel despliega automáticamente en cada push a la rama principal
- Los cambios se reflejan en segundos
- Puedes tener múltiples ambientes (preview, production)


