import type { Locator, Page } from "@playwright/test";

/**
 * Preenche um input controlado por React de forma resistente a SSR/hidratação.
 * `.fill()` pode disparar antes do onChange do React estar montado; digitar
 * caractere por caractere garante o evento `input` após hidratação.
 */
export async function typeInto(locator: Locator, value: string): Promise<void> {
  await locator.click();
  await locator.fill("");
  await locator.pressSequentially(value, { delay: 10 });
}

/**
 * Espera a hidratação básica do TanStack Start: presença do form + primeiro
 * paint estável. Pequeno debounce evita clicks em botões ainda desabilitados
 * por conta de useMemo síncronos que rodam só após hydration.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(() => document.readyState === "complete");
  await page.waitForTimeout(150);
}
