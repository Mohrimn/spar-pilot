const env = import.meta.env;

function clampFuelRadius(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(25, Math.max(1, parsed));
}

function normalizeFuelType(value) {
  return ["all", "diesel", "e5", "e10"].includes(value) ? value : "diesel";
}

export const SETTINGS = {
  postalCode: env.VITE_DEFAULT_ZIP || "35516",
  apiHeaders: {
    "x-clientkey": env.VITE_API_CLIENT_KEY || "",
    "x-apikey": env.VITE_API_KEY || "",
  },
  fuel: {
    apiKey: env.VITE_TANKERKOENIG_API_KEY || "",
    radiusKm: clampFuelRadius(env.VITE_DEFAULT_FUEL_RADIUS_KM || 5),
    type: normalizeFuelType(env.VITE_DEFAULT_FUEL_TYPE || "diesel"),
  },
};

if (!SETTINGS.apiHeaders["x-clientkey"] || !SETTINGS.apiHeaders["x-apikey"]) {
  console.warn("[SP] Missing API credentials. Set VITE_API_CLIENT_KEY and VITE_API_KEY in .env");
}

if (!SETTINGS.fuel.apiKey) {
  console.warn("[SP] Missing Tankerkoenig API key. Set VITE_TANKERKOENIG_API_KEY in .env");
}

export const DEFAULT_ZIP = SETTINGS.postalCode;
export const API_HEADERS = SETTINGS.apiHeaders;
export const DEFAULT_TANKERKOENIG_API_KEY = SETTINGS.fuel.apiKey;
export const DEFAULT_FUEL_RADIUS_KM = SETTINGS.fuel.radiusKm;
export const DEFAULT_FUEL_TYPE = SETTINGS.fuel.type;
