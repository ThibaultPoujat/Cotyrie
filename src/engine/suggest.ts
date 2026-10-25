import type { AchievementDefinition, EngineInput, PlayerProgress, Suggestion } from "./types";

export function suggest(input: EngineInput): Suggestion[] {
  return input.achievements
    .filter((achievement) => isAccessibleToAll(achievement, input.players))
    .map((achievement) => ({
      kind: "achievement",
      activityId: achievement.id,
      name: achievement.name,
    }));
}

// An activity is only suggested when every present player owns what it needs.
function isAccessibleToAll(achievement: AchievementDefinition, players: PlayerProgress[]): boolean {
  return players.every((player) =>
    achievement.requiredAccess.every((access) => player.access.includes(access)),
  );
}
