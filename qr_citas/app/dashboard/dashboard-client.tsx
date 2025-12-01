'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { formatDate, generateUniqueCode } from '@/lib/utils'

interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
}

interface Appointment {
  id: string
  date: string
  time: string
  status: string
  code: string
  created_at: string
}

// Lista de feriados (puedes expandir esta lista)
const HOLIDAYS = [
  '2024-01-01', // Año Nuevo
  '2024-12-25', // Navidad
  '2024-12-31', // Año Nuevo (víspera)
  '2025-01-01', // Año Nuevo
  '2025-12-25', // Navidad
  '2025-12-31', // Año Nuevo (víspera)
  // Agrega más feriados según necesites
]

// Función para verificar si una fecha es feriado
function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return HOLIDAYS.includes(dateStr)
}

// Función para verificar si una fecha es domingo (0) o sábado (6)
function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

// Función para obtener los próximos 30 días disponibles (excluyendo solo feriados)
function getAvailableDates(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let currentDate = new Date(today)
  let count = 0
  const maxDays = 60 // Buscar hasta 60 días en el futuro

  while (count < 30 && dates.length < maxDays) {
    // Solo excluir feriados, NO excluir fines de semana
    if (!isHoliday(currentDate)) {
      dates.push(new Date(currentDate))
      count++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

// Generar horarios disponibles (8:00 AM - 8:00 PM, cada 30 minutos)
function getAvailableTimes(): string[] {
  const times: string[] = []
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      times.push(timeStr)
    }
  }
  return times
}

export default function DashboardClient({ user, profile }: { user: User; profile: Profile | null }) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [occupiedTimes, setOccupiedTimes] = useState<Set<string>>(new Set())
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [createdAppointment, setCreatedAppointment] = useState<{
    id: string
    code: string
    date: string
    time: string
    patientName: string
  } | null>(null)

  // Validar que user existe
  if (!user || !user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: Usuario no válido</p>
          <a href="/login" className="text-blue-600 hover:text-blue-700">
            Volver al login
          </a>
        </div>
      </div>
    )
  }

  const availableDates = getAvailableDates()
  const allTimes = getAvailableTimes()

  useEffect(() => {
    loadMyAppointments()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      loadOccupiedTimes()
    } else {
      setOccupiedTimes(new Set())
    }
  }, [selectedDate])

  const loadMyAppointments = async () => {
    setLoadingAppointments(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (error) {
        console.error('Error loading appointments:', error)
        setMyAppointments([])
      } else {
        setMyAppointments(data || [])
      }
    } catch (err) {
      console.error('Error loading appointments:', err)
      setMyAppointments([])
    } finally {
      setLoadingAppointments(false)
    }
  }

  const loadOccupiedTimes = async () => {
    if (!selectedDate) return

    setLoadingTimes(true)
    const supabase = createClient()

    try {
      // Cargar todas las citas para la fecha seleccionada que NO estén canceladas
      // Solo seleccionamos 'time' para no exponer información sensible
      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('time, status')
        .eq('date', selectedDate)
        .neq('status', 'cancelada')

      if (error) {
        console.error('Error loading occupied times:', error)
        // Si hay error de permisos, intentar con una consulta más simple
        if (error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
          console.warn('RLS policy may need to be updated. Patients need to see all appointment times to check availability.')
          // Intentar cargar solo las citas del usuario actual como fallback
          const { data: myAppts } = await supabase
            .from('appointments')
            .select('time')
            .eq('date', selectedDate)
            .eq('user_id', user.id)
            .neq('status', 'cancelada')
          
          if (myAppts) {
            const occupied = new Set(myAppts.map((apt) => apt.time))
            setOccupiedTimes(occupied)
          } else {
            setOccupiedTimes(new Set())
          }
        } else {
          setOccupiedTimes(new Set())
        }
      } else {
        // Crear un Set con los horarios ocupados
        const occupied = new Set(
          existingAppointments
            ?.filter((apt) => apt.status !== 'cancelada')
            .map((apt) => apt.time) || []
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

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!selectedDate || !selectedTime) {
        setError('Por favor selecciona una fecha y hora.')
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Validar que no sea una hora pasada
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}`)
      const now = new Date()
      if (appointmentDateTime < now) {
        setError('No se puede agendar una cita en una hora pasada.')
        setLoading(false)
        return
      }

      // Verificar si el horario está ocupado
      if (occupiedTimes.has(selectedTime)) {
        setError('Este horario ya está ocupado. Por favor, selecciona otro.')
        setLoading(false)
        loadOccupiedTimes()
        return
      }

      // Verificación adicional en el servidor
      const { data: existing } = await supabase
        .from('appointments')
        .select('id')
        .eq('date', selectedDate)
        .eq('time', selectedTime)
        .neq('status', 'cancelada')
        .maybeSingle()

      if (existing) {
        setError('Este horario ya está ocupado. Por favor, selecciona otro.')
        setLoading(false)
        loadOccupiedTimes()
        return
      }

      // Verificar que el usuario existe en public.users antes de crear la cita
      // Si no existe, intentar crearlo automáticamente
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!userProfile) {
        console.warn('Usuario no existe en public.users, intentando crearlo...')
        // Intentar crear el perfil automáticamente
        const { error: createProfileError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: profile?.full_name || user.email?.split('@')[0] || 'Usuario',
            phone: profile?.phone || null,
          })

        if (createProfileError) {
          console.error('Error al crear perfil:', createProfileError)
          setError('Tu perfil no está completo. Por favor, ejecuta el script VERIFICAR_USUARIOS_FALTANTES.sql en Supabase o contacta al administrador.')
          setLoading(false)
          return
        }
        console.log('Perfil creado exitosamente')
      }

      // Generar código único
      const code = generateUniqueCode()

      // Insertar la cita
      console.log('Intentando crear cita:', {
        user_id: user.id,
        date: selectedDate,
        time: selectedTime,
        status: 'pendiente',
        code,
        selectedDateType: typeof selectedDate,
        selectedDateValue: selectedDate,
      })

      const { data: insertedData, error: insertError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          date: selectedDate,
          time: selectedTime,
          status: 'pendiente',
          code,
        })
        .select()
        .single()

      console.log('Resultado de inserción:', { insertedData, insertError })

      if (insertError) {
        console.error('Error al insertar cita:', insertError)
        const errorMessage = insertError.message || insertError.code || 'Error desconocido'
        
        if (errorMessage.includes('permission denied') || 
            errorMessage.includes('row-level security') ||
            errorMessage.includes('RLS') ||
            insertError.code === '42501') {
          setError('Error de permisos. Verifica que la política "Users can create own appointments" esté creada en Supabase.')
        } else if (errorMessage.includes('unique') || 
                   errorMessage.includes('duplicate') ||
                   insertError.code === '23505') {
          setError('Este código ya existe. Intenta crear la cita nuevamente.')
        } else if (errorMessage.includes('foreign key') ||
                   insertError.code === '23503') {
          setError('Error: El usuario no existe en la base de datos. Contacta al administrador.')
        } else {
          setError(`Error al crear la cita: ${errorMessage}`)
        }
        setLoading(false)
      } else {
        console.log('Cita creada exitosamente:', insertedData)
        console.log('Fecha guardada en BD:', insertedData.date)
        console.log('Fecha seleccionada original:', selectedDate)
        
        // Guardar datos de la cita creada para mostrar la tarjeta QR
        // Usar la fecha de la BD para asegurar consistencia
        const patientName = profile?.full_name || user.email || 'Paciente'
        setCreatedAppointment({
          id: insertedData.id,
          code: code,
          date: insertedData.date || selectedDate, // Usar la fecha de la BD si está disponible
          time: insertedData.time || selectedTime,
          patientName: patientName,
        })
        
        setSelectedDate('')
        setSelectedTime('')
        setLoading(false)
        loadOccupiedTimes()
        loadMyAppointments()
      }
    } catch (err: any) {
      console.error('Error creating appointment:', err)
      setError(err?.message || 'Error al crear la cita')
      setLoading(false)
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
      .eq('user_id', user.id) // Asegurar que solo puede cancelar sus propias citas

    if (error) {
      console.error('Error al cancelar cita:', error)
      setError('Error al cancelar la cita: ' + (error.message || 'Error desconocido'))
    } else {
      setSuccess('Cita cancelada exitosamente')
      loadMyAppointments()
      // Si hay una fecha seleccionada, recargar horarios ocupados
      if (selectedDate) {
        loadOccupiedTimes()
      }
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Clínica Dental</h1>
                <p className="text-sm text-gray-500">Panel de Paciente</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                {profile?.full_name || user.email}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mostrar tarjeta QR si se creó una cita */}
        {createdAppointment && (
        <div className="mb-6">
            <AppointmentQRCard
              appointment={createdAppointment}
              onClose={() => {
                setCreatedAppointment(null)
                setSuccess('')
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de creación de cita */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Agendar Nueva Cita</h2>

            <form onSubmit={handleCreateAppointment} className="space-y-6">
        {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              {/* Selección de fecha */}
        <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona una Fecha Disponible
          </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {availableDates.map((date) => {
                    // Usar métodos locales para evitar problemas de zona horaria
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const dateStr = `${year}-${month}-${day}`
                    const isSelected = selectedDate === dateStr
                    // Comparar con fecha de hoy en zona horaria local
                    const today = new Date()
                    const todayYear = today.getFullYear()
                    const todayMonth = String(today.getMonth() + 1).padStart(2, '0')
                    const todayDay = String(today.getDate()).padStart(2, '0')
                    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`
                    const isToday = dateStr === todayStr

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDate(dateStr)
                          setSelectedTime('')
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                      >
                        <div className="text-xs">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                        <div className="font-semibold">{date.getDate()}</div>
                        <div className="text-xs">{date.toLocaleDateString('es-ES', { month: 'short' })}</div>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Los feriados no están disponibles
                </p>
        </div>

              {/* Selección de hora */}
              {selectedDate && (
        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona una Hora Disponible
                    {loadingTimes && <span className="text-xs text-gray-500 ml-2">(Cargando...)</span>}
          </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                    {allTimes.map((time) => {
                      const timeDate = new Date(`${selectedDate}T${time}`)
                      const isPast = timeDate < new Date()
                      const isOccupied = occupiedTimes.has(time)
                      const isDisabled = isPast || isOccupied
                      const isSelected = selectedTime === time

                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => !isDisabled && setSelectedTime(time)}
                          disabled={isDisabled}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : isDisabled
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {time}
                          {isOccupied && <span className="block text-xs text-red-500">Ocupada</span>}
                        </button>
                      )
                    })}
                  </div>
                  {occupiedTimes.size > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {occupiedTimes.size} horario(s) ocupado(s) en esta fecha
                    </p>
                  )}
        </div>
              )}

          <button
            type="submit"
                disabled={loading || !selectedDate || !selectedTime}
                onClick={(e) => {
                  console.log('Botón clickeado:', {
                    loading,
                    selectedDate,
                    selectedTime,
                    disabled: loading || !selectedDate || !selectedTime
                  })
                  if (!selectedDate || !selectedTime) {
                    e.preventDefault()
                    setError('Por favor selecciona una fecha y hora antes de agendar.')
                  }
                }}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
                {loading ? 'Creando Cita...' : 'Agendar Cita'}
          </button>
              {(!selectedDate || !selectedTime) && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  {!selectedDate && 'Selecciona una fecha. '}
                  {!selectedTime && 'Selecciona una hora.'}
                </p>
              )}
      </form>
    </div>

          {/* Mis citas */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Citas</h2>

            {loadingAppointments ? (
              <div className="text-center py-8 text-gray-500">Cargando citas...</div>
            ) : myAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No tienes citas agendadas</p>
                <p className="text-sm">Agenda una cita usando el formulario de la izquierda</p>
      </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {myAppointments.map((appointment) => {
                  // Parsear fecha como local (YYYY-MM-DD) para evitar problemas de zona horaria
                  const [year, month, day] = appointment.date.split('-').map(Number)
                  const appointmentDate = new Date(year, month - 1, day)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  appointmentDate.setHours(0, 0, 0, 0)
                  const isPast = appointmentDate < today
  const statusColors = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    recibido: 'bg-green-100 text-green-800',
    no_presentó: 'bg-red-100 text-red-800',
    cancelada: 'bg-gray-100 text-gray-800',
  }

  return (
                    <div
                      key={appointment.id}
                      className={`border rounded-lg p-4 ${
                        isPast ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
              {formatDate(appointment.date)}
                          </p>
                          <p className="text-sm text-gray-600">Hora: {appointment.time}</p>
                          <p className="text-sm text-gray-600">
                            Código: <span className="font-mono font-bold">{appointment.code}</span>
                          </p>
                          
                          {/* Botón de cancelar solo para citas pendientes */}
                          {appointment.status === 'pendiente' && !isPast && (
                            <button
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold shadow-sm"
                            >
                              Cancelar Cita
                            </button>
                          )}
                        </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[appointment.status as keyof typeof statusColors] ||
                            statusColors.pendiente
                          }`}
                        >
                          {appointment.status === 'pendiente'
                            ? 'Pendiente'
                            : appointment.status === 'recibido'
                            ? 'Atendido'
                            : appointment.status === 'no_presentó'
                            ? 'No Presentó'
                            : 'Cancelada'}
            </span>
          </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de tarjeta QR para mostrar después de crear la cita
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
        <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Cita Creada Exitosamente!</h3>
        <p className="text-gray-600">Escanea el código QR para verificar la cita</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Información de la cita */}
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
              <p className="text-sm font-medium text-gray-600 mb-1">Código Único</p>
              <p className="text-2xl font-mono font-bold text-blue-700">{appointment.code}</p>
            </div>
          </div>

          {/* Código QR */}
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
              Escanea este código QR para verificar la cita al llegar
            </p>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => {
            navigator.clipboard.writeText(appointment.code)
            alert('✅ Código copiado al portapapeles')
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
        >
          📋 Copiar Código
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
