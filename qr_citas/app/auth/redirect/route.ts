import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar si es administrador
    try {
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (adminUser) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    } catch {
      // Si hay error, continuar como paciente
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Error in redirect route:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
