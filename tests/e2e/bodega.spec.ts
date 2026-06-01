import { test, expect } from '@playwright/test';

const GESTOR = { email: 'gestor@base-alfa.com', password: 'password' };
const ADMIN   = { email: 'admin@base-alfa.com',  password: 'password' };

// ─── HELPER ───────────────────────────────────────────────────────────────────
async function loginComo(page: any, email: string, password: string, rutaEsperada: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(rutaEsperada, { timeout: 8000 });
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

test.describe('Bodega - Gestión de recursos', () => {

  // ── 1. Sin token redirige al login ─────────────────────────────────────────
test('Sin token debe redirigir a login', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/bodega');
  });

  // ── 2. Rol TRABAJADOR no puede acceder a bodega ────────────────────────────
  test('Rol TRABAJADOR no puede acceder a /bodega', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'token-falso');
      localStorage.setItem('rol', 'TRABAJADOR');
    });
    await page.goto('/bodega');
    await expect(page).toHaveURL('/');
  });

  // ── 3. Rol ENCARGADO_VIAJES no puede acceder a bodega ─────────────────────
  test('Rol ENCARGADO_VIAJES no puede acceder a /bodega', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'token-falso');
      localStorage.setItem('rol', 'ENCARGADO_VIAJES');
    });
    await page.goto('/bodega');
    await expect(page).toHaveURL('/');
  });

  // ── 4. GESTOR_RECURSOS puede acceder a bodega ─────────────────────────────
  test('GESTOR_RECURSOS puede acceder a /bodega', async ({ page }) => {
    await loginComo(page, GESTOR.email, GESTOR.password, '/bodega');
    await expect(page.locator('text=ABANDONAR BASE')).toBeVisible({ timeout: 8000 });
  });

  // ── 5. ADMIN también puede acceder a bodega ───────────────────────────────
  test('ADMIN puede acceder a /bodega', async ({ page }) => {
    await loginComo(page, ADMIN.email, ADMIN.password, '/admin');
    // El admin navega manualmente a /bodega
    await page.goto('/bodega');
    await expect(page.locator('text=ABANDONAR BASE')).toBeVisible({ timeout: 8000 });
  });

  // ── 6. La bodega carga sin errores ────────────────────────────────────────
  test('La página de bodega no debe mostrar errores de carga', async ({ page }) => {
    await loginComo(page, GESTOR.email, GESTOR.password, '/bodega');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toContainText('Error al obtener');
    await expect(page.locator('body')).not.toContainText('Error servidor');
  });

  // ── 7. Existen las secciones de inventario y movimientos ──────────────────
  test('Debe mostrar secciones de inventario', async ({ page }) => {
    await loginComo(page, GESTOR.email, GESTOR.password, '/bodega');
    await page.waitForTimeout(1500);
    // La bodega debe mostrar algún tipo de listado de recursos
    // (tabla, cards, etc. con el recurso)
    const haySeccion = await page.locator('text=/bodega|inventario|recurso|stock/i').count();
    expect(haySeccion).toBeGreaterThan(0);
  });

  // ── 8. El formulario de movimiento existe ─────────────────────────────────
  test('Debe existir la opción para registrar un movimiento', async ({ page }) => {
    await loginComo(page, GESTOR.email, GESTOR.password, '/bodega');
    await page.waitForTimeout(1000);
    // Buscar botón para registrar entrada/salida
    const botonMovimiento = page.locator('button', { hasText: /movimiento|entrada|salida|registrar/i }).first();
    await expect(botonMovimiento).toBeVisible({ timeout: 5000 });
  });

  // ── 9. Logout desde bodega funciona ───────────────────────────────────────
  test('Logout desde bodega debe redirigir al login', async ({ page }) => {
    await loginComo(page, GESTOR.email, GESTOR.password, '/bodega');
    await page.click('text=ABANDONAR BASE');
    await expect(page).toHaveURL('/');
  });
});
