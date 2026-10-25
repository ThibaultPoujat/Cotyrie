// Data model of the suggestion engine. The engine only sees these shapes and
// never knows where the data comes from (browser today, server tomorrow).

// A game product the account may own, e.g. "PathOfFire". The engine treats
// these as opaque labels; the data source maps them from the official API.
export type Access = string;

export interface AchievementProgress {
  current: number;
  max: number;
  done: boolean;
  // False when the achievement must be unlocked first and is not yet.
  unlocked?: boolean;
}

export interface WizardsVaultObjective {
  id: number;
  // Display text, already in French.
  title: string;
  acclaim: number;
  current: number;
  complete: number;
  claimed: boolean;
}

export interface PlayerData {
  // Local label chosen by whoever holds the key, not the account name.
  playerId: string;
  name: string;
  access: Access[];
  // Only achievements the player has started; others count as not started.
  achievements: Record<number, AchievementProgress>;
  dungeonPathsDoneToday: string[];
  raidEncountersDoneThisWeek: string[];
  worldBossesDoneToday: string[];
  wizardsVaultObjectives: WizardsVaultObjective[];
}

export type Reward =
  | { type: "title"; name: string }
  | { type: "mastery" }
  | { type: "item" }
  | { type: "achievementPoints"; amount: number }
  | { type: "acclaim"; amount: number }
  | { type: "loot" };

export interface AchievementDefinition {
  id: number;
  // Display name, already in French (fetched with lang=fr).
  name: string;
  categoryId: number;
  // Every product a player needs to take part. Empty means base game only.
  requiredAccess: Access[];
  // Achievements a player must complete before this one.
  prerequisites: number[];
  // The player's progress must say "unlocked" before they can work on it.
  requiresUnlock: boolean;
  // How to unlock it, as given by the official API (may be empty).
  lockedText: string;
  // Steps to complete it from scratch (count of the last tier).
  totalSteps: number;
  rewards: Reward[];
}

export interface DungeonDefinition {
  id: string;
  name: string;
  pathIds: string[];
}

export interface RaidWingDefinition {
  id: string;
  name: string;
  requiredAccess: Access[];
  encounterIds: string[];
}

export interface WorldBossDefinition {
  id: string;
  name: string;
  requiredAccess: Access[];
  // Spawn times of day in UTC, "HH:MM".
  scheduleUtc: string[];
}

export interface Catalog {
  achievements: AchievementDefinition[];
  dungeons: DungeonDefinition[];
  raidWings: RaidWingDefinition[];
  worldBosses: WorldBossDefinition[];
}

export interface EngineInput {
  now: Date;
  // Players marked as present.
  players: PlayerData[];
  catalog: Catalog;
}

export type ActivityKind = "achievement" | "dungeon" | "raid" | "worldBoss" | "wizardsVault";

export interface Beneficiary {
  playerId: string;
  name: string;
  stepsRemaining: number;
  // Set when this player must unlock the activity first: what to unlock.
  mustUnlockFirst?: string;
}

export interface Suggestion {
  // Unique across kinds, e.g. "achievement:42".
  key: string;
  kind: ActivityKind;
  name: string;
  // Only set for achievements, to vary the featured suggestions.
  categoryId?: number;
  beneficiaries: Beneficiary[];
  // Effort for the group: the most steps any beneficiary still has to do.
  stepsRemaining: number;
  requiredPlayers: number;
  // Seats to fill with the in-game LFG, 0 when enough players are present.
  missingPlayers: number;
  rewards: Reward[];
  // Next spawn, for world bosses.
  nextStart?: Date;
}

export interface EngineResult {
  // Up to 3 suggestions put forward.
  featured: Suggestion[];
  // Every possible activity, best score first.
  all: Suggestion[];
}
