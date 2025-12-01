'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Verificar conexión primero
      const { error: healthError } = await supabase.from('users').select('count').limit(0)
      if (healthError && (healthError.message?.includes('Invalid API key') || healthError.message?.includes('JWT'))) {
        setError('Error de configuración: Las credenciales de Supabase no son válidas. Verifica tu archivo .env.local')
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone || null,
          },
        },
      })

      if (signUpError) {
        // Mejorar mensajes de error específicos
        console.error('Registration error:', signUpError)
        
        const errorMessage = signUpError.message || 'Error desconocido'
        
        if (errorMessage.includes('User already registered') || 
            errorMessage.includes('already registered') ||
            errorMessage.includes('already exists')) {
          setError('Este email ya está registrado. Si ya tienes una cuenta, intenta iniciar sesión en su lugar.')
        } else if (errorMessage.includes('Password') || 
                   errorMessage.includes('password') ||
                   errorMessage.includes('weak')) {
          setError('La contraseña debe tener al menos 6 caracteres y ser segura.')
        } else if (errorMessage.includes('Email') || 
                   errorMessage.includes('email') ||
                   errorMessage.includes('invalid')) {
          setError('El formato del email no es válido. Por favor, verifica que el email sea correcto.')
        } else if (errorMessage.includes('fetch') || 
                   errorMessage.includes('network')) {
          setError('Error de conexión: No se pudo conectar con Supabase. Verifica que tus credenciales en .env.local sean correctas y que tu proyecto de Supabase esté activo.')
        } else if (errorMessage.includes('Invalid API key') ||
                   errorMessage.includes('JWT')) {
          setError('Error: Credenciales de Supabase inválidas. Verifica tu archivo .env.local')
        } else {
          setError(`Error al registrarse: ${errorMessage}`)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        // Actualizar el perfil en la tabla users (incluyendo email)
        const { error: updateError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            full_name: formData.fullName,
            email: formData.email, // Agregar email también
            phone: formData.phone || null,
          })

        if (updateError) {
          console.error('Error updating profile:', updateError)
          // Si hay error de permisos RLS, intentar de nuevo después de un momento
          const errorMessage = updateError.message || ''
          if (errorMessage.includes('permission denied') || errorMessage.includes('row-level security')) {
            // Esperar un momento y reintentar
            await new Promise(resolve => setTimeout(resolve, 500))
            const { error: retryError } = await supabase
              .from('users')
              .upsert({
                id: data.user.id,
                full_name: formData.fullName,
                email: formData.email, // Agregar email también
                phone: formData.phone || null,
              })
            
            if (retryError) {
              console.error('Error updating profile after retry:', retryError)
              // No bloquear el registro si falla la actualización del perfil
              // El usuario puede actualizar su perfil después
            }
          } else {
            // Si es otro tipo de error, mostrar un mensaje pero no bloquear el registro
            console.warn('Error al actualizar perfil (no crítico):', errorMessage)
          }
        }

        // Esperar un momento para que las cookies se establezcan
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Verificar que la sesión se haya establecido
        const { data: sessionData } = await supabase.auth.getSession()
        
        if (sessionData?.session) {
          window.location.href = '/auth/redirect'
        } else {
          // Si no hay sesión, puede ser que necesite confirmar el email
          setError('Registro exitoso. Por favor, revisa tu email para confirmar tu cuenta antes de iniciar sesión.')
          setLoading(false)
        }
      } else {
        setError('No se pudo crear el usuario. Intenta nuevamente.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      const errorMessage = err?.message || 'Error desconocido'
      
      if (errorMessage.includes('variables de entorno')) {
        setError('Error de configuración: Faltan las variables de entorno de Supabase. Crea un archivo .env.local con tus credenciales.')
      } else if (errorMessage.includes('fetch')) {
        setError('Error de conexión: No se pudo conectar con Supabase. Verifica tu conexión a internet y tus credenciales.')
      } else {
        setError('Error inesperado: ' + errorMessage)
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Registro de Paciente
          </h1>
          <p className="text-gray-600">
            Completa el formulario para crear tu cuenta
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono <span className="text-gray-500">(opcional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse como Paciente'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  )
}

