import { redirect } from 'next/navigation'

export default async function Home() {
  // Redirigir directamente al panel de administrador
  redirect('/admin/dashboard')
}

