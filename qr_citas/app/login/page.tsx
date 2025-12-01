'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('No se pudo iniciar sesión. Intenta nuevamente.')
        setLoading(false)
        return
      }

      // Verificar que la sesión se haya establecido
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        setError('Error al establecer la sesión. Intenta nuevamente.')
        setLoading(false)
        return
      }

      if (!sessionData.session) {
        setError('No se pudo establecer la sesión. Intenta nuevamente.')
        setLoading(false)
        return
      }

      // Esperar un momento para que las cookies se establezcan
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verificar nuevamente la sesión para asegurar que esté establecida
      const { data: finalSessionData } = await supabase.auth.getSession()
      if (!finalSessionData?.session) {
        setError('No se pudo establecer la sesión. Intenta nuevamente.')
        setLoading(false)
        return
      }
      
      // Verificar si es administrador o paciente
      let isAdmin = false
      try {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle()
        
        isAdmin = !!adminUser
      } catch (adminCheckError) {
        // Si hay error verificando admin, asumir que es paciente
        console.log('Error checking admin status, defaulting to patient:', adminCheckError)
        isAdmin = false
      }

      // Redirigir directamente al dashboard correspondiente usando window.location para forzar recarga completa
      if (isAdmin) {
        window.location.href = '/admin/dashboard'
      } else {
        window.location.href = '/dashboard'
      }
      
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Clínica Dental
          </h1>
          <p className="text-gray-600">
            Sistema de Gestión de Citas
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
            Regístrate como paciente
          </Link>
        </p>
      </div>
    </div>
  )
}

