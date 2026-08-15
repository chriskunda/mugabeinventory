const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Thin wrapper around fetch that:
 * - always points at the API base URL
 * - always sends credentials, so the httpOnly JWT cookie is included
 * - throws a normal Error with the server's message on failure, so
 *   you can just try/catch and read err.message in your components
 */
async function request(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include", // <-- required for the httpOnly cookie to be sent/received
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

// For file downloads (Excel export) fetch() is used directly instead of
// this wrapper, since the response is a binary blob, not JSON — see
// downloadFile() in src/api/reports.js for that pattern.
export const API_BASE_URL = BASE_URL;
