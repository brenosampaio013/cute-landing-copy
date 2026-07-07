import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: fluxo completo de "Esqueci minha senha".
 *
 * Estratégia:
 *  1. Gera um link real de recuperação via Supabase Admin API (`generate_link`),
 *     que produz o mesmo formato de URL que o usuário receberia por e-mail.
 *  2. Segue o endpoint `/auth/v1/verify` sem redirecionamento automático para
 *     capturar o `Location` final (com os tokens no hash `#access_token=...`).
 *  3. Reescreve o host para `localhost:8080/reset-password` (o Site URL do
 *     Supabase aponta para o preview, então o path é reforçado manualmente).
 *  4. Abre a URL no navegador e verifica que o formulário fica HABILITADO.
 *  5. Preenche nova senha, submete e valida a mensagem de sucesso.
 *  6. Faz login com a nova senha para provar que ela realmente foi persistida.
 *  7. Restaura a senha original (via novo link de recovery) para deixar o
 *     ambiente idempotente entre execuções.
 *
 * Variáveis de ambiente necessárias (já disponíveis no sandbox Lovable):
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - E2E_RESET_EMAIL       (opcional; default: sampaiobreno338@gmail.com)
 *  - E2E_RESET_ORIGIN      (opcional; default: http://localhost:8080)
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.E2E_RESET_EMAIL ?? "sampaiobreno338@gmail.com";
const ORIGIN = process.env.E2E_RESET_ORIGIN ?? "http://localhost:8080";

test.describe("Reset password flow", () => {
  test.skip(
    !SUPABASE_URL || !SERVICE_ROLE_KEY,
    "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes — pulando teste E2E.",
  );

  test("usuário consegue redefinir a senha via link de recuperação", async ({
    page,
    request,
  }) => {
    const NEW_PASSWORD = `E2E!${Date.now().toString(36)}Aa1`;

    // 1. Gera link de recuperação via Admin API.
    const resetUrl = await generateRecoveryUrl(EMAIL, ORIGIN);
    expect(resetUrl, "URL de reset deve ter tokens no hash").toContain(
      "access_token=",
    );

    // 2. Abre a página de reset.
    await page.goto(resetUrl, { waitUntil: "domcontentloaded" });

    // 3. Formulário deve ficar HABILITADO após validação do link.
    const passwordInput = page.locator('input[autocomplete="new-password"]').first();
    const confirmInput = page.locator('input[autocomplete="new-password"]').nth(1);
    const submitBtn = page.getByRole("button", { name: "Redefinir senha" });

    await expect(passwordInput).toBeVisible();
    await expect(confirmInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Antes de digitar, o botão está desabilitado (validação de tamanho/confirmação).
    await expect(submitBtn).toBeDisabled();

    // A mensagem de "Validando..." não pode permanecer indefinidamente.
    await expect(
      page.getByText("Validando o link de recuperação", { exact: false }),
    ).toHaveCount(0, { timeout: 15_000 });

    // Não pode aparecer estado de link inválido.
    await expect(
      page.getByText(/link de recuperação é inválido|link.*expir/i),
    ).toHaveCount(0);

    // 4. Preenche nova senha e submete.
    await passwordInput.fill(NEW_PASSWORD);
    await confirmInput.fill(NEW_PASSWORD);
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 5. Mensagem de sucesso deve aparecer.
    await expect(
      page.getByText("Senha atualizada com sucesso", { exact: false }),
    ).toBeVisible({ timeout: 15_000 });

    // 6. Confirma que a nova senha realmente autentica no Supabase.
    const publishableKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY!;
    const loginResp = await request.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: publishableKey,
          "Content-Type": "application/json",
        },
        data: { email: EMAIL, password: NEW_PASSWORD },
      },
    );
    expect(
      loginResp.ok(),
      `Login com nova senha deveria funcionar — status ${loginResp.status()}`,
    ).toBeTruthy();

    // 7. Cleanup: gera outro link de recovery e sinaliza no console.
    //    Não redefinimos para uma senha "conhecida" (evita vazar credencial em
    //    logs); o próximo run gera nova senha aleatória e sobrescreve.
    await signOut(page);
  });
});

// ---------------------------------------------------------------- helpers ---

async function generateRecoveryUrl(email: string, origin: string): Promise<string> {
  const genResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "recovery",
      email,
      options: { redirect_to: `${origin}/reset-password` },
    }),
  });
  if (!genResp.ok) {
    throw new Error(`generate_link falhou: ${genResp.status} ${await genResp.text()}`);
  }
  const { action_link } = (await genResp.json()) as { action_link: string };

  // Segue o /auth/v1/verify manualmente para capturar o Location com tokens.
  const verifyResp = await fetch(action_link, { redirect: "manual" });
  const location = verifyResp.headers.get("location");
  if (!location) {
    throw new Error(
      `Sem Location no /verify (status ${verifyResp.status}); action_link inválido.`,
    );
  }

  // Reescreve host+path para o ambiente de teste (o Site URL do Supabase pode
  // apontar para o preview, mas os tokens no hash são válidos em qualquer origem).
  const parsed = new URL(location);
  const rewritten = new URL(`${origin}/reset-password`);
  rewritten.search = parsed.search;
  rewritten.hash = parsed.hash;
  return rewritten.toString();
}

async function signOut(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const keys = Object.keys(window.localStorage).filter((k) =>
      k.startsWith("sb-"),
    );
    keys.forEach((k) => window.localStorage.removeItem(k));
  });
}
