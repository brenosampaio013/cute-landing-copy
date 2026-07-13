import { test, expect } from "@playwright/test";

/**
 * E2E: garante que a logo "Maré Nobre" do header carrega e renderiza
 * corretamente em mobile e desktop, sem cair no fallback textual.
 */

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

for (const vp of viewports) {
  test(`logo do header carrega em ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/", { waitUntil: "networkidle" });

    const logo = page.locator('header img[alt="Maré Nobre"]').first();
    await expect(logo).toBeVisible();

    // Imagem carregou de fato (não é ícone quebrado).
    const state = await logo.evaluate((el) => {
      const img = el as HTMLImageElement;
      return {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayNone: getComputedStyle(img).display === "none",
        clientWidth: img.clientWidth,
        clientHeight: img.clientHeight,
        src: img.currentSrc || img.src,
      };
    });

    expect(state.displayNone).toBe(false);
    expect(state.complete).toBe(true);
    expect(state.naturalWidth).toBeGreaterThan(0);
    expect(state.naturalHeight).toBeGreaterThan(0);
    expect(state.clientWidth).toBeGreaterThan(0);
    expect(state.clientHeight).toBeGreaterThan(0);
    expect(state.src).toMatch(/mare-nobre-logo-oficial\.png/);

    // Requisição HTTP da logo respondeu 2xx.
    const resp = await page.request.get(state.src);
    expect(resp.status(), `GET ${state.src}`).toBeLessThan(400);

    // Fallback textual permanece oculto quando a imagem carrega.
    const fallback = page.locator('header span[aria-hidden="true"]').first();
    if (await fallback.count()) {
      const hidden = await fallback.evaluate(
        (el) => getComputedStyle(el).display === "none",
      );
      expect(hidden).toBe(true);
    }

    // Sem overflow horizontal no mobile (logo não deve empurrar o header).
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
