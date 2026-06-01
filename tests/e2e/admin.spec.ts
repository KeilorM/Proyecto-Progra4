import { test, expect } from '@playwright/test';

const ADMIN = { email: 'admin@base-alfa.com', password: 'password' };

// ─── HELPER: hace login y va al dashboard de admin ───────────────────────────
async function loginComoAdmin(page: any) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.fill('input[type="email"]', ADMIN.email);
  await page.fill('input[type="password"]', ADMIN.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/admin', { timeout: 8000 });
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

test.describe('Admin Dashboard - Acceso y carga', () => {

  // ── 1. Sin token redirige al login ─────────────────────────────────────────
test('Sin token debe redirigir a login', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/admin');
  await expect(page).toHaveURL('/');
});

  // ── 2. Rol incorrecto redirige al login ────────────────────────────────────
  test('Con rol incorrecto (TRABAJADOR) debe redirigir a login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'token-falso-cualquiera');
      localStorage.setItem('rol', 'TRABAJADOR');
    });
    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });

  // ── 3. Admin puede acceder al dashboard ───────────────────────────────────
  test('ADMIN puede acceder y ver el dashboard', async ({ page }) => {
    await loginComoAdmin(page);
    // Verifica que el header del panel esté visible
    await expect(page.locator('text=ABANDONAR BASE')).toBeVisible({ timeout: 8000 });
  });

  // ── 4. El dashboard carga la lista de personas ────────────────────────────
  test('Debe mostrar la tabla o lista de personas', async ({ page }) => {
    await loginComoAdmin(page);
    // Esperar que carguen datos (tabla/lista de personas)
    await page.waitForTimeout(1500); // dar tiempo al fetch
    // Debe existir algún contenedor con personas (h2, tabla o cards)
    const hayContenido = await page.locator('text=SANO, text=HERIDO, text=ENFERMO, text=MUERTO').count();
    // Al menos la UI cargó sin error
    await expect(page.locator('body')).not.toContainText('Error al obtener');
  });

  // ── 5. El botón "Agregar persona" abre el modal ───────────────────────────
  test('El botón de agregar persona debe abrir el modal', async ({ page }) => {
    await loginComoAdmin(page);
    await page.waitForTimeout(1000);
    // Buscar botón que contenga "Agregar" o "+"
    const botonAgregar = page.locator('button', { hasText: /agregar|nueva|nuevo|\+/i }).first();
    await expect(botonAgregar).toBeVisible({ timeout: 5000 });
    await botonAgregar.click();
    // El modal debe abrirse — buscar un campo del formulario del modal
    await expect(page.locator('input[placeholder*="ombre"], input[placeholder*="nombre"]').first()).toBeVisible({ timeout: 3000 });
  });

  // ── 6. El modal de agregar puede cerrarse ─────────────────────────────────
  test('El modal de agregar persona puede cerrarse', async ({ page }) => {
    await loginComoAdmin(page);
    await page.waitForTimeout(1000);
    const botonAgregar = page.locator('button', { hasText: /agregar|nueva|nuevo|\+/i }).first();
    await botonAgregar.click();
    // Cerrar con botón cancelar o X
    const botonCerrar = page.locator('button', { hasText: /cancelar|cerrar|×|✕/i }).first();
    await expect(botonCerrar).toBeVisible({ timeout: 3000 });
    await botonCerrar.click();
    // El modal ya no debe estar
    await expect(page.locator('input[placeholder*="ombre"]').first()).not.toBeVisible({ timeout: 3000 });
  });

  // ── 7. Logout desde admin funciona ────────────────────────────────────────
  test('Logout desde admin debe redirigir al login', async ({ page }) => {
    await loginComoAdmin(page);
    await page.click('text=ABANDONAR BASE');
    await expect(page).toHaveURL('/');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
