import { nextStartUtc } from "./schedule";
import type {
  Access,
  AchievementDefinition,
  Beneficiary,
  EngineInput,
  EngineResult,
  PlayerData,
  Suggestion,
} from "./types";
import { REQUIRED_PLAYERS, rewardValue } from "./weights";

export const FEATURED_COUNT = 3;

export function suggest(input: EngineInput): EngineResult {
  const all = collectActivities(input).sort(compareSuggestions);
  return { featured: pickFeatured(all), all };
}

// Higher score first: more beneficiaries, then fewer steps, then a better
// reward. Name and key only make the order stable.
export function compareSuggestions(a: Suggestion, b: Suggestion): number {
  return (
    b.beneficiaries.length - a.beneficiaries.length ||
    a.stepsRemaining - b.stepsRemaining ||
    rewardValue(b.rewards) - rewardValue(a.rewards) ||
    a.name.localeCompare(b.name, "fr") ||
    a.key.localeCompare(b.key)
  );
}

// Best suggestions first, varying the types: never 3 activities of the same
// kind, never 3 achievements of the same category. When the possible
// activities cannot vary that much, each rule is relaxed in turn (kind first)
// so that 3 suggestions are still featured.
function pickFeatured(sorted: Suggestion[]): Suggestion[] {
  const featured: Suggestion[] = [];
  const limit = FEATURED_COUNT - 1;
  const sameKind = (c: Suggestion) => featured.filter((s) => s.kind === c.kind).length >= limit;
  const sameCategory = (c: Suggestion) =>
    c.kind === "achievement" &&
    featured.filter((s) => s.kind === "achievement" && s.categoryId === c.categoryId).length >= limit;
  const passes: ((c: Suggestion) => boolean)[] = [
    (c) => !sameKind(c) && !sameCategory(c),
    (c) => !sameCategory(c),
    () => true,
  ];
  for (const allowed of passes) {
    for (const candidate of sorted) {
      if (featured.length === FEATURED_COUNT) break;
      if (!featured.includes(candidate) && allowed(candidate)) featured.push(candidate);
    }
  }
  return featured.sort(compareSuggestions);
}

function collectActivities(input: EngineInput): Suggestion[] {
  const { players, catalog, now } = input;
  const suggestions: Suggestion[] = [];

  for (const achievement of catalog.achievements) {
    if (!isAccessibleToAll(achievement.requiredAccess, players)) continue;
    const beneficiaries = players.flatMap((player) => achievementBeneficiary(achievement, player));
    if (beneficiaries.length === 0) continue;
    suggestions.push(
      build(players, {
        key: `achievement:${achievement.id}`,
        kind: "achievement",
        name: achievement.name,
        categoryId: achievement.categoryId,
        beneficiaries,
        requiredPlayers: REQUIRED_PLAYERS.achievement,
        rewards: achievement.rewards,
      }),
    );
  }

  for (const dungeon of catalog.dungeons) {
    const beneficiaries = players.flatMap((player) =>
      remainingBeneficiary(player, dungeon.pathIds, player.dungeonPathsDoneToday),
    );
    if (beneficiaries.length === 0) continue;
    suggestions.push(
      build(players, {
        key: `dungeon:${dungeon.id}`,
        kind: "dungeon",
        name: dungeon.name,
        beneficiaries,
        requiredPlayers: REQUIRED_PLAYERS.dungeon,
        rewards: [{ type: "loot" }],
      }),
    );
  }

  for (const wing of catalog.raidWings) {
    if (!isAccessibleToAll(wing.requiredAccess, players)) continue;
    const beneficiaries = players.flatMap((player) =>
      remainingBeneficiary(player, wing.encounterIds, player.raidEncountersDoneThisWeek),
    );
    if (beneficiaries.length === 0) continue;
    suggestions.push(
      build(players, {
        key: `raid:${wing.id}`,
        kind: "raid",
        name: wing.name,
        beneficiaries,
        requiredPlayers: REQUIRED_PLAYERS.raid,
        rewards: [{ type: "loot" }],
      }),
    );
  }

  for (const boss of catalog.worldBosses) {
    if (!isAccessibleToAll(boss.requiredAccess, players)) continue;
    // A boss is only suggested with its next spawn time.
    const nextStart = nextStartUtc(boss.scheduleUtc, now);
    if (!nextStart) continue;
    // A kill today no longer counts once the next spawn is after the daily
    // reset (midnight UTC).
    const sameDay = nextStart.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
    const beneficiaries = players.flatMap((player) =>
      remainingBeneficiary(player, [boss.id], sameDay ? player.worldBossesDoneToday : []),
    );
    if (beneficiaries.length === 0) continue;
    suggestions.push(
      build(players, {
        key: `worldBoss:${boss.id}`,
        kind: "worldBoss",
        name: boss.name,
        beneficiaries,
        requiredPlayers: REQUIRED_PLAYERS.worldBoss,
        rewards: [{ type: "loot" }],
        nextStart,
      }),
    );
  }

  suggestions.push(...wizardsVaultSuggestions(players));
  return suggestions;
}

