# Guía de Servidor MCP (Model Context Protocol)

## ¿Qué es MCP?

MCP (Model Context Protocol) es un protocolo que permite a los modelos de IA (como los que usan Cursor) interactuar con servicios externos y bases de datos de manera estructurada.

## Tu Configuración Actual

Ya tienes un servidor MCP de Supabase configurado en:
```
C:\Users\kony9\.cursor\mcp.json
```

Esta configuración permite que Cursor acceda directamente a tu proyecto de Supabase para:
- Consultar la base de datos
- Ejecutar queries SQL
- Ver el esquema de tablas
- Obtener información sobre tu proyecto

## Tu Proyecto de Supabase

Según tu configuración MCP, tu proyecto de Supabase es:
- **Project Reference**: `ujfwhpyurprmnrytibls`
- **URL**: `https://mcp.supabase.com/mcp?project_ref=ujfwhpyurprmnrytibls`

## Usar MCP con tu Proyecto de Citas

### Opción 1: Usar el MCP de Supabase Existente

El servidor MCP ya está configurado y debería funcionar automáticamente en Cursor. Puedes:

1. **Preguntar sobre tu base de datos**: 
   - "¿Qué tablas tengo en Supabase?"
   - "Muéstrame el esquema de la tabla appointments"
   - "¿Cuántos usuarios hay registrados?"

2. **Ejecutar queries**:
   - "Ejecuta un SELECT en la tabla appointments"
   - "Muéstrame las citas del día de hoy"

### Opción 2: Crear un Servidor MCP Personalizado

Si quieres crear un servidor MCP específico para tu proyecto de citas, puedes:

#### 2.1 Instalar el SDK de MCP

```bash
npm install @modelcontextprotocol/sdk
```

#### 2.2 Crear un servidor MCP básico

Crea un archivo `mcp-server.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@/lib/supabase/client';

const server = new Server(
  {
    name: 'qr-citas-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Herramienta para obtener citas
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_appointments',
      description: 'Obtiene las citas de un usuario o del día',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'ID del usuario' },
          date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        },
      },
    },
  ],
}));

// Implementar la herramienta
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_appointments') {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', args.date || new Date().toISOString().split('T')[0]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
});

// Iniciar el servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Servidor MCP iniciado');
}

main().catch(console.error);
```

#### 2.3 Agregar script en package.json

```json
{
  "scripts": {
    "mcp-server": "tsx mcp-server.ts"
  }
}
```

#### 2.4 Configurar en Cursor

Agrega a tu `mcp.json`:

```json
{
  "mcpServers": {
    "qr-citas": {
      "command": "npm",
      "args": ["run", "mcp-server"],
      "cwd": "C:\\Users\\kony9\\Downloads\\qr_citas"
    }
  }
}
```

## Verificar que MCP Funciona

1. **En Cursor**: El servidor MCP debería conectarse automáticamente
2. **Ver logs**: Revisa la consola de Cursor para ver si hay errores de conexión
3. **Probar**: Haz una pregunta sobre tu base de datos de Supabase

## Solución de Problemas

### MCP no se conecta

1. Verifica que el archivo `mcp.json` esté en la ubicación correcta
2. Reinicia Cursor
3. Verifica que las credenciales de Supabase sean correctas

### Error de autenticación

- Verifica que el `apikey` en `mcp.json` sea válido
- Asegúrate de que el proyecto de Supabase esté activo

## Recursos

- [Documentación MCP de Supabase](https://supabase.com/docs/guides/mcp)
- [SDK de MCP](https://github.com/modelcontextprotocol/typescript-sdk)


