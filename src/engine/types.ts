// Data model of the suggestion engine. The engine only sees these shapes and
// never knows where the data comes from (browser today, server tomorrow).

// A game product the account may own, e.g. "PathOfFire". The engine treats
// these as opaque labels; the data source maps them from the official API.
export type Access = string;

export interface PlayerProgress {
  // Local label chosen by whoever holds the key, not the account name.
  playerId: string;
  name: string;
  access: Access[];
}

export interface AchievementDefinition {
  id: number;
  // Display name, already in French (fetched with lang=fr).
  name: string;
  // Every product a player needs to take part. Empty means base game only.
  requiredAccess: Access[];
}

export interface EngineInput {
  // Players marked as present.
  players: PlayerProgress[];
  achievements: AchievementDefinition[];
}

export interface Suggestion {
  kind: "achievement";
  activityId: number;
  name: string;
}
