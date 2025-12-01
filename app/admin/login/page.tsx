'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    
    // Primero intentar iniciar sesión
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Verificar si el usuario es administrador
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (adminError) {
      console.error('Error checking admin:', adminError)
      // Si es error de RLS o permisos, mostrar mensaje más específico
      if (adminError.message.includes('permission denied') || adminError.message.includes('row-level security') || adminError.message.includes('RLS')) {
        setError('Error de permisos al verificar administrador. Verifica que el script SQL se ejecutó correctamente y que RLS esté configurado.')
      } else {
        setError(`Error al verificar administrador: ${adminError.message}`)
      }
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (!adminUser) {
      await supabase.auth.signOut()
      setError('No tienes permisos de administrador.')
      setLoading(false)
      return
    }

    console.log('Admin Login - Login successful, waiting for session...')
    
    // Esperar y verificar que la sesión esté lista
    // Hacer múltiples intentos para asegurar que las cookies se establezcan
    let sessionReady = false
    let attempts = 0
    const maxAttempts = 15
    
    while (attempts < maxAttempts && !sessionReady) {
      await new Promise(resolve => setTimeout(resolve, 300))
      attempts++
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      console.log(`Admin Login - Session check attempt ${attempts}:`, {
        hasSession: !!sessionData?.session,
        sessionError: sessionError?.message,
        userId: sessionData?.session?.user?.id
      })
      
      if (sessionData?.session && !sessionError && sessionData.session.user) {
        console.log('Admin Login - Session ready!')
        sessionReady = true
        break
      }
    }
    
    if (!sessionReady) {
      console.error('Admin Login - Session not ready after', maxAttempts, 'attempts')
      setError('Error al establecer la sesión. Por favor, recarga la página e intenta nuevamente.')
      setLoading(false)
      return
    }

    // Esperar un momento adicional para que las cookies se propaguen completamente
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('Admin Login - Redirecting to dashboard')
    
    // Usar window.location.href para forzar una navegación completa
    // Esto asegura que las cookies se envíen correctamente al servidor
    window.location.href = '/admin/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary-700">
          Acceso Administrador
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Ingresa tus credenciales de administrador
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="admin@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            Volver a inicio de sesión de usuario
          </Link>
        </p>
      </div>
    </div>
  )
}


