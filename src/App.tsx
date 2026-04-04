import { BrowserRouter, Routes, Route } from "react-router-dom"

import PrivateRoute from "./components/PrivateRoute"
import Login from "./pages/Login"
import AdminDashboard from "./pages/AdminDashboard"
import TrabajadorDashboard from "./pages/TrabajadorDashboard"
import BodegaPage from "./pages/BodegaPage"
import ExploracionesPage from "./pages/ExploracionesPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pública */}
        <Route path="/" element={<Login />} />

        {/* Solo ADMIN */}
        <Route
          path="/admin"
          element={
            <PrivateRoute rolesPermitidos={["ADMIN"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Solo TRABAJADOR */}
        <Route
          path="/trabajador"
          element={
            <PrivateRoute rolesPermitidos={["TRABAJADOR"]}>
              <TrabajadorDashboard />
            </PrivateRoute>
          }
        />

        {/* GESTOR_RECURSOS y ADMIN pueden ver la bodega */}
        <Route
          path="/bodega"
          element={
            <PrivateRoute rolesPermitidos={["GESTOR_RECURSOS", "ADMIN"]}>
              <BodegaPage />
            </PrivateRoute>
          }
        />

        {/* Solo ENCARGADO_VIAJES */}
        <Route
          path="/exploraciones"
          element={
            <PrivateRoute rolesPermitidos={["ENCARGADO_VIAJES"]}>
              <ExploracionesPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App