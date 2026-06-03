# Gestión del Fin — EIF209 Programación IV - Proyecto-Progra4 - React + TypeScript + Vite

Sistema de gestión de campamentos post-apocalipsis zombie.

## Links importantes

- **Aplicación desplegada:** https://proyecto-progra4-delta.vercel.app/
- **Mockups (Figma):** https://fast-eraser-68936199.figma.site
## SE RECOMIENDA UTILIZAR CHROME PARA LOS DIAGRAMAS, ADEMAS DE SER EL CASO, ABRIR CON DRAW.IO PARA LA VISUALIZACIÓN DEL DIAGRAMA
- **Diagrama de arquitectura:** https://drive.google.com/file/d/1LJJSEvvoXD2RDIt7dfe4ky6FTq8X21pe/view?usp=sharing
- **Diagrama ER (draw.io):** https://drive.google.com/file/d/18TzGk96oPv7EidHj54G-D3fofcPrcndJ/view?usp=sharing
- **Repositorio:** https://github.com/KeilorM/Proyecto-Progra4.git

---

## Tecnologías

| Capa          | Tecnología                             |
----------------------------------------------------------
| Frontend      | React 18 + TypeScript + Vite           |
| Backend       | Node.js + Express.js (API REST v1)     |
| Base de datos | PostgreSQL via Supabase                |
| Autenticación | JWT + RBAC por roles                   |
| IA            | Groq API (llama-3.3-70b-versatile)     |
| Despliegue    | Vercel (frontend + backend serverless) |
| Pruebas       | Playwright (E2E) + Artillery (estrés)  |
| Calidad       | ESLint + Prettier + CSpell             |

---

## Instalación y ejecución local

# Clonar el repositorio
git clone https://github.com/KeilorM/Proyecto-Progra4.git
cd tu-repo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en desarrollo (backend + frontend)
npm run dev

### Variables de entorno requeridas (.env) - solicitar a alguno de los integrantes del grupo de ser necesario

DB_HOST=aws-1-us-east-1.pooler.supabase.com
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=postgres
JWT_SECRET=tu_secreto
JWT_EXPIRES=20m
GROQ_API_KEY=tu_key

---

## Usuarios de prueba

| Email                    | Password | Rol               | Campamento|
-----------------------------------------------------------------------
| admin@base-alfa.com      | password | ADMIN             | Base Alfa |
| trabajador@base-alfa.com | password | TRABAJADOR        | Base Alfa |
| gestor@base-alfa.com     | password | GESTOR_RECURSOS   | Base Alfa |
| admin@base-beta.com      | password | ADMIN             | Base Beta |
| viajes@base-beta.com     | password | ENCARGADO_VIAJES  | Base Beta |

---

## Uso de Inteligencia Artificial

### Análisis de ingreso (Groq - llama-3.3-70b-versatile)
Evalúa cada nuevo superviviente con criterios transparentes: edad, combate,
confianza y salud. Genera reporte ACEPTADO/RECHAZADO/REVISION con puntuación
/100. El operador puede aceptar o corregir la decisión antes de confirmar el ingreso.

### Asignación de cargo (lógica determinista + Groq)
El cargo se decide por reglas JS predefinidas según combate/confianza/salud,
garantizando consistencia. Groq genera la explicación en lenguaje natural.
Trazable con `asignado_por_ia = TRUE` en la base de datos.

---

## Pruebas

# Pruebas E2E con Playwright
npm run test:e2e

# Ver reporte de pruebas
npm run test:e2e:report

# Pruebas de estrés con Artillery
npm run test:stres

---

## Calidad de código

npm run lint          # Revisa errores ESLint
npm run lint:fix      # Corrige errores automáticamente
npm run format        # Formatea con Prettier
npm run format:check  # Verifica formato
npm run spell         # Revisa ortografía con CSpell
npm run check         # Corre los 3 juntos

---

## Conclusiones

- La arquitectura orientada a servicios con separación frontend/backend
  permitió un desarrollo modular y mantenible.
- El uso de Groq como motor de IA demostró ser efectivo para decisiones
  explicables y trazables, cumpliendo el requerimiento de transparencia.
- PostgreSQL con Supabase facilitó el manejo de datos relacionales complejos
  (17 tablas, triggers, índices) sin necesidad de infraestructura propia.
- El despliegue en Vercel con Serverless Functions permitió alojar frontend
  y backend en un solo servicio de forma gratuita.
- La gamificación (niveles, logros, XP) aportó valor real a la experiencia
  de usuario manteniendo coherencia con la temática post-apocalíptica.

---

## Recomendaciones

- Implementar Supabase Storage para persistir las imágenes de personas
  en producción, ya que el sistema de archivos de Vercel es efímero.
- Agregar paginación en las tablas de personas y movimientos de bodega
  para manejar volúmenes de datos mayores a 1000 registros.
- Implementar WebSockets para notificaciones en tiempo real cuando se
  generan alertas de recursos bajos.
- Migrar la lógica de consumo diario a un cron job programado en el
  servidor en lugar de ejecución manual por el administrador.
- Agregar autenticación de dos factores para el rol ADMIN dado el
  nivel de acceso que tiene sobre el sistema.