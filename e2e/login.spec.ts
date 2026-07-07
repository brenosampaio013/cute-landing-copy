import { test, expect } from "@playwright/test";
import { typeInto, waitForHydration } from "./helpers";


/**
 * E2E: fluxo de login (email/senha).
 *
 * Estratégia:
 *  - Cria um usuário efêmero via Admin API (com senha conhecida e email_confirm).
 *  - Verifica que credenciais inválidas mostram erro sem redirecionar.
 *  - Verifica que credenciais válidas autenticam e levam para `/dashboard`.
 *  - Remove o usuário no `test.afterAll` para não sujar o banco.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("Login flow", () => {
  test.skip(
    !SUPABASE_URL || !SERVICE_ROLE_KEY,
    "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes — pulando teste E2E.",
  );

  const email = `e2e-login-${Date.now()}@example.com`;
  const password = `Login!${Date.now().toString(36)}Aa1`;
  let userId: string | null = null;

  test.beforeAll(async () => {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome: "E2E Login", telefone: "11999999999", tipo_usuario: "cliente" },
      }),
    });
    if (!resp.ok) throw new Error(`admin create user falhou: ${resp.status} ${await resp.text()}`);
    const j = (await resp.json()) as { id: string };
    userId = j.id;
  });

  test.afterAll(async () => {
    if (!userId) return;
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
  });

  test("credenciais inválidas exibem erro amigável", async ({ page }) => {
    await page.goto("/login");
    await waitForHydration(page);
    await typeInto(page.locator('input[type="email"]'), email);
    await typeInto(page.locator('input[type="password"]'), "senhaErrada!123");
    const btn = page.getByRole("button", { name: "Entrar" });
    await expect(btn).toBeEnabled();
    await btn.click();

    await expect(
      page.getByText(/credenciais|inválid|senha|e-mail/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("credenciais válidas autenticam e redirecionam ao dashboard", async ({ page }) => {
    await page.goto("/login");
    await waitForHydration(page);
    await typeInto(page.locator('input[type="email"]'), email);
    await typeInto(page.locator('input[type="password"]'), password);
    const btn = page.getByRole("button", { name: "Entrar" });
    await expect(btn).toBeEnabled();
    await btn.click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    expect(page.url()).toContain("/dashboard");
  });

});
