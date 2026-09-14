import type { Listing, Page, Project, Rental, Session } from "./types";

const sessionKey = "ivy-session";

async function request<T>(path: string, options: RequestInit = {}, session?: Session): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  const response = await fetch(`/api${path}`, { ...options, headers });
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<Session> {
  const result = await request<{ access_token: string; refresh_token: string; user: { email: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const session = { accessToken: result.access_token, refreshToken: result.refresh_token, email: result.user.email };
  localStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
}

export async function refresh(session: Session): Promise<Session> {
  const result = await request<{ access_token: string }>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const renewed = { ...session, accessToken: result.access_token };
  localStorage.setItem(sessionKey, JSON.stringify(renewed));
  return renewed;
}

export function readSession(): Session | null {
  const raw = localStorage.getItem(sessionKey);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function clearSession() { localStorage.removeItem(sessionKey); }

export async function fetchAll<T>(path: string, session: Session): Promise<T[]> {
  const records: T[] = [];
  let offset = 0;
  while (true) {
    const page = await request<Page<T>>(`${path}?limit=1000&offset=${offset}`, {}, session);
    records.push(...page.results);
    if (!page.has_more) return records;
    offset += page.count;
  }
}

export const getListings = (session: Session) => fetchAll<Listing>("/v1/listings", session);
export const getRentals = (session: Session) => fetchAll<Rental>("/v1/rentals", session);
export const getProjects = (session: Session) => fetchAll<Project>("/v1/projects", session);