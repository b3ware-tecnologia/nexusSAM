const TOKEN_KEY = "nexusSAM_token";
const USER_KEY = "nexusSAM_user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Login failed" }));
    throw new Error(err.error || "Login failed");
  }
  return res.json();
}

export async function apiRegister(name: string, email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Registration failed" }));
    throw new Error(err.error || "Registration failed");
  }
  return res.json();
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const contentType = init?.body instanceof FormData ? undefined : "application/json";
  if (contentType && !headers["Content-Type"]) {
    headers["Content-Type"] = contentType;
  }
  return (originalFetch || fetch)(input, { ...init, headers }).then((res) => {
    if (res.status === 401 || res.status === 403) {
      if (getStoredToken()) {
        clearAuth();
        unpatchGlobalFetch();
        window.location.reload();
      }
    }
    return res;
  });
}

let originalFetch: typeof fetch | null = null;

export function patchGlobalFetch(): void {
  if (originalFetch) return;
  originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    return apiFetch(input, init);
  };
}

export function unpatchGlobalFetch(): void {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
}
