-- Agregar columna email a la tabla public.users si no existe
-- Esto permite que los administradores vean el email de los pacientes sin hacer JOIN con auth.users

-- Agregar columna email si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email TEXT;
    
    -- Actualizar emails existentes desde auth.users
    UPDATE public.users u
    SET email = au.email
    FROM auth.users au
    WHERE u.id = au.id AND u.email IS NULL;
    
    -- Crear índice para mejorar búsquedas
    CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
  END IF;
END $$;

