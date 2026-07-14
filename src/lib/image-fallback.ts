export function applyImageFallback(image: HTMLImageElement, fallbackSrc?: string) {
  if (!fallbackSrc || typeof window === "undefined") return false;

  const fallbackUrl = new URL(fallbackSrc, window.location.origin).href;
  const activeUrl = image.currentSrc || image.src;

  if (activeUrl === fallbackUrl) return false;

  image.src = fallbackSrc;
  return true;
}