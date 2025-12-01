'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardClient from './dashboard-client'
import type { User } from '@supabase/supabase-js'

export default function DashboardWrapper() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const supabase = createClient()
      
      // Verificar sesión con retry
      let retries = 3
      let userData = null
      
      while (retries > 0 && !userData) {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        
        if (userError && userError.message.includes('Auth session missing')) {
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500))
            continue
          }
        }
        
        if (currentUser) {
          userData = currentUser
          break
        }
        
        retries--
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (!userData) {
        console.log('No user found, redirecting to login')
        window.location.href = '/login'
        return
      }

      // Verificar si es administrador
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle()

      if (adminUser) {
        window.location.href = '/admin/dashboard'
        return
      }

      // Obtener perfil del usuario
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userData.id)
        .maybeSingle()

      setUser(userData)
      setProfile(userProfile)
      setLoading(false)
    } catch (error) {
      console.error('Error checking session:', error)
      window.location.href = '/login'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <DashboardClient user={user} profile={profile} />
}

