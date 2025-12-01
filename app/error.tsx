'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Algo salió mal</h2>
        <p className="text-gray-600 mb-4">{error.message || 'Ocurrió un error inesperado'}</p>
        <button
          onClick={reset}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Intentar de nuevo
        </button>
        <a
          href="/login"
          className="block mt-4 text-center text-blue-600 hover:text-blue-700"
        >
          Volver al login
        </a>
      </div>
    </div>
  )
}


