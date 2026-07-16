import logoAsset from "@/assets/mare-nobre-logo-oficial.png.asset.json";
import heroAsset from "@/assets/mare-nobre-hero-v2.png.asset.json";
import posObraAsset from "@/assets/service-pos-obra-clean.jpg.asset.json";
import passadoriaAsset from "@/assets/service-passadoria-clean.jpg.asset.json";
import piscinaAsset from "@/assets/service-limpeza-piscina-clean.jpg.asset.json";
import logoLocal from "@/assets/logo.png";
import heroLocal from "@/assets/hero-cleaner.jpg";
import posObraLocal from "@/assets/service-pos-obra-clean.jpg";
import passadoriaLocal from "@/assets/service-passadoria-clean.jpg";
import piscinaLocal from "@/assets/service-limpeza-piscina-clean.jpg";

const LOGO_ASSET_VERSION = "20260714-logo-local-primary";
const HERO_IMAGE_VERSION = "20260716-hero-v2";
const SERVICE_IMAGE_VERSION = "20260714-services-local-primary";

function versioned(url: string, version: string) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${version}`;
}

export type FallbackImageSource = {
  src: string;
  fallbackSrc: string;
};

export const mareNobreLogoUrl = versioned(logoLocal, LOGO_ASSET_VERSION);
export const mareNobreLogoCdnUrl = versioned(logoAsset.url, LOGO_ASSET_VERSION);

export const mareNobreHeroUrl = versioned(heroLocal, HERO_IMAGE_VERSION);
export const mareNobreHeroCdnUrl = versioned(heroAsset.url, HERO_IMAGE_VERSION);

export const serviceImages = {
  posObra: {
    src: versioned(posObraLocal, SERVICE_IMAGE_VERSION),
    fallbackSrc: versioned(posObraAsset.url, SERVICE_IMAGE_VERSION),
  },
  passadoria: {
    src: versioned(passadoriaLocal, SERVICE_IMAGE_VERSION),
    fallbackSrc: versioned(passadoriaAsset.url, SERVICE_IMAGE_VERSION),
  },
  limpezaPiscina: {
    src: versioned(piscinaLocal, SERVICE_IMAGE_VERSION),
    fallbackSrc: versioned(piscinaAsset.url, SERVICE_IMAGE_VERSION),
  },
} satisfies Record<string, FallbackImageSource>;