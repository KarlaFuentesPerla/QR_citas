-- Permitir que los administradores creen usuarios en public.users
-- Ejecuta este script en Supabase SQL Editor

-- Política: Los administradores pueden insertar usuarios
CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Política: Los administradores pueden actualizar usuarios
CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

