import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useInactivityTimer(minutos = 20) {
  const navigate = useNavigate()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(
        () => {
          localStorage.clear()
          navigate('/')
        },
        minutos * 60 * 1000
      )
    }

    const eventos = ['mousemove', 'keydown', 'click', 'scroll']
    eventos.forEach((e) => window.addEventListener(e, reset))
    reset()

    return () => {
      clearTimeout(timer)
      eventos.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [minutos, navigate])
}
