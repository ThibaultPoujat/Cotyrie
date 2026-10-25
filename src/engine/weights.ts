// Score weights. The spec leaves exact values to be tuned while using the V0.
import type { Reward } from "./types";

export const REWARD_WEIGHTS = {
  title: 30,
  mastery: 20,
  item: 10,
  loot: 5,
  perAchievementPoint: 1,
  perAcclaim: 1,
} as const;

export const REQUIRED_PLAYERS = {
  achievement: 1,
  dungeon: 5,
  raid: 10,
  // Open-world bosses: whoever is on the map joins in.
  worldBoss: 1,
  wizardsVault: 1,
} as const;

export function rewardValue(rewards: Reward[]): number {
  return rewards.reduce((total, reward) => {
    switch (reward.type) {
      case "title":
        return total + REWARD_WEIGHTS.title;
      case "mastery":
        return total + REWARD_WEIGHTS.mastery;
      case "item":
        return total + REWARD_WEIGHTS.item;
      case "loot":
        return total + REWARD_WEIGHTS.loot;
      case "achievementPoints":
        return total + reward.amount * REWARD_WEIGHTS.perAchievementPoint;
      case "acclaim":
        return total + reward.amount * REWARD_WEIGHTS.perAcclaim;
    }
  }, 0);
}
