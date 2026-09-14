import type { Listing, Page, Project, Rental, Session } from "./types";

const sessionKey = "ivy-session";
const cacheTtlMs = 5 * 60 * 1000;
const collectionCache = new Map<string, { fetchedAt: number; records: unknown[] }>();

function logEvent(event: string, details: Record<string, unknown> = {}) {
  console.info(`[ivy ${new Date().toISOString()}] ${event}`, details);
}

async function request<T>(path: string, options: RequestInit = {}, session?: Session): Promise<T> {
  const startedAt = performance.now();
  const method = options.method ?? "GET";
  logEvent("request:start", { method, path });
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  try {
    const response = await fetch(`/api${path}`, { ...options, headers });
    const durationMs = Math.round(performance.now() - startedAt);
    if (!response.ok) {
      const errorBody = await response.text();
      logEvent("request:error", { method, path, status: response.status, durationMs, body: errorBody.slice(0, 240) });
      throw new Error(`${response.status}: ${errorBody}`);
    }
    logEvent("request:success", { method, path, status: response.status, durationMs });
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof TypeError) logEvent("request:network-error", { method, path, durationMs: Math.round(performance.now() - startedAt), message: error.message });
    throw error;
  }
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

export async function fetchAll<T>(path: string, session: Session, forceRefresh = false): Promise<T[]> {
  const cached = collectionCache.get(path);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < cacheTtlMs) {
    logEvent("collection:cache-hit", { path, records: cached.records.length, ageMs: Date.now() - cached.fetchedAt });
    return cached.records as T[];
  }
  const records: T[] = [];
  let offset = 0;
  const startedAt = performance.now();
  let pageNumber = 0;
  logEvent("collection:start", { path, forceRefresh, requestedLimit: 1000 });
  while (true) {
    pageNumber += 1;
    const pageStartedAt = performance.now();
    const page = await request<Page<T>>(`${path}?limit=1000&offset=${offset}`, {}, session);
    records.push(...page.results);
    logEvent("collection:page", { path, pageNumber, offset, count: page.count, totalReported: page.total, recordsLoaded: records.length, hasMore: page.has_more, durationMs: Math.round(performance.now() - pageStartedAt) });
    if (!page.has_more) {
      collectionCache.set(path, { fetchedAt: Date.now(), records });
      logEvent("collection:complete", { path, pages: pageNumber, records: records.length, durationMs: Math.round(performance.now() - startedAt) });
      return records;
    }
    offset += page.count;
  }
}

export const getListings = (session: Session, forceRefresh = false) => fetchAll<Listing>("/v1/listings", session, forceRefresh);
export const getRentals = (session: Session, forceRefresh = false) => fetchAll<Rental>("/v1/rentals", session, forceRefresh);
export const getProjects = (session: Session, forceRefresh = false) => fetchAll<Project>("/v1/projects", session, forceRefresh);