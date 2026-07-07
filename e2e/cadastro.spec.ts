import { test, expect } from "@playwright/test";
import { typeInto, waitForHydration } from "./helpers";


/**
 * E2E: fluxo de cadastro (`/cadastro`).
 *
 * Estratégia:
 *  - Gera um email/telefone aleatórios.
 *  - Preenche o formulário, aceita os termos e submete.
 *  - Espera o redirect para `/dashboard` (fluxo sem confirmação obrigatória)
 *    OU uma mensagem de "verifique seu e-mail" se a confirmação estiver ativa.
 *  - Cleanup: remove o usuário criado via Admin API.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("Cadastro flow", () => {
  test.skip(
    !SUPABASE_URL || !SERVICE_ROLE_KEY,
    "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes — pulando teste E2E.",
  );

  const stamp = Date.now();
  const email = `e2e-signup-${stamp}@example.com`;
  const password = `Signup!${stamp.toString(36)}Aa1`;

  test.afterAll(async () => {
    // Localiza o user por email e deleta (idempotente).
    const list = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      },
    );
    if (!list.ok) return;
    const { users } = (await list.json()) as { users: Array<{ id: string; email: string }> };
    const target = users.find((u) => u.email === email);
    if (!target) return;
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${target.id}`, {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
  });

  test("novo usuário cria conta e chega em área autenticada", async ({ page }) => {
    await page.goto("/cadastro");
    await waitForHydration(page);

    await typeInto(page.locator('input[autocomplete="name"]'), "E2E Signup");
    await typeInto(page.locator('input[type="email"]'), email);
    await typeInto(page.locator('input[autocomplete="tel"]'), "11999998888");
    await typeInto(page.locator('input[autocomplete="new-password"]').first(), password);
    await typeInto(page.locator('input[autocomplete="new-password"]').nth(1), password);
    await page.locator('input[type="checkbox"]').check();


    const submit = page.getByRole("button", { name: "Criar conta" });
    await expect(submit).toBeEnabled();
    await submit.click();

    // Sucesso pode ser: (a) redirect para /dashboard, ou (b) mensagem de
    // confirmação por e-mail se a política do projeto exigir verificação.
    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 15_000 }),
      page
        .getByText(/verificar|confirm|e-mail enviado|link de confirmação/i)
        .first()
        .waitFor({ timeout: 15_000 }),
    ]);

    // Não pode haver mensagem de erro visível.
    await expect(page.locator("p.text-red-600, .bg-red-50")).toHaveCount(0);
  });
});
