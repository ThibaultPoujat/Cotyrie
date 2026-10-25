// Everything the page keeps lives in the browser's localStorage under one
// prefix, so "forget the keys" can erase it all without touching other pages
// served from the same origin.
import type { EngineResult, Suggestion } from "../engine/types";

export const STORAGE_PREFIX = "cotyrie:";
const PLAYERS_KEY = `${STORAGE_PREFIX}players`;
const SNAPSHOT_KEY = `${STORAGE_PREFIX}lastResult`;

const API_KEY_PATTERN =
  /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{20}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export function isApiKeyFormat(value: string): boolean {
  return API_KEY_PATTERN.test(value);
}

export interface StoredPlayer {
  id: string;
  name: string;
  key: string;
  present: boolean;
}

export interface Snapshot {
  readAt: Date;
  result: EngineResult;
}

export function loadPlayers(storage: Storage): StoredPlayer[] {
  const parsed = readJson(storage, PLAYERS_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (p): p is StoredPlayer =>
      typeof p?.id === "string" &&
      typeof p?.name === "string" &&
      typeof p?.key === "string" &&
      typeof p?.present === "boolean",
  );
}

export function savePlayers(storage: Storage, players: StoredPlayer[]): void {
  try {
    storage.setItem(PLAYERS_KEY, JSON.stringify(players));
  } catch {
    // Storage refused: the players stay for this visit only.
  }
}

// Fallback copy for when the API is down. When the full list does not fit,
// the best suggestions are kept.
const SNAPSHOT_FALLBACK_SIZE = 200;

export function saveSnapshot(storage: Storage, snapshot: Snapshot): void {
  try {
    storage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    try {
      const all = snapshot.result.all.slice(0, SNAPSHOT_FALLBACK_SIZE);
      storage.setItem(SNAPSHOT_KEY, JSON.stringify({ ...snapshot, result: { ...snapshot.result, all } }));
    } catch {
      // Storage refused: the page works without the fallback copy.
    }
  }
}

// Used when the browser refuses storage (blocked site data).
export class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length(): number {
    return this.items.size;
  }
  clear(): void {
    this.items.clear();
  }
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

export function browserStorage(): Storage {
  try {
    return window.localStorage;
  } catch {
    return new MemoryStorage();
  }
}

export function loadSnapshot(storage: Storage): Snapshot | undefined {
  const parsed = readJson(storage, SNAPSHOT_KEY) as
    | { readAt?: unknown; result?: { featured?: unknown; all?: unknown } }
    | undefined;
  if (typeof parsed?.readAt !== "string" || !Array.isArray(parsed.result?.featured) || !Array.isArray(parsed.result?.all)) {
    return undefined;
  }
  const revive = (s: Suggestion): Suggestion =>
    s.nextStart ? { ...s, nextStart: new Date(s.nextStart as unknown as string) } : s;
  return {
    readAt: new Date(parsed.readAt),
    result: {
      featured: (parsed.result.featured as Suggestion[]).map(revive),
      all: (parsed.result.all as Suggestion[]).map(revive),
    },
  };
}

// Erases every entry this page created.
export function forgetAll(storage: Storage): void {
  const ours: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) ours.push(key);
  }
  for (const key of ours) storage.removeItem(key);
}

function readJson(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}
