import logoAsset from "@/assets/mare-nobre-logo-oficial.png.asset.json";

const LOGO_ASSET_VERSION = "20260714-logo-public-fallback";

export const mareNobreLogoUrl = `/mare-nobre-logo-oficial.png?v=${LOGO_ASSET_VERSION}`;
export const mareNobreLogoCdnUrl = `${logoAsset.url}?v=${LOGO_ASSET_VERSION}`;