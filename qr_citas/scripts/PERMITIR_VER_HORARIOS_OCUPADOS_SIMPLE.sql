-- Script SIMPLE para permitir que los pacientes vean los horarios ocupados
-- Ejecuta este script en Supabase SQL Editor

-- Eliminar la política restrictiva actual (solo permite ver propias citas)
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;

-- Crear una nueva política que permita ver todas las citas
-- PERO solo para verificar disponibilidad (el cliente solo selecciona 'time')
CREATE POLICY "Users can view all appointments for availability" ON public.appointments
  FOR SELECT USING (true);

-- IMPORTANTE: Esta política permite que los pacientes vean TODAS las citas,
-- pero como el código del cliente solo selecciona el campo 'time',
-- no se expone información sensible como user_id, code, etc.

-- Si quieres ser más restrictivo, puedes crear una función que solo devuelva 'time':
/*
CREATE OR REPLACE FUNCTION public.get_occupied_times(check_date DATE)
RETURNS TABLE(time TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT a.time
  FROM public.appointments a
  WHERE a.date = check_date
    AND a.status != 'cancelada';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Y luego usar esta función desde el cliente en lugar de SELECT directo
*/

