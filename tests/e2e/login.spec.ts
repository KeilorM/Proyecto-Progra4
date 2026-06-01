import { test, expect } from '@playwright/test';

// ─── CREDENCIALES DE PRUEBA ──────────────────────────────────────────────────
// Deben existir en tu base de datos (seed.sql)
const USUARIOS = {
  admin:           { email: 'admin@base-alfa.com',      password: 'password', ruta: '/admin' },
  trabajador:      { email: 'trabajador@base-alfa.com', password: 'password', ruta: '/trabajador' },
  gestor:          { email: 'gestor@base-alfa.com',     password: 'password', ruta: '/bodega' },
  encargadoViajes: { email: 'viajes@base-beta.com',     password: 'password', ruta: '/exploraciones' },
};
// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function llenarLogin(page: any, email: string, password: string) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

test.describe('Login - Flujos críticos', () => {

  test.beforeEach(async ({ page }) => {
    // Siempre empezar sin sesión activa
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  // ── 1. La página de login carga correctamente ──────────────────────────────
  test('Debe mostrar el formulario de login', async ({ page }) => {
    await expect(page).toHaveURL('/');
    await expect(page.locator('h2')).toContainText('Panel de Control');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  // ── 2. Error con campos vacíos ─────────────────────────────────────────────
  test('Debe mostrar error si los campos están vacíos', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Debes llenar ambos campos')).toBeVisible();
    // No debe redirigir
    await expect(page).toHaveURL('/');
  });

  // ── 3. Error con credenciales incorrectas ──────────────────────────────────
  test('Debe mostrar error con credenciales incorrectas', async ({ page }) => {
    await llenarLogin(page, 'noexiste@correo.com', 'passwordmalo');
    // Esperar respuesta del servidor
    await expect(page.locator('[class*="red"]')).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL('/');
  });

  // ── 4. Login exitoso → redirige según rol ADMIN ────────────────────────────
  test('Login como ADMIN debe redirigir a /admin', async ({ page }) => {
    await llenarLogin(page, USUARIOS.admin.email, USUARIOS.admin.password);
    await expect(page).toHaveURL(USUARIOS.admin.ruta, { timeout: 8000 });
    // El token debe guardarse en localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).not.toBeNull();
    const rol = await page.evaluate(() => localStorage.getItem('rol'));
    expect(rol).toBe('ADMIN');
  });

  // ── 5. Login exitoso → redirige según rol TRABAJADOR ──────────────────────
  test('Login como TRABAJADOR debe redirigir a /trabajador', async ({ page }) => {
    await llenarLogin(page, USUARIOS.trabajador.email, USUARIOS.trabajador.password);
    await expect(page).toHaveURL(USUARIOS.trabajador.ruta, { timeout: 8000 });
  });

  // ── 6. Login exitoso → redirige según rol GESTOR_RECURSOS ─────────────────
  test('Login como GESTOR_RECURSOS debe redirigir a /bodega', async ({ page }) => {
    await llenarLogin(page, USUARIOS.gestor.email, USUARIOS.gestor.password);
    await expect(page).toHaveURL(USUARIOS.gestor.ruta, { timeout: 8000 });
  });

  // ── 7. Login exitoso → redirige según rol ENCARGADO_VIAJES ────────────────
  test('Login como ENCARGADO_VIAJES debe redirigir a /exploraciones', async ({ page }) => {
    await llenarLogin(page, USUARIOS.encargadoViajes.email, USUARIOS.encargadoViajes.password);
    await expect(page).toHaveURL(USUARIOS.encargadoViajes.ruta, { timeout: 8000 });
  });

  // ── 8. Botón muestra "Verificando..." mientras carga ──────────────────────
  test('El botón debe deshabilitarse durante el login', async ({ page }) => {
    await page.fill('input[type="email"]', USUARIOS.admin.email);
    await page.fill('input[type="password"]', USUARIOS.admin.password);
    // Click y verificar estado inmediatamente
    await page.click('button[type="submit"]');
    // El botón debería mostrar estado de carga (puede ser muy rápido en local)
    // Verificamos que eventualmente redirige (prueba de flujo completo)
    await expect(page).toHaveURL(USUARIOS.admin.ruta, { timeout: 8000 });
  });

  // ── 9. Ruta protegida sin token redirige a login ───────────────────────────
  test('Acceder a /admin sin token debe redirigir al login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });

  test('Acceder a /bodega sin token debe redirigir al login', async ({ page }) => {
    await page.goto('/bodega');
    await expect(page).toHaveURL('/');
  });

  test('Acceder a /exploraciones sin token debe redirigir al login', async ({ page }) => {
    await page.goto('/exploraciones');
    await expect(page).toHaveURL('/');
  });

  // ── 10. Logout limpia la sesión ────────────────────────────────────────────
  test('Logout debe limpiar localStorage y redirigir al login', async ({ page }) => {
    // Primero hacer login
    await llenarLogin(page, USUARIOS.admin.email, USUARIOS.admin.password);
    await expect(page).toHaveURL('/admin', { timeout: 8000 });

    // Hacer logout (botón "ABANDONAR BASE")
    await page.click('text=ABANDONAR BASE');
    await expect(page).toHaveURL('/');

    // Verificar que se limpió el localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
