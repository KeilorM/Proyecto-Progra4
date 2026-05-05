import { useNavigate } from "react-router-dom"
import { sharedStyles, globalStyles } from "../styles/theme"
import { useIsMobile } from "../hooks/useIsMobile"

interface Props {
  titulo: string
  subtitulo: string
}

export default function PageHeader({ titulo, subtitulo }: Props) {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("rol")
    localStorage.removeItem("campamento")
    navigate("/")
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={sharedStyles.noise} />
      <div style={sharedStyles.scanline} />
      <header style={{
        ...sharedStyles.header,
        padding: isMobile ? "12px 16px" : "16px 32px",
        flexWrap: "wrap",
        gap: isMobile ? 10 : 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
          <span style={{
            fontSize: isMobile ? 24 : 32,
            color: "#10b981",
            animation: "pulse 3s ease-in-out infinite",
          }}>
            ☣
          </span>
          <div>
            <div style={{
              ...sharedStyles.headerTitle,
              fontSize: isMobile ? 14 : 20,
              letterSpacing: isMobile ? 2 : 4,
            }}>
              {titulo}
            </div>
            <div style={{
              ...sharedStyles.headerSub,
              fontSize: isMobile ? 10 : 12,
            }}>
              {subtitulo}
            </div>
          </div>
        </div>
        <button
          style={{
            ...sharedStyles.logoutBtn,
            fontSize: isMobile ? 10 : 12,
            padding: isMobile ? "6px 12px" : "8px 16px",
          }}
          onClick={handleLogout}
        >
          ABANDONAR BASE
        </button>
      </header>
    </>
  )
}
