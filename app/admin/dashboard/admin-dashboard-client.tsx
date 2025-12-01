'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { formatDate, formatTime, generateUniqueCode } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Appointment {
  id: string
  date: string
  time: string
  status: string
  code: string
  created_at: string
  user_id: string
  users: {
    full_name: string | null
    email: string
  }
}

interface UserProfile {
  id: string
  full_name: string | null
  email: string
  phone: string | null
}

export default function AdminDashboardClient({ user }: { user: User }) {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [manualCode, setManualCode] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCreatePatient, setShowCreatePatient] = useState(false)
  const [showPatientsList, setShowPatientsList] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stats, setStats] = useState({
    total: 0,
    recibidos: 0,
    noPresento: 0,
    canceladas: 0,
    totalPacientes: 0,
  })
  const [kpis, setKpis] = useState({
    attendanceRate: 0,
    cancellationRate: 0,
    noShowRate: 0, // Nuevo KPI: porcentaje de no presentados
    avgAppointmentsPerDay: 0,
    weeklyActiveUsers: 0,
    dailyAppointmentsData: [] as { date: string; count: number }[],
    statusDistribution: [] as { name: string; value: number }[],
  })
  const [loadingKpis, setLoadingKpis] = useState(false)
  const [showKpis, setShowKpis] = useState(false)

  useEffect(() => {
    loadAppointments()
    loadUsers()
    if (showKpis) {
      loadKpis()
    }
  }, [selectedDate])

  useEffect(() => {
    if (showKpis) {
      loadKpis()
    }
  }, [showKpis])

  // Recargar KPIs automáticamente cuando cambien las citas (cada 30 segundos si están visibles)
  useEffect(() => {
    if (!showKpis) return

    const interval = setInterval(() => {
      loadKpis()
    }, 30000) // Actualizar cada 30 segundos

    return () => clearInterval(interval)
  }, [showKpis])

  const loadAppointments = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        users:user_id (
          full_name,
          email
        )
      `)
      .eq('date', selectedDate)
      .order('time', { ascending: true })

    if (error) {
      console.error('Error loading appointments:', error)
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('La tabla appointments no existe. Ejecuta la migración SQL en Supabase.')
      } else if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
        console.error('Error de permisos. Verifica las políticas RLS en Supabase.')
      }
      setAppointments([])
    } else {
      setAppointments(data || [])
      calculateStats(data || [])
    }
    setLoading(false)
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone')
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Error loading users:', error)
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('La tabla users no existe. Ejecuta la migración SQL en Supabase.')
      }
      setAvailableUsers([])
      setStats((prev) => ({ ...prev, totalPacientes: 0 }))
    } else {
      setAvailableUsers(data || [])
      setStats((prev) => ({ ...prev, totalPacientes: data?.length || 0 }))
    }
    setLoadingUsers(false)
  }

  const calculateStats = (apps: Appointment[]) => {
    setStats((prev) => ({
      ...prev,
      total: apps.length,
      recibidos: apps.filter((a) => a.status === 'recibido').length,
      noPresento: apps.filter((a) => a.status === 'no_presentó').length,
      canceladas: apps.filter((a) => a.status === 'cancelada').length,
    }))
  }

  const loadKpis = async () => {
    setLoadingKpis(true)
    const supabase = createClient()
    
    try {
      // Cargar todas las citas (no solo del día seleccionado)
      const { data: allAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: false })

      if (appointmentsError) {
        console.error('Error loading appointments for KPIs:', appointmentsError)
        setLoadingKpis(false)
        return
      }

      // Cargar todos los usuarios
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id')

      if (usersError) {
        console.error('Error loading users for KPIs:', usersError)
      }

      // Actualizar total de pacientes
      setStats((prev) => ({
        ...prev,
        totalPacientes: allUsers?.length || 0,
      }))

      if (!allAppointments || allAppointments.length === 0) {
        setLoadingKpis(false)
        return
      }

      // Calcular KPIs
      const total = allAppointments.length
      const recibidos = allAppointments.filter((a) => a.status === 'recibido').length
      const canceladas = allAppointments.filter((a) => a.status === 'cancelada').length
      const noPresento = allAppointments.filter((a) => a.status === 'no_presentó').length
      const pendientes = allAppointments.filter((a) => a.status === 'pendiente').length

      // 1. Tasa de asistencia (recibidos / total no canceladas)
      const totalNoCanceladas = total - canceladas
      const attendanceRate = totalNoCanceladas > 0 ? (recibidos / totalNoCanceladas) * 100 : 0

      // 2. Tasa de cancelación
      const cancellationRate = total > 0 ? (canceladas / total) * 100 : 0

      // 3. Tasa de no presentados (no_presentó / total no canceladas)
      const noShowRate = totalNoCanceladas > 0 ? (noPresento / totalNoCanceladas) * 100 : 0

      // 4. Promedio de citas por día
      const appointmentsByDate: Record<string, number> = {}
      allAppointments.forEach((apt) => {
        appointmentsByDate[apt.date] = (appointmentsByDate[apt.date] || 0) + 1
      })
      const avgAppointmentsPerDay =
        Object.keys(appointmentsByDate).length > 0
          ? Object.values(appointmentsByDate).reduce((a, b) => a + b, 0) /
            Object.keys(appointmentsByDate).length
          : 0

      // 5. Usuarios activos semanalmente (últimos 7 días)
      // Usar fecha local para evitar problemas de zona horaria
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setHours(0, 0, 0, 0)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const weeklyAppointments = allAppointments.filter((apt) => {
        // Parsear fecha como local (YYYY-MM-DD)
        const [year, month, day] = apt.date.split('-').map(Number)
        const appointmentDate = new Date(year, month - 1, day)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate >= sevenDaysAgo
      })
      const weeklyActiveUserIds = new Set(weeklyAppointments.map((apt) => apt.user_id))
      const weeklyActiveUsers = weeklyActiveUserIds.size

      // 6. Datos para gráfico de citas por día (últimos 30 días)
      // Usar fecha local para evitar problemas de zona horaria
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setHours(0, 0, 0, 0)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentAppointments = allAppointments.filter((apt) => {
        // Parsear fecha como local (YYYY-MM-DD)
        const [year, month, day] = apt.date.split('-').map(Number)
        const appointmentDate = new Date(year, month - 1, day)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate >= thirtyDaysAgo
      })
      const dailyData: Record<string, number> = {}
      recentAppointments.forEach((apt) => {
        dailyData[apt.date] = (dailyData[apt.date] || 0) + 1
      })
      const dailyAppointmentsData = Object.entries(dailyData)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14) // Últimos 14 días

      // 7. Distribución de estados
      const statusDistribution = [
        { name: 'Recibidos', value: recibidos },
        { name: 'Canceladas', value: canceladas },
        { name: 'No Presentaron', value: noPresento },
        { name: 'Pendientes', value: pendientes },
      ]

      setKpis({
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        noShowRate: Math.round(noShowRate * 10) / 10,
        avgAppointmentsPerDay: Math.round(avgAppointmentsPerDay * 10) / 10,
        weeklyActiveUsers,
        dailyAppointmentsData,
        statusDistribution,
      })
    } catch (error) {
      console.error('Error calculating KPIs:', error)
    } finally {
      setLoadingKpis(false)
    }
  }

  const handleMarkReceived = async (appointmentId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'recibido' })
      .eq('id', appointmentId)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadAppointments()
      // Siempre recargar KPIs para mantenerlos actualizados
      loadKpis()
    }
  }

  const handleMarkNoShow = async (appointmentId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'no_presentó' })
      .eq('id', appointmentId)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadAppointments()
      // Siempre recargar KPIs para mantenerlos actualizados
      loadKpis()
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita? La hora quedará disponible para otro paciente.')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelada' })
      .eq('id', appointmentId)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadAppointments()
      // Siempre recargar KPIs para mantenerlos actualizados
      loadKpis()
    }
  }

  const handleManualCode = async () => {
    if (!manualCode.trim()) {
      alert('Por favor ingresa un código')
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('code', manualCode.toUpperCase())
      .eq('date', selectedDate)
      .single()

    if (error || !data) {
      alert('Código no encontrado para la fecha seleccionada')
      return
    }

    if (data.status === 'recibido') {
      alert('Esta cita ya fue marcada como recibida')
      return
    }

    await handleMarkReceived(data.id)
    setManualCode('')
  }

  const handleQRScan = async (qrData: string) => {
    try {
      console.log('QR Data recibido:', qrData)
      
      // Intentar parsear como JSON
      let data: any
      try {
        data = JSON.parse(qrData)
      } catch (parseError) {
        // Si no es JSON, intentar buscar el código directamente
        console.log('No es JSON, buscando por código...')
        const supabase = createClient()
        const { data: appointmentByCode, error: codeError } = await supabase
          .from('appointments')
          .select('*')
          .eq('code', qrData.toUpperCase())
          .eq('date', selectedDate)
          .maybeSingle()

        if (appointmentByCode) {
          if (appointmentByCode.status === 'recibido') {
            alert('Esta cita ya fue marcada como recibida')
            return
          }
          await handleMarkReceived(appointmentByCode.id)
          setShowScanner(false)
          return
        } else {
          alert('Cita no encontrada. Verifica que el código QR sea correcto y que la fecha seleccionada sea la correcta.')
          return
        }
      }

      // Si es JSON, usar appointmentId
      const appointmentId = data.appointmentId || data.id

      if (!appointmentId) {
        alert('El código QR no contiene información válida de la cita.')
        return
      }

      const supabase = createClient()
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('date', selectedDate)
        .maybeSingle()

      if (error) {
        console.error('Error al buscar cita:', error)
        alert('Error al buscar la cita: ' + (error.message || 'Error desconocido'))
        return
      }

      if (!appointment) {
        alert('Cita no encontrada para la fecha seleccionada. Verifica que la fecha sea correcta.')
        return
      }

      if (appointment.status === 'recibido') {
        alert('Esta cita ya fue marcada como recibida')
        return
      }

      if (appointment.status === 'cancelada') {
        alert('Esta cita está cancelada y no puede ser marcada como recibida.')
        return
      }

      await handleMarkReceived(appointmentId)
      setShowScanner(false)
      alert('✅ Cita marcada como recibida exitosamente')
    } catch (err: any) {
      console.error('Error al procesar QR:', err)
      alert('Error al leer el código QR: ' + (err.message || 'Error desconocido'))
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Clínica Dental</h1>
                <p className="text-xs text-gray-500">Panel de Administración</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Citas</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600">Total Pacientes</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalPacientes}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Atendidos</p>
            <p className="text-2xl font-bold text-green-600">{stats.recibidos}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">No Presentaron</p>
            <p className="text-2xl font-bold text-red-600">{stats.noPresento}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
            <p className="text-sm text-gray-600">Canceladas</p>
            <p className="text-2xl font-bold text-gray-600">{stats.canceladas}</p>
          </div>
        </div>

        {/* Botón para mostrar/ocultar KPIs */}
        <div className="mb-6">
          <button
            onClick={() => setShowKpis(!showKpis)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg font-semibold"
          >
            {showKpis ? '📊 Ocultar KPIs' : '📊 Ver KPIs y Gráficos'}
          </button>
        </div>

        {/* Sección de KPIs */}
        {showKpis && (
          <div className="mb-6 space-y-6">
            {/* Tarjetas de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border border-green-200">
                <p className="text-sm font-medium text-green-700 mb-1">Tasa de Asistencia</p>
                <p className="text-3xl font-bold text-green-800">{kpis.attendanceRate}%</p>
                <p className="text-xs text-green-600 mt-2">
                  {kpis.attendanceRate >= 80 ? '✅ Excelente' : kpis.attendanceRate >= 60 ? '⚠️ Mejorable' : '❌ Bajo'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6 border border-red-200">
                <p className="text-sm font-medium text-red-700 mb-1">Tasa de Cancelación</p>
                <p className="text-3xl font-bold text-red-800">{kpis.cancellationRate}%</p>
                <p className="text-xs text-red-600 mt-2">
                  {kpis.cancellationRate <= 10 ? '✅ Bajo' : kpis.cancellationRate <= 20 ? '⚠️ Moderado' : '❌ Alto'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-6 border border-orange-200">
                <p className="text-sm font-medium text-orange-700 mb-1">Tasa de No Presentados</p>
                <p className="text-3xl font-bold text-orange-800">{kpis.noShowRate}%</p>
                <p className="text-xs text-orange-600 mt-2">
                  {kpis.noShowRate <= 5 ? '✅ Excelente' : kpis.noShowRate <= 15 ? '⚠️ Moderado' : '❌ Alto'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">Promedio Citas/Día</p>
                <p className="text-3xl font-bold text-blue-800">{kpis.avgAppointmentsPerDay}</p>
                <p className="text-xs text-blue-600 mt-2">Citas por día en promedio</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border border-purple-200">
                <p className="text-sm font-medium text-purple-700 mb-1">Usuarios Activos (7 días)</p>
                <p className="text-3xl font-bold text-purple-800">{kpis.weeklyActiveUsers}</p>
                <p className="text-xs text-purple-600 mt-2">Pacientes activos esta semana</p>
              </div>
            </div>

            {/* Gráficos */}
            {loadingKpis ? (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                Cargando KPIs...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de citas por día */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Citas por Día (Últimos 14 días)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={kpis.dailyAppointmentsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => {
                          // Parsear fecha como local (YYYY-MM-DD) para evitar problemas de zona horaria
                          const [year, month, day] = value.split('-').map(Number)
                          const date = new Date(year, month - 1, day)
                          return `${date.getDate()}/${date.getMonth() + 1}`
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => {
                          // Parsear fecha como local (YYYY-MM-DD) para evitar problemas de zona horaria
                          const [year, month, day] = value.split('-').map(Number)
                          const date = new Date(year, month - 1, day)
                          return date.toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        name="Citas"
                        dot={{ fill: '#4F46E5', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Gráfico de distribución de estados */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Distribución de Estados
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={kpis.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {kpis.statusDistribution.map((entry, index) => {
                          const colors = ['#10B981', '#6B7280', '#EF4444', '#F59E0B']
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        })}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filtro de fecha y acciones */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setShowPatientsList(!showPatientsList)
                  if (!showPatientsList) {
                    loadUsers()
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
              >
                {showPatientsList ? 'Ocultar' : 'Ver'} Pacientes
              </button>
              <button
                onClick={() => {
                  setShowCreatePatient(!showCreatePatient)
                  if (showCreatePatient) {
                    setShowCreatePatient(false)
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
              >
                {showCreatePatient ? 'Cancelar' : 'Crear Paciente'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm)
                  if (showCreateForm) {
                    setShowCreateForm(false)
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
              >
                {showCreateForm ? 'Cancelar' : 'Crear Cita'}
              </button>
              <button
                onClick={() => setShowScanner(!showScanner)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                {showScanner ? 'Cerrar' : 'Escanear'} QR
              </button>
            </div>
          </div>

          {/* Ingreso manual de código */}
          <div className="mt-4 pt-4 border-t">
            <label htmlFor="manualCode" className="block text-sm font-medium text-gray-700 mb-1">
              Ingresar Código del Paciente Manualmente
            </label>
            <div className="flex space-x-2">
              <input
                id="manualCode"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                maxLength={6}
              />
              <button
                onClick={handleManualCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Marcar como Atendido
              </button>
            </div>
          </div>
        </div>

        {/* Lista de pacientes */}
        {showPatientsList && (
          <PatientsList
            patients={availableUsers}
            loading={loadingUsers}
            onRefresh={loadUsers}
          />
        )}

        {/* Formulario de creación de paciente */}
        {showCreatePatient && (
          <CreatePatientForm
            onSuccess={() => {
              setShowCreatePatient(false)
              loadUsers()
              // Siempre recargar KPIs para mantenerlos actualizados
              loadKpis()
            }}
          />
        )}

        {/* Formulario de creación de cita */}
        {showCreateForm && (
          <CreateAppointmentForm
            selectedDate={selectedDate}
            availableUsers={availableUsers}
            onSuccess={() => {
              setShowCreateForm(false)
              loadAppointments()
              loadUsers()
              // Siempre recargar KPIs para mantenerlos actualizados
              loadKpis()
            }}
          />
        )}

        {/* Scanner QR */}
        {showScanner && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Escanear Código QR del Paciente</h3>
            <QRScanner onScan={handleQRScan} />
          </div>
        )}

        {/* Lista de citas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Citas del Día</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-500">Cargando...</div>
          ) : appointments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No hay citas para esta fecha</div>
          ) : (
            <div className="divide-y">
              {appointments.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  onMarkReceived={handleMarkReceived}
                  onMarkNoShow={handleMarkNoShow}
                  onCancel={handleCancelAppointment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AppointmentRow({
  appointment,
  onMarkReceived,
  onMarkNoShow,
  onCancel,
}: {
  appointment: Appointment
  onMarkReceived: (id: string) => void
  onMarkNoShow: (id: string) => void
  onCancel: (id: string) => void
}) {
  const statusColors = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    recibido: 'bg-green-100 text-green-800',
    no_presentó: 'bg-red-100 text-red-800',
    cancelada: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    pendiente: 'Pendiente',
    recibido: 'Atendido',
    no_presentó: 'No se presentó',
    cancelada: 'Cancelada',
  }

  const userName = appointment.users?.full_name || appointment.users?.email || 'Usuario'
  const isPast = new Date(`${appointment.date}T${appointment.time}`) < new Date()

  return (
    <div className="p-6 hover:bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{userName}</h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[appointment.status as keyof typeof statusColors] || statusColors.pendiente
              }`}
            >
              {statusLabels[appointment.status as keyof typeof statusLabels] || appointment.status}
            </span>
          </div>
          <p className="text-gray-600">
            {formatTime(appointment.time)} - Código: <span className="font-mono font-bold">{appointment.code}</span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          {appointment.status === 'pendiente' && (
            <>
              <button
                onClick={() => onMarkReceived(appointment.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                Marcar como Atendido
              </button>
              {isPast && (
                <button
                  onClick={() => onMarkNoShow(appointment.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                >
                  No se Presentó
                </button>
              )}
              <button
                onClick={() => onCancel(appointment.id)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
              >
                Cancelar
              </button>
            </>
          )}
          {appointment.status === 'cancelada' && (
            <span className="text-sm text-gray-500 italic">Hora disponible</span>
          )}
        </div>
      </div>
    </div>
  )
}

function QRScanner({ onScan }: { onScan: (data: string) => void }) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (scanning && scannerRef.current) {
      startScanner()
    } else {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [scanning])

  const startScanner = async () => {
    try {
      // Importar html5-qrcode de forma correcta
      // En Next.js, necesitamos usar import dinámico con el nombre completo
      const { Html5Qrcode } = await import('html5-qrcode')
      
      if (!Html5Qrcode || typeof Html5Qrcode !== 'function') {
        console.error('Html5Qrcode no es una función válida:', typeof Html5Qrcode)
        setError('No se pudo cargar el módulo de escaneo QR. Recarga la página e intenta nuevamente.')
        setScanning(false)
        return
      }
      
      if (!scannerRef.current) {
        setError('No se pudo inicializar el escáner. Recarga la página e intenta nuevamente.')
        setScanning(false)
        return
      }

      // Asegurar que el elemento tenga un ID único
      const scannerId = scannerRef.current.id || 'qr-reader-' + Date.now()
      if (!scannerRef.current.id) {
        scannerRef.current.id = scannerId
      }

      console.log('Inicializando Html5Qrcode con ID:', scannerId)
      const html5QrCode = new Html5Qrcode(scannerId)
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log('QR escaneado:', decodedText)
          onScan(decodedText)
          stopScanner()
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo (son normales mientras busca QR)
          // Solo mostrar errores críticos
          if (errorMessage && !errorMessage.includes('NotFoundException')) {
            console.log('Error de escaneo (puede ignorarse):', errorMessage)
          }
        }
      )
    } catch (err: any) {
      console.error('Error al iniciar escáner:', err)
      const errorMsg = err.message || 'Error desconocido'
      
      if (errorMsg.includes('camera') || errorMsg.includes('permission')) {
        setError('No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara en la configuración del navegador.')
      } else if (errorMsg.includes('NotFound')) {
        setError('No se encontró una cámara. Asegúrate de tener una cámara conectada.')
      } else {
        setError(`Error al iniciar el escáner: ${errorMsg}`)
      }
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      } catch (err) {
        // Ignorar errores al detener
      }
      html5QrCodeRef.current = null
    }
  }

  return (
    <div>
      {!scanning ? (
        <button
          onClick={() => setScanning(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          Activar Escáner QR
        </button>
      ) : (
        <div>
          <div
            id={`qr-reader-${Date.now()}`}
            ref={scannerRef}
            className="w-full max-w-md mx-auto"
          />
          {error && (
            <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          <button
            onClick={() => {
              setScanning(false)
              setError('')
              stopScanner()
            }}
            className="mt-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
          >
            Detener Escáner
          </button>
        </div>
      )}
      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}

function PatientsList({
  patients,
  loading,
  onRefresh,
}: {
  patients: UserProfile[]
  loading: boolean
  onRefresh: () => void
}) {
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [patientAppointments, setPatientAppointments] = useState<Record<string, number>>({})

  useEffect(() => {
    if (patients.length > 0) {
      loadAppointmentCounts()
    }
  }, [patients])

  const loadAppointmentCounts = async () => {
    const counts: Record<string, number> = {}
    
    for (const patient of patients) {
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', patient.id)
      
      counts[patient.id] = count || 0
    }
    
    setPatientAppointments(counts)
  }

  const filteredPatients = patients.filter((patient) => {
    const search = searchTerm.toLowerCase()
    return (
      (patient.full_name?.toLowerCase().includes(search) || false) ||
      patient.email.toLowerCase().includes(search) ||
      (patient.phone?.toLowerCase().includes(search) || false)
    )
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="text-center text-gray-500">Cargando pacientes...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Lista de Pacientes ({filteredPatients.length})
        </h3>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          🔄 Actualizar
        </button>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No hay pacientes registrados</p>
          <p className="text-sm">Los pacientes aparecerán aquí una vez que se registren en el sistema.</p>
        </div>
      ) : (
        <>
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lista de pacientes */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Teléfono</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Citas</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      No se encontraron pacientes que coincidan con la búsqueda
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">
                          {patient.full_name || 'Sin nombre'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-600 text-sm">{patient.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-600 text-sm">
                          {patient.phone || 'Sin teléfono'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {patientAppointments[patient.id] || 0} citas
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function CreatePatientForm({ onSuccess }: { onSuccess: () => void }) {
  const [patientName, setPatientName] = useState('')
  const [patientEmail, setPatientEmail] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!patientName || !patientEmail) {
        setError('El nombre y el email son obligatorios.')
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Verificar que el usuario actual sea administrador (en el cliente, donde las cookies funcionan)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('No estás autenticado. Por favor, inicia sesión nuevamente.')
        setLoading(false)
        return
      }

      // Verificar si es administrador
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (adminError || !adminUser) {
        setError('No tienes permisos de administrador.')
        setLoading(false)
        return
      }

      // Llamar al endpoint API para crear el paciente (incluyendo userId para verificación adicional)
      const response = await fetch('/api/admin/create-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: patientName,
          email: patientEmail,
          phone: patientPhone || null,
          userId: user.id, // Enviar userId para verificación adicional en el servidor
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setError(data.error || 'Error al crear el paciente')
        setLoading(false)
        return
      }

      // Limpiar formulario
      const savedName = patientName
      const savedEmail = patientEmail
      setPatientName('')
      setPatientEmail('')
      setPatientPhone('')
      setLoading(false)
      onSuccess()
      
      alert(`✅ ¡Paciente creado exitosamente!\n\n📋 Nombre: ${savedName}\n📧 Email: ${savedEmail}\n\n${data.note || 'El paciente ya está en el sistema y puedes crearle citas.'}`)
    } catch (err: any) {
      setError(err.message || 'Error al crear el paciente')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Crear Nuevo Paciente</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <input
            id="patientName"
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="patientEmail"
            type="email"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="juan@ejemplo.com"
          />
        </div>

        <div>
          <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            id="patientPhone"
            type="tel"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1234567890"
          />
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'Creando...' : 'Crear Paciente'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPatientName('')
              setPatientEmail('')
              setPatientPhone('')
              setError('')
              onSuccess()
            }}
            className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

function CreateAppointmentForm({
  selectedDate,
  availableUsers,
  onSuccess,
}: {
  selectedDate: string
  availableUsers: UserProfile[]
  onSuccess: () => void
}) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [occupiedTimes, setOccupiedTimes] = useState<Set<string>>(new Set())
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [createdAppointment, setCreatedAppointment] = useState<{
    id: string
    code: string
    date: string
    time: string
    patientName: string
  } | null>(null)

  // Generar horarios disponibles (8:00 AM - 8:00 PM, cada 30 minutos)
  const availableTimes = []
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      availableTimes.push(timeStr)
    }
  }

  // Cargar horarios ocupados cuando cambia la fecha seleccionada
  useEffect(() => {
    loadOccupiedTimes()
  }, [selectedDate])

  const loadOccupiedTimes = async () => {
    setLoadingTimes(true)
    const supabase = createClient()
    
    try {
      // Cargar todas las citas para la fecha seleccionada que NO estén canceladas
      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('time')
        .eq('date', selectedDate)
        .neq('status', 'cancelada')

      if (error) {
        console.error('Error loading occupied times:', error)
        setOccupiedTimes(new Set())
      } else {
        // Crear un Set con los horarios ocupados
        const occupied = new Set(
          existingAppointments?.map((apt) => apt.time) || []
        )
        setOccupiedTimes(occupied)
      }
    } catch (err) {
      console.error('Error loading occupied times:', err)
      setOccupiedTimes(new Set())
    } finally {
      setLoadingTimes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      // Validar que no sea una hora pasada
      const appointmentDateTime = new Date(`${selectedDate}T${time}`)
      const now = new Date()
      if (appointmentDateTime < now) {
        setError('No se puede agendar una cita en una hora pasada.')
        setLoading(false)
        return
      }

      // Verificar si el horario está ocupado (doble verificación)
      if (occupiedTimes.has(time)) {
        setError('Este horario ya está ocupado. Por favor, selecciona otro.')
        setLoading(false)
        // Recargar horarios ocupados por si acaso
        loadOccupiedTimes()
        return
      }

      // Verificación adicional en el servidor (por si hay cambios desde que se cargaron)
      const { data: existing } = await supabase
        .from('appointments')
        .select(`
          id,
          users:user_id (
            full_name,
            email
          )
        `)
        .eq('date', selectedDate)
        .eq('time', time)
        .neq('status', 'cancelada')
        .maybeSingle()

      if (existing) {
        // Manejar el caso donde users puede ser un objeto o un array
        const userData = Array.isArray(existing.users) ? existing.users[0] : existing.users
        const patientName = userData?.full_name || userData?.email || 'otro paciente'
        setError(`Este horario ya está ocupado por ${patientName}. Por favor, selecciona otro.`)
        setLoading(false)
        // Actualizar la lista de horarios ocupados
        loadOccupiedTimes()
        return
      }

      if (!selectedUserId) {
        setError('Por favor selecciona un paciente.')
        setLoading(false)
        return
      }

      if (!time) {
        setError('Por favor selecciona una hora.')
        setLoading(false)
        return
      }

      // Generar código único
      const code = generateUniqueCode()

      // Insertar la cita
      const { data: insertedData, error: insertError } = await supabase
        .from('appointments')
        .insert({
          user_id: selectedUserId,
          date: selectedDate,
          time,
          status: 'pendiente',
          code,
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.message.includes('relation') || insertError.message.includes('does not exist')) {
          setError('La base de datos no está configurada. Ejecuta la migración SQL en Supabase (supabase/migrations/001_initial_schema.sql).')
        } else if (insertError.message.includes('permission denied') || insertError.message.includes('row-level security') || insertError.message.includes('RLS')) {
          setError('Error de permisos. Verifica que la política "Admins can create appointments" esté creada en Supabase. Ejecuta la migración SQL completa.')
        } else if (insertError.message.includes('foreign key') || insertError.message.includes('violates foreign key')) {
          setError('Error: El usuario no existe en la base de datos. Asegúrate de que el paciente esté registrado en auth.users y en public.users.')
        } else if (insertError.message.includes('unique') || insertError.message.includes('duplicate')) {
          setError('Este código ya existe. Intenta crear la cita nuevamente.')
        } else {
          setError(`Error: ${insertError.message}`)
        }
        setLoading(false)
      } else {
        // Obtener nombre del paciente
        const selectedPatient = availableUsers.find(u => u.id === selectedUserId)
        const patientName = selectedPatient?.full_name || selectedPatient?.email || 'Paciente'
        
        // Guardar datos de la cita creada para mostrar la tarjeta QR
        setCreatedAppointment({
          id: insertedData.id,
          code: code,
          date: selectedDate,
          time: time,
          patientName: patientName,
        })
        
        // Limpiar formulario
        setSelectedUserId('')
        setTime('')
        setLoading(false)
        // Actualizar horarios ocupados
        loadOccupiedTimes()
        // No llamar onSuccess todavía, esperar a que el usuario cierre la tarjeta QR
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear la cita')
      setLoading(false)
    }
  }

  // Si se creó una cita, mostrar la tarjeta QR
  if (createdAppointment) {
    return (
      <AppointmentQRCard
        appointment={createdAppointment}
        onClose={() => {
          setCreatedAppointment(null)
          onSuccess()
        }}
      />
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Crear Nueva Cita</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {availableUsers.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            <p className="font-semibold mb-2">No hay pacientes registrados</p>
            <p className="text-sm mb-3">Los pacientes deben registrarse primero en el sistema antes de poder agendar citas.</p>
            <p className="text-sm font-semibold mb-2">Opciones:</p>
            <ul className="text-sm list-disc list-inside space-y-1 mb-3">
              <li>Pide al paciente que se registre en <code className="bg-yellow-100 px-1 rounded">/register</code></li>
              <li>Usa el botón "Crear Paciente" arriba para agregar información del paciente</li>
            </ul>
          </div>
        ) : (
          <div>
            <label htmlFor="selectedUser" className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Paciente *
            </label>
            <select
              id="selectedUser"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona un paciente</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email} {user.phone ? `(${user.phone})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
            Hora (8:00 AM - 8:00 PM)
            {loadingTimes && <span className="text-xs text-gray-500 ml-2">(Cargando horarios...)</span>}
          </label>
          <select
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            disabled={loadingTimes}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Selecciona una hora</option>
            {availableTimes.map((t) => {
              const timeDate = new Date(`${selectedDate}T${t}`)
              const isPast = timeDate < new Date()
              const isOccupied = occupiedTimes.has(t)
              const isDisabled = isPast || isOccupied
              
              return (
                <option key={t} value={t} disabled={isDisabled}>
                  {t} {isPast ? '(Pasada)' : isOccupied ? '(Ocupada)' : ''}
                </option>
              )
            })}
          </select>
          {occupiedTimes.size > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {occupiedTimes.size} horario(s) ocupado(s) en esta fecha
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'Creando...' : 'Crear Cita'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedUserId('')
              setTime('')
              setError('')
              onSuccess()
            }}
            className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}


// Componente de tarjeta QR para mostrar despu�s de crear la cita
function AppointmentQRCard({
  appointment,
  onClose,
}: {
  appointment: { id: string; code: string; date: string; time: string; patientName: string }
  onClose: () => void
}) {
  const [QRCode, setQRCode] = useState<any>(null)

  useEffect(() => {
    import('qrcode.react').then((mod) => {
      setQRCode(() => mod.QRCodeSVG)
    })
  }, [])

  const qrData = JSON.stringify({ appointmentId: appointment.id, code: appointment.code })

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 mb-6 border-2 border-blue-200">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">�Cita Creada Exitosamente!</h3>
        <p className="text-gray-600">Escanea el c�digo QR para verificar la cita</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Paciente</p>
              <p className="text-lg font-semibold text-gray-800">{appointment.patientName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Fecha</p>
              <p className="text-lg font-semibold text-gray-800">{formatDate(appointment.date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Hora</p>
              <p className="text-lg font-semibold text-gray-800">{appointment.time}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">C�digo �nico</p>
              <p className="text-2xl font-mono font-bold text-blue-700">{appointment.code}</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            {QRCode ? (
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-300">
                <QRCode value={qrData} size={250} />
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-300 w-[250px] h-[250px] flex items-center justify-center">
                <p className="text-gray-500">Cargando QR...</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-4 text-center max-w-[250px]">
              Escanea este c�digo QR para verificar la cita al llegar
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => {
            navigator.clipboard.writeText(appointment.code)
            alert(' C�digo copiado al portapapeles')
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
        >
           Copiar C�digo
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold shadow-md"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
