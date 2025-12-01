'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestConnectionPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setResult(null)

    try {
      const supabase = createClient()
      
      // Test 1: Verificar que las variables de entorno estén configuradas
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key || url.includes('tu-proyecto') || key.includes('tu-clave')) {
        setResult({
          success: false,
          message: '❌ Las variables de entorno tienen valores placeholder. Edita .env.local con tus credenciales reales de Supabase.'
        })
        setTesting(false)
        return
      }

      // Test 2: Intentar conectar con Supabase
      const { data, error } = await supabase.from('users').select('count').limit(0)

      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
          setResult({
            success: false,
            message: '❌ Credenciales inválidas. Verifica que tu Project URL y anon key sean correctos en .env.local'
          })
        } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
          setResult({
            success: false,
            message: '⚠️ Conexión exitosa, pero la tabla "users" no existe. Ejecuta la migración SQL en Supabase.'
          })
        } else {
          setResult({
            success: false,
            message: `❌ Error: ${error.message}`
          })
        }
      } else {
        setResult({
          success: true,
          message: '✅ Conexión exitosa con Supabase! Todo está configurado correctamente.'
        })
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: `❌ Error: ${err.message || 'No se pudo conectar con Supabase'}`
      })
    }

    setTesting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-4 text-primary-700">
          Test de Conexión Supabase
        </h1>
        
        <button
          onClick={testConnection}
          disabled={testing}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {testing ? 'Probando conexión...' : 'Probar Conexión'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="whitespace-pre-line">{result.message}</p>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600 space-y-2">
          <p className="font-semibold">Para obtener tus credenciales:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Ve a <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
            <li>Selecciona tu proyecto</li>
            <li>Ve a Settings → API</li>
            <li>Copia Project URL y anon public key</li>
            <li>Pégalos en tu archivo .env.local</li>
          </ol>
        </div>
      </div>
    </div>
  )
}


