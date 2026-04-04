import { useNavigate } from "react-router-dom"
import { sharedStyles, globalStyles } from "../styles/theme"

interface Props {
  titulo: string
  subtitulo: string
}

export default function PageHeader({ titulo, subtitulo }: Props) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("rol")
    navigate("/")
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={sharedStyles.noise} />
      <div style={sharedStyles.scanline} />
      <header style={sharedStyles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 32, color: "#10b981", animation: "pulse 3s ease-in-out infinite" }}>
            ☣
          </span>
          <div>
            <div style={sharedStyles.headerTitle}>{titulo}</div>
            <div style={sharedStyles.headerSub}>{subtitulo}</div>
          </div>
        </div>
        <button style={sharedStyles.logoutBtn} onClick={handleLogout}>
          ABANDONAR BASE
        </button>
      </header>
    </>
  )
}
