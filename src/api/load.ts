// Reads accounts and game content from the official API and maps them to the
// engine's data model. Only the fields the suggestions need are kept.
import type {
  AchievementDefinition,
  AchievementProgress,
  Catalog,
  PlayerData,
  Reward,
  WizardsVaultObjective,
} from "../engine/types";
import { RAID_WING_ACCESS } from "../gameData/raids";
import { WORLD_BOSS_SCHEDULE_UTC } from "../gameData/worldBosses";
import type { GameNames } from "../i18n/fr";
import { InvalidKeyError, MissingPermissionsError, type Gw2Client } from "./client";

export const REQUIRED_PERMISSIONS = ["account", "progression"] as const;

// Schema version where category achievements carry their required access.
const CATEGORY_SCHEMA = "2022-03-23T19:00:00.000Z";

interface ApiTokenInfo {
  permissions?: string[];
}
interface ApiAccount {
  access?: string[];
}
interface ApiAccountAchievement {
  id: number;
  current?: number;
  max?: number;
  done?: boolean;
  unlocked?: boolean;
}
interface ApiVault {
  objectives?: { id: number; title: string; acclaim: number; progress_current: number; progress_complete: number; claimed: boolean }[];
}
interface ApiCategory {
  id: number;
  achievements?: { id: number; required_access?: { product: string; condition: string } }[];
}
interface ApiAchievement {
  id: number;
  name: string;
  locked_text?: string;
  flags?: string[];
  tiers?: { count: number; points: number }[];
  prerequisites?: number[];
  rewards?: { type: string; id?: number; count?: number }[];
}
interface ApiTitle {
  id: number;
  name: string;
}
interface ApiDungeon {
  id: string;
  paths: { id: string }[];
}
interface ApiRaid {
  id: string;
  wings: { id: string; events: { id: string }[] }[];
}

// Legacy recurring achievements are no longer obtainable.
const IGNORED_ACHIEVEMENT_FLAGS = ["Daily", "Weekly", "Monthly"];

export async function loadPlayer(client: Gw2Client, playerId: string, name: string, key: string): Promise<PlayerData> {
  const tokenInfo = await client.get<ApiTokenInfo>("tokeninfo", { token: key });
  const granted = tokenInfo.permissions ?? [];
  const missing = REQUIRED_PERMISSIONS.filter((p) => !granted.includes(p));
  if (missing.length > 0) throw new MissingPermissionsError(missing);

  const get = <T>(path: string) => client.get<T>(path, { token: key });
  const [account, achievements, dungeons, raids, worldBosses, ...vaults] = await Promise.all([
    get<ApiAccount>("account"),
    get<ApiAccountAchievement[]>("account/achievements"),
    get<string[]>("account/dungeons"),
    get<string[]>("account/raids"),
    get<string[]>("account/worldbosses"),
    ...["daily", "weekly", "special"].map((period) => getVault(client, period, key)),
  ]);

  return {
    playerId,
    name,
    access: account.access ?? [],
    achievements: Object.fromEntries(achievements.map((a) => [a.id, toProgress(a)])),
    dungeonPathsDoneToday: dungeons,
    raidEncountersDoneThisWeek: raids,
    worldBossesDoneToday: worldBosses,
    wizardsVaultObjectives: vaults.flat(),
  };
}

async function getVault(client: Gw2Client, period: string, key: string): Promise<WizardsVaultObjective[]> {
  let vault: ApiVault;
  try {
    vault = await client.get<ApiVault>(`account/wizardsvault/${period}`, { token: key });
  } catch (error) {
    // The key was just validated, so a refusal here only means this list is
    // not readable; the other suggestions still work without it.
    if (error instanceof InvalidKeyError) return [];
    throw error;
  }
  return (vault.objectives ?? []).map((o) => ({
    id: o.id,
    title: o.title,
    acclaim: o.acclaim,
    current: o.progress_current,
    complete: o.progress_complete,
    claimed: o.claimed,
  }));
}

