# Sistema de Gestión de Citas con QR

Sistema web completo para gestionar citas médicas con códigos QR y códigos únicos de confirmación. Incluye módulos para pacientes y administradores.

## 🚀 Características Principales

- **Panel de Pacientes**: Agendar citas, ver historial, cancelar citas, códigos QR
- **Panel de Administradores**: Gestión completa de citas, escaneo QR, KPIs y estadísticas
- **Autenticación**: Sistema de login separado para pacientes y administradores
- **Códigos QR**: Generación y escaneo de códigos QR para verificación de citas
- **KPIs**: Dashboard con métricas de asistencia, cancelación, y más

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase (gratuita)
- Navegador moderno con soporte para cámara (para escaneo QR)

## 🛠️ Instalación Rápida

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repo>
   cd qr_citas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Copia `env.example` a `.env.local` y completa con tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

4. **Configurar la Base de Datos**
   
   Ejecuta las migraciones en Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql` (esquema inicial)
   - `supabase/migrations/003_allow_admin_create_users.sql` (permisos de admin)

5. **Crear usuario administrador**
   
   Usa el script en `scripts/AGREGAR_ADMIN_SIMPLE.sql` o `scripts/AGREGAR_ADMIN_DIRECTO.sql`

6. **Ejecutar la aplicación**
   ```bash
   npm run dev
   ```

7. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 📚 Documentación

Toda la documentación detallada está en la carpeta `docs/`:

- **[README.md](docs/README.md)** - Documentación completa del proyecto
- **[INICIO_RAPIDO.md](docs/INICIO_RAPIDO.md)** - Guía de inicio rápido
- **[SETUP.md](docs/SETUP.md)** - Configuración detallada
- **[DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)** - Guía de despliegue en Vercel
- **[AGREGAR_ADMIN.md](docs/AGREGAR_ADMIN.md)** - Cómo agregar administradores
- **[CONFIGURAR_SERVICE_ROLE.md](docs/CONFIGURAR_SERVICE_ROLE.md)** - Configuración de Service Role Key

## 📁 Estructura del Proyecto

```
qr_citas/
├── app/                    # Aplicación Next.js
│   ├── admin/             # Panel de administradores
│   ├── dashboard/         # Panel de pacientes
│   ├── api/               # API routes
│   └── ...
├── lib/                    # Utilidades y clientes
│   └── supabase/          # Clientes de Supabase
├── supabase/
│   └── migrations/        # Migraciones SQL
├── scripts/               # Scripts SQL útiles
├── docs/                  # Documentación
└── ...
```

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 🐛 Solución de Problemas

Consulta la documentación en `docs/` para soluciones a problemas comunes:
- `docs/SOLUCION_ERROR_DASHBOARD.md`
- `docs/SOLUCION_ERROR_CACHE.md`
- `docs/VERIFICAR_ENV.md`

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y comercial.

