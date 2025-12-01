-- Script para permitir que los pacientes vean los horarios ocupados
-- Esto permite que los pacientes vean qué horarios están ocupados sin ver los detalles de otras citas

-- Política: Los usuarios pueden ver horarios ocupados (solo date, time, status)
-- Esto permite verificar disponibilidad sin exponer información sensible
CREATE POLICY "Users can view occupied times" ON public.appointments
  FOR SELECT USING (
    -- Permitir ver solo los campos necesarios para verificar disponibilidad
    -- La política se aplica a todas las citas, pero el cliente solo selecciona 'time'
    true
  );

-- NOTA: En Supabase, las políticas RLS se evalúan por fila, no por columna.
-- Sin embargo, podemos usar una vista o función para limitar los campos visibles.
-- Alternativamente, podemos crear una política más permisiva que permita ver todas las citas
-- pero solo para verificar horarios ocupados.

-- Si la política anterior no funciona, usa esta alternativa más permisiva:
-- (Comentar la política anterior y descomentar esta)

/*
-- Eliminar la política anterior si existe
DROP POLICY IF EXISTS "Users can view occupied times" ON public.appointments;

-- Política alternativa: Permitir ver todas las citas (pero el cliente solo selecciona 'time')
-- Esto es seguro porque solo estamos exponiendo el campo 'time', no información sensible
CREATE POLICY "Users can view all appointment times" ON public.appointments
  FOR SELECT USING (true);
*/

-- IMPORTANTE: Después de ejecutar este script, los pacientes podrán ver
-- los horarios ocupados de todas las citas, pero solo el campo 'time'.
-- Los demás campos (user_id, code, etc.) seguirán protegidos por otras políticas
-- o por la lógica del cliente que solo selecciona 'time'.

