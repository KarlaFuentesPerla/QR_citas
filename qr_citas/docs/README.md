# Sistema de Gestión de Citas con QR

Sistema web completo para gestionar citas con códigos QR y códigos únicos de confirmación. Incluye módulos para usuarios y administradores.

## 🚀 Características

### Módulo de Usuario
- ✅ Registro e inicio de sesión con Supabase Auth
- ✅ Agendar citas con selección de fecha y hora
- ✅ Generación automática de código QR y código único
- ✅ Visualización y descarga de códigos QR
- ✅ Cancelación de citas
- ✅ Historial de citas con estados

### Módulo de Administrador
- ✅ Panel de administración con autenticación separada
- ✅ Vista de citas del día con filtro por fecha
- ✅ Escaneo de códigos QR con html5-qrcode
- ✅ Ingreso manual de códigos únicos
- ✅ Marcado de citas como recibidas o no presentadas
- ✅ Estadísticas del día (total, recibidos, ausencias, canceladas)

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase (gratuita)
- Navegador moderno con soporte para cámara (para escaneo QR)

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Supabase**

   a. Crea un proyecto en [Supabase](https://supabase.com)
   
   b. Ve a Settings > API y copia:
      - Project URL
      - anon/public key

   c. Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```

4. **Configurar la Base de Datos**

   a. Ve a SQL Editor en tu proyecto de Supabase
   
   b. Ejecuta el contenido del archivo `supabase/migrations/001_initial_schema.sql`
   
   c. Esto creará:
      - Tabla `users` (perfiles de usuario)
      - Tabla `appointments` (citas)
      - Tabla `admin_users` (administradores)
      - Políticas RLS (Row Level Security)
      - Funciones y triggers

5. **Crear un usuario administrador**

   a. Registra un usuario normal desde la aplicación
   
   b. Ve a SQL Editor en Supabase y ejecuta:
   ```sql
   INSERT INTO public.admin_users (user_id)
   VALUES ('ID_DEL_USUARIO_AQUI');
   ```
   
   Reemplaza `ID_DEL_USUARIO_AQUI` con el ID del usuario que quieres hacer administrador.
   Puedes obtener el ID desde la tabla `auth.users` en Supabase.

6. **Ejecutar la aplicación**
   ```bash
   npm run dev
   ```

7. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 📱 Uso

### Para Usuarios

1. **Registrarse**: Crea una cuenta con email y contraseña
2. **Agendar Cita**: Selecciona fecha y hora disponible
3. **Ver QR**: Una vez agendada, puedes ver y descargar tu código QR
4. **Código Único**: Copia tu código único de 6 caracteres
5. **Cancelar**: Puedes cancelar citas pendientes

### Para Administradores

1. **Iniciar Sesión**: Usa el enlace "Acceso Administrador" en la página de login
2. **Ver Citas**: Selecciona la fecha para ver las citas del día
3. **Escanear QR**: Activa la cámara para escanear códigos QR (requiere librería adicional)
4. **Código Manual**: Ingresa el código único manualmente
5. **Marcar Estado**: Marca citas como recibidas o no presentadas

## 🔧 Mejoras Futuras

- [ ] Notificaciones por email
- [ ] Recordatorios de citas
- [ ] Exportar reportes a PDF/Excel
- [ ] Calendario visual de disponibilidad
- [ ] Bloqueo de horarios por el administrador
- [ ] Soporte para múltiples servicios/tipos de citas

## 📝 Notas Técnicas

### Escaneo QR
El módulo de escaneo QR utiliza `html5-qrcode` para escanear códigos QR en tiempo real. La cámara se activa automáticamente cuando se abre el escáner.

### Seguridad
- Las políticas RLS (Row Level Security) están configuradas para proteger los datos
- Los usuarios solo pueden ver y modificar sus propias citas
- Los administradores tienen acceso completo a todas las citas

### Códigos Únicos
Los códigos se generan aleatoriamente con 6 caracteres alfanuméricos (sin caracteres ambiguos como 0, O, I, 1).

## 🐛 Solución de Problemas

**Error: "No se pudo acceder a la cámara"**
- Asegúrate de permitir el acceso a la cámara en tu navegador
- Usa HTTPS en producción (la cámara requiere contexto seguro)

**Error: "No tienes permisos de administrador"**
- Verifica que el usuario esté en la tabla `admin_users`
- Asegúrate de haber iniciado sesión con las credenciales correctas

**Error de conexión a Supabase**
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que el proyecto de Supabase esté activo

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y comercial.

