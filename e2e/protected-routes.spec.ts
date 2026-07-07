import { test, expect } from "@playwright/test";

/**
 * E2E: rotas protegidas.
 *
 * Sem sessão, `/dashboard` e `/admin` NÃO podem ser exibidas — o guarda
 * client-side redireciona para `/login`. Cobre a regressão em que uma edição
 * quebra o `useAuth`/loader e a área privada fica acessível a anônimos.
 */

test.describe("Protected routes", () => {
  test("dashboard redireciona anônimo para login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("admin redireciona anônimo para login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});
