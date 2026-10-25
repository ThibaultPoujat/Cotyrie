// A fake official API serving fictional content, to test the page end to end
// without the network.
import type { FetchFn } from "../api/client";

export function fakeKey(digit: number): string {
  const d = String(digit);
  return `${d.repeat(8)}-${d.repeat(4)}-${d.repeat(4)}-${d.repeat(4)}-${d.repeat(20)}-${d.repeat(4)}-${d.repeat(4)}-${d.repeat(4)}-${d.repeat(12)}`;
}

export interface FakeAccount {
  permissions?: string[];
  access?: string[];
  achievements?: { id: number; current: number; max: number; done: boolean; unlocked?: boolean }[];
  dungeons?: string[];
  raids?: string[];
  worldbosses?: string[];
  vaultDaily?: { id: number; title: string; acclaim: number; progress_current: number; progress_complete: number; claimed: boolean }[];
}

export interface FakeApiOptions {
  accounts: Record<string, FakeAccount>;
  down?: boolean;
}

export const FAKE_CONTENT = {
  categories: [
    { id: 1, name: "Catégorie fictive", achievements: [{ id: 101 }, { id: 102 }, { id: 103, required_access: { product: "PathOfFire", condition: "HasAccess" } }] },
    { id: 2, name: "Autre catégorie fictive", achievements: [{ id: 104 }] },
  ],
  achievements: [
    { id: 101, name: "Collectionneur fictif", locked_text: "", flags: [], tiers: [{ count: 3, points: 5 }], rewards: [{ type: "Title", id: 900 }] },
    { id: 102, name: "Chasseur fictif", locked_text: "", flags: [], tiers: [{ count: 10, points: 10 }] },
    { id: 103, name: "Voyageur du désert fictif", locked_text: "", flags: [], tiers: [{ count: 1, points: 1 }] },
    {
      id: 104,
      name: "Héritier fictif",
      locked_text: "Terminez le succès « Collectionneur fictif ».",
      flags: ["RequiresUnlock"],
      prerequisites: [101],
      tiers: [{ count: 2, points: 5 }],
      rewards: [{ type: "Mastery", id: 1, region: "Tyria" }],
    },
  ],
  titles: [{ id: 900, name: "Collectionneur de fiction" }],
  dungeons: [{ id: "ascalonian_catacombs", paths: [{ id: "ac_story" }, { id: "hodgins" }] }],
  raids: [{ id: "forsaken_thicket", wings: [{ id: "spirit_vale", events: [{ id: "vale_guardian" }, { id: "gorseval" }] }] }],
  worldbosses: ["the_shatterer", "unscheduled_boss"],
};

export function createFakeApi(options: FakeApiOptions): { fetch: FetchFn; calls: string[] } {
  const calls: string[] = [];
  const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

  const fetchFn: FetchFn = (input) => {
    calls.push(input);
    if (options.down) return Promise.reject(new TypeError("Failed to fetch"));
    const url = new URL(input);
    const path = url.pathname.replace(/^\/v2\//, "");
    const ids = url.searchParams.get("ids")?.split(",");
    const byIds = <T extends { id: number }>(list: T[]) => list.filter((item) => ids?.includes(String(item.id)));

    switch (path) {
      case "achievements/categories":
        return json(FAKE_CONTENT.categories);
      case "achievements":
        return json(byIds(FAKE_CONTENT.achievements));
      case "titles":
        return json(byIds(FAKE_CONTENT.titles));
      case "dungeons":
        return json(FAKE_CONTENT.dungeons);
      case "raids":
        return json(FAKE_CONTENT.raids);
      case "worldbosses":
        return json(FAKE_CONTENT.worldbosses);
    }

    const account = options.accounts[url.searchParams.get("access_token") ?? ""];
    if (!account) return json({ text: "Invalid access token" }, 401);
    switch (path) {
      case "tokeninfo":
        return json({ id: "fictional", name: "fictional", permissions: account.permissions ?? ["account", "progression"] });
      case "account":
        return json({ access: account.access ?? ["GuildWars2"] });
      case "account/achievements":
        return json(account.achievements ?? []);
      case "account/dungeons":
        return json(account.dungeons ?? []);
      case "account/raids":
        return json(account.raids ?? []);
      case "account/worldbosses":
        return json(account.worldbosses ?? []);
      case "account/wizardsvault/daily":
        return json({ objectives: account.vaultDaily ?? [] });
      case "account/wizardsvault/weekly":
      case "account/wizardsvault/special":
        return json({ objectives: [] });
    }
    return json({ text: "not found" }, 404);
  };
  return { fetch: fetchFn, calls };
}
