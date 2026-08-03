const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// Keep local development zero-config while allowing deployments to target any API host.
export const API_BASE_URL = (configuredApiUrl || "http://127.0.0.1:8000").replace(
	/\/$/,
	"",
);

const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
export const API_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0
	? configuredTimeout
	: 10000;
