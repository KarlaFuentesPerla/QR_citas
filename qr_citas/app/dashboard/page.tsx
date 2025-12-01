import DashboardWrapper from './page-wrapper'

// Usar un componente cliente para verificar la sesión
// Esto evita problemas con cookies que no se pasan del cliente al servidor
export default function DashboardPage() {
  return <DashboardWrapper />
}
