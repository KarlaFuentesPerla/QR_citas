# Cómo Agregar Feriados al Dashboard de Pacientes

Los feriados se definen en el archivo `app/dashboard/dashboard-client.tsx` en la constante `HOLIDAYS`.

## Agregar un Feriado

1. Abre el archivo `app/dashboard/dashboard-client.tsx`
2. Busca la constante `HOLIDAYS` (alrededor de la línea 30)
3. Agrega la fecha en formato `YYYY-MM-DD`:

```typescript
const HOLIDAYS = [
  '2024-01-01', // Año Nuevo
  '2024-12-25', // Navidad
  '2025-01-01', // Año Nuevo
  '2025-12-25', // Navidad
  '2025-05-01', // Día del Trabajador (ejemplo)
  // Agrega más feriados aquí
]
```

## Ejemplos de Feriados Comunes

```typescript
const HOLIDAYS = [
  // 2024
  '2024-01-01', // Año Nuevo
  '2024-05-01', // Día del Trabajador
  '2024-09-16', // Día de la Independencia (México)
  '2024-12-25', // Navidad
  '2024-12-31', // Víspera de Año Nuevo
  
  // 2025
  '2025-01-01', // Año Nuevo
  '2025-05-01', // Día del Trabajador
  '2025-09-16', // Día de la Independencia (México)
  '2025-12-25', // Navidad
  '2025-12-31', // Víspera de Año Nuevo
]
```

## Notas

- Los feriados se excluyen automáticamente del calendario
- Los fines de semana (sábados y domingos) también se excluyen automáticamente
- Las fechas deben estar en formato ISO (YYYY-MM-DD)
- Puedes agregar comentarios para identificar cada feriado

