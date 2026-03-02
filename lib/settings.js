const env = import.meta.env;

export const SETTINGS = {
  postalCode: env.VITE_DEFAULT_ZIP || "35516",
  apiHeaders: {
    "x-clientkey": env.VITE_API_CLIENT_KEY || "",
    "x-apikey": env.VITE_API_KEY || "",
  },
};

if (!SETTINGS.apiHeaders["x-clientkey"] || !SETTINGS.apiHeaders["x-apikey"]) {
  console.warn("[SP] Missing API credentials. Set VITE_API_CLIENT_KEY and VITE_API_KEY in .env");
}

export const DEFAULT_ZIP = SETTINGS.postalCode;
export const API_HEADERS = SETTINGS.apiHeaders;