function toProgress(a: ApiAccountAchievement): AchievementProgress {
  return { current: a.current ?? 0, max: a.max ?? 0, done: a.done === true, unlocked: a.unlocked };
}

export async function loadCatalog(client: Gw2Client, names: GameNames): Promise<Catalog> {
  const [categories, dungeons, raids, worldBossIds] = await Promise.all([
    client.get<ApiCategory[]>("achievements/categories", { params: { ids: "all", v: CATEGORY_SCHEMA } }),
    client.get<ApiDungeon[]>("dungeons", { params: { ids: "all" } }),
    client.get<ApiRaid[]>("raids", { params: { ids: "all" } }),
    client.get<string[]>("worldbosses"),
  ]);

  // Only achievements listed in a category are current; the category also
  // tells which expansion they need.
  const placement = new Map<number, { categoryId: number; requiredAccess: string[] }>();
  for (const category of categories) {
    for (const entry of category.achievements ?? []) {
      const access = entry.required_access;
      // Content reserved to accounts without a product is skipped.
      if (access && access.condition !== "HasAccess") continue;
      placement.set(entry.id, { categoryId: category.id, requiredAccess: access ? [access.product] : [] });
    }
  }

  const apiAchievements = await client.getMany<ApiAchievement>("achievements", [...placement.keys()]);
  const titleIds = apiAchievements.flatMap((a) => (a.rewards ?? []).filter((r) => r.type === "Title").map((r) => r.id!));
  const titles = titleIds.length > 0 ? await client.getMany<ApiTitle>("titles", titleIds) : [];
  const titleNames = new Map(titles.map((t) => [t.id, t.name]));

  const achievements: AchievementDefinition[] = apiAchievements
    .filter((a) => !(a.flags ?? []).some((flag) => IGNORED_ACHIEVEMENT_FLAGS.includes(flag)))
    .filter((a) => (a.tiers ?? []).length > 0)
    .map((a) => {
      const tiers = a.tiers!;
      return {
        id: a.id,
        name: a.name,
        ...placement.get(a.id)!,
        prerequisites: a.prerequisites ?? [],
        requiresUnlock: (a.flags ?? []).includes("RequiresUnlock"),
        lockedText: a.locked_text ?? "",
        totalSteps: tiers[tiers.length - 1]!.count,
        rewards: toRewards(a, titleNames),
      };
    });

  return {
    achievements,
    dungeons: dungeons.map((d) => ({ id: d.id, name: names.dungeons[d.id] ?? d.id, pathIds: d.paths.map((p) => p.id) })),
    // A wing we do not know yet is skipped: its expansion is unknown.
    raidWings: raids.flatMap((raid) =>
      raid.wings.flatMap((wing) => {
        const requiredAccess = RAID_WING_ACCESS[wing.id];
        if (!requiredAccess) return [];
        return [
          {
            id: wing.id,
            name: names.raidWings[wing.id] ?? wing.id,
            requiredAccess,
            encounterIds: wing.events.map((e) => e.id),
          },
        ];
      }),
    ),
    worldBosses: worldBossIds.map((id) => ({
      id,
      name: names.worldBosses[id] ?? id,
      requiredAccess: [],
      scheduleUtc: WORLD_BOSS_SCHEDULE_UTC[id] ?? [],
    })),
  };
}

function toRewards(a: ApiAchievement, titleNames: Map<number, string>): Reward[] {
  const rewards: Reward[] = [];
  for (const reward of a.rewards ?? []) {
    if (reward.type === "Title") {
      const name = titleNames.get(reward.id!);
      if (name) rewards.push({ type: "title", name });
    } else if (reward.type === "Mastery") {
      rewards.push({ type: "mastery" });
    } else if (reward.type === "Item") {
      rewards.push({ type: "item" });
    }
  }
  const points = (a.tiers ?? []).reduce((sum, tier) => sum + tier.points, 0);
  if (points > 0) rewards.push({ type: "achievementPoints", amount: points });
  return rewards;
}