// Each player has their own Wizard's Vault list: an objective benefits the
// players who have it and have not finished it.
function wizardsVaultSuggestions(players: PlayerData[]): Suggestion[] {
  const byId = new Map<number, { title: string; acclaim: number; beneficiaries: Beneficiary[] }>();
  for (const player of players) {
    for (const objective of player.wizardsVaultObjectives) {
      const stepsRemaining = objective.complete - objective.current;
      if (objective.claimed || stepsRemaining <= 0) continue;
      const entry = byId.get(objective.id) ?? {
        title: objective.title,
        acclaim: objective.acclaim,
        beneficiaries: [],
      };
      entry.beneficiaries.push({ playerId: player.playerId, name: player.name, stepsRemaining });
      byId.set(objective.id, entry);
    }
  }
  return [...byId].map(([id, entry]) =>
    build(players, {
      key: `wizardsVault:${id}`,
      kind: "wizardsVault",
      name: entry.title,
      beneficiaries: entry.beneficiaries,
      requiredPlayers: REQUIRED_PLAYERS.wizardsVault,
      rewards: [{ type: "acclaim", amount: entry.acclaim }],
    }),
  );
}

function build(
  players: PlayerData[],
  fields: Omit<Suggestion, "stepsRemaining" | "missingPlayers">,
): Suggestion {
  return {
    ...fields,
    stepsRemaining: Math.max(...fields.beneficiaries.map((b) => b.stepsRemaining)),
    missingPlayers: Math.max(0, fields.requiredPlayers - players.length),
  };
}

// An activity is only suggested when every present player owns what it needs.
function isAccessibleToAll(requiredAccess: Access[], players: PlayerData[]): boolean {
  return players.every((player) => requiredAccess.every((access) => player.access.includes(access)));
}

function achievementBeneficiary(achievement: AchievementDefinition, player: PlayerData): Beneficiary[] {
  const progress = player.achievements[achievement.id];
  if (progress?.done) return [];

  const stepsRemaining = progress
    ? Math.max(1, (progress.max || achievement.totalSteps) - progress.current)
    : Math.max(1, achievement.totalSteps);
  const beneficiary: Beneficiary = { playerId: player.playerId, name: player.name, stepsRemaining };

  // A missing prerequisite does not drop the suggestion: it is reported.
  if (isLockedFor(achievement, player)) {
    beneficiary.mustUnlockFirst = achievement.lockedText.trim();
  }
  return [beneficiary];
}

function isLockedFor(achievement: AchievementDefinition, player: PlayerData): boolean {
  const progress = player.achievements[achievement.id];
  // The API leaves "unlocked" out once unlocked; no progress at all means
  // the player never got access to it.
  if (achievement.requiresUnlock && (!progress || progress.unlocked === false)) return true;
  return achievement.prerequisites.some((id) => player.achievements[id]?.done !== true);
}

// Benefits a player who still has some of `ids` left to do.
function remainingBeneficiary(player: PlayerData, ids: string[], done: string[]): Beneficiary[] {
  const stepsRemaining = ids.filter((id) => !done.includes(id)).length;
  if (stepsRemaining === 0) return [];
  return [{ playerId: player.playerId, name: player.name, stepsRemaining }];
}

