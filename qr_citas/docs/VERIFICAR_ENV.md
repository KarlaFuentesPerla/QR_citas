# Cómo Verificar que las Variables de Entorno Estén Configuradas

## Verificar .env.local

1. Abre el archivo `.env.local` en la raíz del proyecto
2. Debe tener estas tres líneas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Obtener la Service Role Key

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) en el menú lateral
4. Haz clic en **API**
5. En la sección **Project API keys**, busca:
   - **`service_role`** (secret) - Esta es la que necesitas
   - Es una clave MUY larga que comienza con `eyJ...`
6. Haz clic en el ícono de "eye" (👁️) para revelarla
7. Copia toda la clave completa

## Agregar al .env.local

1. Abre `.env.local`
2. Agrega esta línea (sin comillas, sin espacios extra):

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1yZWYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANTE:**
- No uses comillas alrededor del valor
- No dejes espacios antes o después del `=`
- La clave es MUY larga (más de 200 caracteres), cópiala completa

## Reiniciar el Servidor

**CRÍTICO:** Después de agregar o modificar `.env.local`, DEBES reiniciar el servidor:

1. Detén el servidor (presiona `Ctrl+C` en la terminal)
2. Inicia el servidor nuevamente: `npm run dev`

## Verificar que Funciona

Después de reiniciar, intenta crear un paciente. Si aún ves el error, verifica en la consola del servidor los logs que muestran:
- `hasServiceKey: true/false`
- `serviceKeyLength: X`

Si `hasServiceKey` es `false`, la variable no se está leyendo correctamente.

## Solución de Problemas

### La variable no se lee
- Verifica que el archivo se llame exactamente `.env.local` (con el punto al inicio)
- Verifica que esté en la raíz del proyecto (mismo nivel que `package.json`)
- Reinicia el servidor después de agregar la variable
- Verifica que no haya espacios o caracteres especiales en el nombre de la variable

### Error de formato
- Asegúrate de que no haya comillas alrededor del valor
- Asegúrate de que no haya espacios antes o después del `=`
- Verifica que la clave esté completa (es muy larga)

