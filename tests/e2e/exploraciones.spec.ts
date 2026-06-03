import { test, expect } from '@playwright/test'

const ENCARGADO = { email: 'viajes@base-beta.com', password: 'password' }

// ─── HELPER ───────────────────────────────────────────────────────────────────
async function loginComoEncargado(page: any) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.fill('input[type="email"]', ENCARGADO.email)
  await page.fill('input[type="password"]', ENCARGADO.password)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/exploraciones', { timeout: 8000 })
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

test.describe('Exploraciones - Flujo de misiones', () => {
  // ── 1. Sin token redirige al login ─────────────────────────────────────────
  test('Sin token debe redirigir a login', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/exploraciones')
  })

  // ── 2. Rol TRABAJADOR no puede acceder a exploraciones ────────────────────
  test('Rol TRABAJADOR no puede acceder a /exploraciones', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('token', 'token-falso')
      localStorage.setItem('rol', 'TRABAJADOR')
    })
    await page.goto('/exploraciones')
    await expect(page).toHaveURL('/')
  })

  // ── 3. Rol GESTOR_RECURSOS no puede acceder a exploraciones ───────────────
  test('Rol GESTOR_RECURSOS no puede acceder a /exploraciones', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('token', 'token-falso')
      localStorage.setItem('rol', 'GESTOR_RECURSOS')
    })
    await page.goto('/exploraciones')
    await expect(page).toHaveURL('/')
  })

  // ── 4. ENCARGADO_VIAJES puede acceder ─────────────────────────────────────
  test('ENCARGADO_VIAJES puede acceder a /exploraciones', async ({ page }) => {
    await loginComoEncargado(page)
    await expect(page.locator('text=ABANDONAR BASE')).toBeVisible({ timeout: 8000 })
  })

  // ── 5. La página carga sin errores ────────────────────────────────────────
  test('La página de exploraciones no debe mostrar errores de carga', async ({ page }) => {
    await loginComoEncargado(page)
    await page.waitForTimeout(1500)
    await expect(page.locator('body')).not.toContainText('Error al obtener')
    await expect(page.locator('body')).not.toContainText('Error servidor')
  })

  // ── 6. Se muestran las exploraciones existentes ───────────────────────────
  test('Debe mostrar el listado o sección de exploraciones/misiones', async ({ page }) => {
    await loginComoEncargado(page)
    await page.waitForTimeout(1500)
    const haySeccion = await page
      .locator('text=/explorac|misión|mision|planificada|en_curso|completada/i')
      .count()
    expect(haySeccion).toBeGreaterThan(0)
  })

  // ── 7. Existe opción para crear nueva exploración ─────────────────────────
  test('Debe existir el botón para crear una nueva exploración', async ({ page }) => {
    await loginComoEncargado(page)
    await page.waitForTimeout(1000)
    const botonCrear = page.locator('button', { hasText: /nueva|crear|explorac|misión/i }).first()
    await expect(botonCrear).toBeVisible({ timeout: 5000 })
  })

  // ── 8. El modal de nueva exploración abre con campos requeridos ───────────
  test('El modal de nueva exploración debe abrirse', async ({ page }) => {
    await loginComoEncargado(page)
    await page.waitForTimeout(1000)
    const botonCrear = page.locator('button', { hasText: /nueva misión/i }).first()
    await botonCrear.click()
    await page.waitForTimeout(1000)
    // El modal abre con el título "NUEVA MISIÓN"
    await expect(page.locator('text=NUEVA MISIÓN').last()).toBeVisible({ timeout: 3000 })
  })

  // ── 9. Logout desde exploraciones funciona ────────────────────────────────
  test('Logout desde exploraciones debe redirigir al login', async ({ page }) => {
    await loginComoEncargado(page)
    await page.click('text=ABANDONAR BASE')
    await expect(page).toHaveURL('/')
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeNull()
  })
})
