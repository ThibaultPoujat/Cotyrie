// Fictional players and game content for tests: no real account data.
import type { AchievementDefinition, Catalog, EngineInput, PlayerData } from "../engine/types";

export function makePlayer(name: string, overrides: Partial<PlayerData> = {}): PlayerData {
  return {
    playerId: `id-${name}`,
    name,
    access: ["GuildWars2"],
    achievements: {},
    dungeonPathsDoneToday: [],
    raidEncountersDoneThisWeek: [],
    worldBossesDoneToday: [],
    wizardsVaultObjectives: [],
    ...overrides,
  };
}

export function makeAchievement(
  id: number,
  overrides: Partial<AchievementDefinition> = {},
): AchievementDefinition {
  return {
    id,
    name: `Succès fictif ${id}`,
    categoryId: id,
    requiredAccess: [],
    prerequisites: [],
    requiresUnlock: false,
    lockedText: "",
    totalSteps: 5,
    rewards: [],
    ...overrides,
  };
}

export function emptyCatalog(overrides: Partial<Catalog> = {}): Catalog {
  return { achievements: [], dungeons: [], raidWings: [], worldBosses: [], ...overrides };
}

export function makeInput(players: PlayerData[], catalog: Partial<Catalog>, now?: Date): EngineInput {
  return { now: now ?? new Date("2026-10-25T10:00:00Z"), players, catalog: emptyCatalog(catalog) };
}
