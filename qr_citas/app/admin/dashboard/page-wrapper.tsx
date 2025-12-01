'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminDashboardClient from './admin-dashboard-client'
import type { User } from '@supabase/supabase-js'

export default function AdminDashboardWrapper() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      
      // Obtener el usuario
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !authUser) {
        console.log('Admin Dashboard - No user found, redirecting')
        router.push('/admin/login')
        return
      }

      console.log('Admin Dashboard - User found:', authUser.id)

      // Verificar si es administrador
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (adminError) {
        console.error('Admin Dashboard - Error checking admin:', adminError)
        router.push('/admin/login')
        return
      }

      if (!adminUser) {
        console.log('Admin Dashboard - Not an admin, redirecting')
        router.push('/admin/login')
        return
      }

      console.log('Admin Dashboard - Access granted')
      setUser(authUser)
      setIsAdmin(true)
    } catch (error) {
      console.error('Admin Dashboard - Exception:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null // El redirect ya se manejó
  }

  return <AdminDashboardClient user={user} />
}

