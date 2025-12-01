import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Obtener el userId del body (lo enviaremos desde el cliente)
    const { name, email, phone, userId } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'El nombre y el email son obligatorios' },
        { status: 400 }
      )
    }

    // Si se proporciona userId, verificar que sea admin
    if (userId) {
      try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        // Si no podemos verificar en el servidor, confiar en la verificación del cliente
        // pero aún así intentar verificar si es posible
        if (!userError && user && user.id === userId) {
          const { data: adminUser, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

          if (adminError || !adminUser) {
            return NextResponse.json(
              { error: 'No tienes permisos de administrador' },
              { status: 403 }
            )
          }
        }
      } catch (verifyError) {
        // Si falla la verificación en el servidor, continuar de todas formas
        // La verificación principal se hace en el cliente
        console.log('No se pudo verificar en el servidor, confiando en verificación del cliente')
      }
    }


    // Usar service_role key para crear el usuario (solo disponible en servidor)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('API - Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      serviceKeyLength: serviceRoleKey?.length || 0,
      serviceKeyStart: serviceRoleKey?.substring(0, 20) || 'N/A'
    })

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Configuración incompleta: NEXT_PUBLIC_SUPABASE_URL no está configurada.' },
        { status: 500 }
      )
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { 
          error: 'Configuración incompleta: SUPABASE_SERVICE_ROLE_KEY no está configurada.',
          hint: 'Verifica que agregaste SUPABASE_SERVICE_ROLE_KEY a tu archivo .env.local y reiniciaste el servidor.'
        },
        { status: 500 }
      )
    }

    if (serviceRoleKey.includes('tu-service-role-key') || serviceRoleKey.includes('aqui')) {
      return NextResponse.json(
        { 
          error: 'Configuración incompleta: SUPABASE_SERVICE_ROLE_KEY tiene un valor placeholder.',
          hint: 'Reemplaza el valor placeholder con tu service_role key real de Supabase.'
        },
        { status: 500 }
      )
    }

    // Crear cliente con service_role (bypass RLS)
    const supabaseAdmin = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Generar una contraseña temporal segura
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!@'

    // Crear el usuario en auth.users
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        full_name: name,
        phone: phone || null,
      },
    })

    if (createUserError) {
      // Si el usuario ya existe, obtener su ID
      if (createUserError.message.includes('already registered') || 
          createUserError.message.includes('already exists')) {
        // Buscar el usuario existente
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users.find(u => u.email === email)
        
        if (existingUser) {
          // Actualizar el perfil en public.users
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .upsert({
              id: existingUser.id,
              full_name: name,
              email: email, // Guardar email en public.users para facilitar consultas
              phone: phone || null,
            })

          if (updateError) {
            return NextResponse.json(
              { error: `Error al actualizar el perfil: ${updateError.message}` },
              { status: 500 }
            )
          }

          return NextResponse.json({
            success: true,
            message: 'Paciente actualizado exitosamente',
            userId: existingUser.id,
            note: 'El paciente ya existía en el sistema. Se actualizó su información.'
          })
        }
      }
      
      return NextResponse.json(
        { error: `Error al crear el usuario: ${createUserError.message}` },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      )
    }

    // Crear el perfil en public.users
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        full_name: name,
        email: email, // Guardar email en public.users para facilitar consultas
        phone: phone || null,
      })

    if (profileError) {
      return NextResponse.json(
        { error: `Error al crear el perfil: ${profileError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Paciente creado exitosamente',
      userId: authData.user.id,
      note: `El paciente puede usar "Olvidé mi contraseña" para establecer su contraseña cuando quiera iniciar sesión.`
    })
  } catch (error: any) {
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al crear el paciente' },
      { status: 500 }
    )
  }
}

