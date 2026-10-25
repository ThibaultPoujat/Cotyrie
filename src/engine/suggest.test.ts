import { describe, expect, it } from "vitest";
import { suggest } from "./suggest";
import type { AchievementDefinition, PlayerProgress } from "./types";

// Fictional players and achievements only: no real account data in tests.
const alice: PlayerProgress = {
  playerId: "p1",
  name: "Alice",
  access: ["GuildWars2", "HeartOfThorns", "PathOfFire"],
};
const bruno: PlayerProgress = {
  playerId: "p2",
  name: "Bruno",
  access: ["GuildWars2", "HeartOfThorns"],
};

const baseGame: AchievementDefinition = { id: 1, name: "Explorateur de Tyrie", requiredAccess: [] };
const heartOfThorns: AchievementDefinition = {
  id: 2,
  name: "Maître des jungles",
  requiredAccess: ["HeartOfThorns"],
};
const pathOfFire: AchievementDefinition = {
  id: 3,
  name: "Voyageur du désert",
  requiredAccess: ["PathOfFire"],
};

describe("S1", () => {
  it("S1: if a present player does not own an expansion, no suggestion concerns it", () => {
    const suggestions = suggest({
      players: [alice, bruno],
      achievements: [baseGame, heartOfThorns, pathOfFire],
    });

    expect(suggestions.map((s) => s.activityId)).toEqual([baseGame.id, heartOfThorns.id]);
  });

  it("S1: the expansion is suggested again once that player is no longer present", () => {
    const suggestions = suggest({
      players: [alice],
      achievements: [baseGame, heartOfThorns, pathOfFire],
    });

    expect(suggestions.map((s) => s.activityId)).toContain(pathOfFire.id);
  });
});
