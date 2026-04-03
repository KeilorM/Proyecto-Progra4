import {BrowserRouter,Routes,Route} from "react-router-dom"

import Login from "./pages/Login"
import AdminDashboard from "./pages/AdminDashboard"
import TrabajadorDashboard from "./pages/TrabajadorDashboard"
import BodegaPage from "./pages/BodegaPage"
import ExploracionesPage from "./pages/ExploracionesPage"

function App(){

return(

<BrowserRouter>

<Routes>

<Route path="/" element={<Login/>} />

<Route path="/admin" element={<AdminDashboard/>} />

<Route path="/trabajador" element={<TrabajadorDashboard/>} />

<Route path="/bodega" element={<BodegaPage/>} />

<Route path="/exploraciones" element={<ExploracionesPage/>} />

</Routes>

</BrowserRouter>

)

}

export default App