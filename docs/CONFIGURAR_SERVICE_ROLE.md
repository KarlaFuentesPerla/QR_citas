# Configurar Service Role Key para Crear Pacientes

Para que el administrador pueda crear pacientes directamente desde el dashboard, necesitas agregar la **Service Role Key** de Supabase a tu archivo `.env.local`.

## ⚠️ IMPORTANTE

La **Service Role Key** es una clave muy sensible que **bypasea todas las políticas de seguridad (RLS)**. 
- **NUNCA** la expongas en el código del cliente
- **NUNCA** la subas a Git
- **Solo** debe usarse en endpoints API del servidor

## Pasos para Obtener la Service Role Key

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Settings** (Configuración) en el menú lateral
3. Haz clic en **API**
4. Busca la sección **Project API keys**
5. Copia la clave **`service_role`** (secret) - es una clave larga que comienza con `eyJ...`

## Agregar al .env.local

1. Abre tu archivo `.env.local` en la raíz del proyecto
2. Agrega esta línea (reemplaza con tu clave real):

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1yZWYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. **Reinicia el servidor** después de agregar la clave:
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

## Verificar que Funciona

1. Inicia sesión como administrador
2. Haz clic en "Crear Paciente"
3. Completa el formulario con nombre, email y teléfono
4. Haz clic en "Crear Paciente"
5. Deberías ver un mensaje de éxito y el paciente aparecerá en "Ver Pacientes"

## Solución de Problemas

### Error: "Configuración incompleta. Se requiere SUPABASE_SERVICE_ROLE_KEY"
- Verifica que agregaste `SUPABASE_SERVICE_ROLE_KEY` a `.env.local`
- Reinicia el servidor después de agregar la variable
- Verifica que no haya espacios antes o después del `=`

### Error: "Invalid API key"
- Verifica que copiaste la clave completa (es muy larga)
- Asegúrate de que es la clave `service_role`, no la `anon` key
- Verifica que no haya comillas alrededor del valor en `.env.local`

### El paciente se crea pero no aparece en la lista
- Haz clic en "Actualizar" en la lista de pacientes
- Verifica en Supabase Dashboard > Table Editor > users que el paciente esté ahí

