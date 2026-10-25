// The only place that talks to the network. Keys are only ever sent to the
// official Guild Wars 2 API and never appear in errors or logs.

export const API_ORIGIN = "https://api.guildwars2.com";
const MAX_IDS_PER_REQUEST = 200;
const CONCURRENT_REQUESTS = 5;

// The key is invalid or revoked.
export class InvalidKeyError extends Error {
  constructor() {
    super("Invalid API key");
    this.name = "InvalidKeyError";
  }
}

// The key lacks permissions the page needs.
export class MissingPermissionsError extends Error {
  constructor(readonly missing: string[]) {
    super("Missing API key permissions");
    this.name = "MissingPermissionsError";
  }
}

// Network failure, server error or rate limit.
export class ApiUnavailableError extends Error {
  constructor() {
    super("Guild Wars 2 API unavailable");
    this.name = "ApiUnavailableError";
  }
}

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export class Gw2Client {
  constructor(private readonly fetchFn: FetchFn = (input, init) => fetch(input, init)) {}

  async get<T>(path: string, options: { token?: string; params?: Record<string, string> } = {}): Promise<T> {
    const url = new URL(`/v2/${path}`, API_ORIGIN);
    // Defence in depth: refuse anything that would leave the official API.
    if (url.origin !== API_ORIGIN || !url.pathname.startsWith("/v2/")) {
      throw new Error("Refusing to call a URL outside the official API");
    }
    url.searchParams.set("lang", "fr");
    for (const [name, value] of Object.entries(options.params ?? {})) url.searchParams.set(name, value);
    if (options.token !== undefined) url.searchParams.set("access_token", options.token);

    let response: Response;
    try {
      response = await this.fetchFn(url.toString(), {
        credentials: "omit",
        referrerPolicy: "no-referrer",
        cache: "no-store",
      });
    } catch {
      throw new ApiUnavailableError();
    }
    if (response.status === 401 || (response.status === 403 && options.token !== undefined)) {
      throw new InvalidKeyError();
    }
    // Asking only for ids that no longer exist answers 404: nothing to read.
    if (response.status === 404 && options.params?.ids !== undefined) return [] as T;
    if (!response.ok) throw new ApiUnavailableError();
    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiUnavailableError();
    }
  }

  // Fetches many ids in chunks of 200, a few requests at a time.
  async getMany<T>(path: string, ids: (number | string)[], params: Record<string, string> = {}): Promise<T[]> {
    const chunks: (number | string)[][] = [];
    for (let i = 0; i < ids.length; i += MAX_IDS_PER_REQUEST) chunks.push(ids.slice(i, i + MAX_IDS_PER_REQUEST));

    const results: T[][] = [];
    for (let i = 0; i < chunks.length; i += CONCURRENT_REQUESTS) {
      const batch = chunks.slice(i, i + CONCURRENT_REQUESTS);
      results.push(
        ...(await Promise.all(batch.map((chunk) => this.get<T[]>(path, { params: { ...params, ids: chunk.join(",") } })))),
      );
    }
    return results.flat();
  }
}
