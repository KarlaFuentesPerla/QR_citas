# Cómo Agregar la Service Role Key

## Paso 1: Obtener la Service Role Key

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) en el menú lateral
4. Haz clic en **API**
5. En la sección **Project API keys**, busca:
   - **`service_role`** (secret) - Esta es la que necesitas
   - Es una clave MUY larga que comienza con `eyJ...`
6. Haz clic en el ícono de "eye" (👁️) para revelarla
7. Copia toda la clave completa (más de 200 caracteres)

## Paso 2: Agregar al .env.local

**Opción A: Manualmente**
1. Abre `.env.local` en un editor de texto (Notepad, VS Code, etc.)
2. Busca la línea: `SUPABASE_SERVICE_ROLE_KEY=`
3. Agrega tu clave DESPUÉS del `=` (sin espacios):
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZndocHl1cnBybW5yeXRpYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzkzODY0MiwiZXhwIjoyMDc5NTE0NjQyfQ.TU_CLAVE_COMPLETA_AQUI
   ```
4. **GUARDA el archivo** (Ctrl+S)

**Opción B: Usando PowerShell**
Ejecuta este comando (reemplaza `TU_CLAVE_AQUI` con tu clave real):
```powershell
$content = Get-Content .env.local -Raw
$content = $content -replace 'SUPABASE_SERVICE_ROLE_KEY=', "SUPABASE_SERVICE_ROLE_KEY=TU_CLAVE_AQUI"
$content | Set-Content .env.local -NoNewline
```

## Paso 3: Reiniciar el Servidor

**MUY IMPORTANTE:** Después de agregar la clave, DEBES reiniciar el servidor:

1. Ve a la terminal donde está corriendo `npm run dev`
2. Presiona `Ctrl+C` para detenerlo
3. Ejecuta nuevamente: `npm run dev`

## Verificar que Funciona

Después de reiniciar, intenta crear un paciente. En la consola del servidor deberías ver:
```
API - Environment check: {
  hasUrl: true,
  hasServiceKey: true,
  serviceKeyLength: 200+,
  serviceKeyStart: 'eyJhbGciOiJIUzI1NiIs'
}
```

Si `hasServiceKey` es `true`, ¡está funcionando!

## Problemas Comunes

### La clave no se guarda
- Asegúrate de **guardar el archivo** después de editarlo
- Verifica que no haya comillas alrededor del valor
- Verifica que no haya espacios antes o después del `=`

### El servidor no lee la clave
- **Reinicia el servidor** después de agregar la clave
- Verifica que el archivo se llame exactamente `.env.local` (con el punto)
- Verifica que esté en la raíz del proyecto (mismo nivel que `package.json`)

### Error de formato
- No uses comillas: `SUPABASE_SERVICE_ROLE_KEY="clave"` ❌
- Usa sin comillas: `SUPABASE_SERVICE_ROLE_KEY=clave` ✅
- No dejes espacios: `SUPABASE_SERVICE_ROLE_KEY = clave` ❌
- Sin espacios: `SUPABASE_SERVICE_ROLE_KEY=clave` ✅

