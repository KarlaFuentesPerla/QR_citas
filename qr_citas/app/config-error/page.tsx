export default function ConfigErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Configuración Requerida
          </h1>
        </div>
        
        <div className="space-y-4 text-gray-700">
          <p className="font-semibold">Faltan las variables de entorno de Supabase.</p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Para solucionarlo:</p>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Crea un archivo <code className="bg-gray-200 px-1 rounded">.env.local</code> en la raíz del proyecto</li>
              <li>Agrega tus credenciales de Supabase:
                <pre className="bg-gray-800 text-green-400 p-2 rounded mt-2 text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave`}
                </pre>
              </li>
              <li>Obtén tus credenciales en:
                <a 
                  href="https://supabase.com/dashboard/project/_/settings/api" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline block mt-1"
                >
                  https://supabase.com/dashboard/project/_/settings/api
                </a>
              </li>
              <li>Reinicia el servidor después de crear el archivo</li>
            </ol>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Si ya creaste el archivo, verifica que:
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
              <li>El archivo se llame exactamente <code className="bg-gray-200 px-1 rounded">.env.local</code></li>
              <li>Esté en la raíz del proyecto (mismo nivel que package.json)</li>
              <li>No tenga espacios extra alrededor del signo =</li>
              <li>Haya reiniciado el servidor (Ctrl+C y luego npm run dev)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}


