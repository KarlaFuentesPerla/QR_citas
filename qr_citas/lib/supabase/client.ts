import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan las variables de entorno de Supabase. Por favor, crea un archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  // Verificar que no sean valores placeholder
  if (supabaseUrl.includes('tu-proyecto') || supabaseAnonKey.includes('tu-clave')) {
    throw new Error(
      'Las variables de entorno tienen valores placeholder. Por favor, edita .env.local con tus credenciales reales de Supabase. Obtén tus credenciales en: https://supabase.com/dashboard/project/_/settings/api'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

