import { Navigate } from "react-router-dom"

interface Props {
  children: React.ReactNode
  rolesPermitidos: string[]
}

export default function PrivateRoute({ children, rolesPermitidos }: Props) {
  const token = localStorage.getItem("token")
  const rol = localStorage.getItem("rol")

  // Si no hay token, mandar al login
  if (!token || !rol) {
    return <Navigate to="/" replace />
  }

  // Si el rol no tiene permiso para esta ruta, mandar al login
  if (!rolesPermitidos.includes(rol)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
