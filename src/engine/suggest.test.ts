import { describe, expect, it } from "vitest";
import { makeAchievement, makeInput, makePlayer } from "../test/fixtures";
import { formatLocalTime } from "../ui/format";
import { suggest } from "./suggest";
import type { RaidWingDefinition, WorldBossDefinition } from "./types";

const keys = (input: Parameters<typeof suggest>[0]) => suggest(input).all.map((s) => s.key);

describe("S1", () => {
  it("S1: if a present player does not own an expansion, no suggestion concerns it", () => {
    const alice = makePlayer("Alice", { access: ["GuildWars2", "HeartOfThorns", "PathOfFire"] });
    const bruno = makePlayer("Bruno", { access: ["GuildWars2", "HeartOfThorns"] });
    const achievements = [
      makeAchievement(1),
      makeAchievement(2, { requiredAccess: ["HeartOfThorns"] }),
      makeAchievement(3, { requiredAccess: ["PathOfFire"] }),
    ];
    const raidWings: RaidWingDefinition[] = [
      { id: "desert_wing", name: "Aile du désert", requiredAccess: ["PathOfFire"], encounterIds: ["e1"] },
    ];

    const together = keys(makeInput([alice, bruno], { achievements, raidWings }));
    expect(together).toEqual(expect.arrayContaining(["achievement:1", "achievement:2"]));
    expect(together).not.toContain("achievement:3");
    expect(together).not.toContain("raid:desert_wing");

    // Once that player is no longer present, the expansion comes back.
    const aliceAlone = keys(makeInput([alice], { achievements, raidWings }));
    expect(aliceAlone).toEqual(expect.arrayContaining(["achievement:3", "raid:desert_wing"]));
  });
});

describe("S2", () => {
  it("S2: an achievement locked by a prerequisite for one player is still suggested, with what that player must unlock first", () => {
    const alice = makePlayer("Alice", {
      achievements: { 10: { current: 1, max: 1, done: true }, 11: { current: 0, max: 3, done: false } },
    });
    const bruno = makePlayer("Bruno");
    const locked = makeAchievement(11, {
      prerequisites: [10],
      requiresUnlock: true,
      lockedText: "Terminez l'histoire « Le Chant fictif ».",
    });

    const [suggestion] = suggest(makeInput([alice, bruno], { achievements: [locked] })).all;
    expect(suggestion?.key).toBe("achievement:11");
    const byName = Object.fromEntries(suggestion!.beneficiaries.map((b) => [b.name, b]));
    expect(byName.Bruno?.mustUnlockFirst).toBe("Terminez l'histoire « Le Chant fictif ».");
    expect(byName.Alice?.mustUnlockFirst).toBeUndefined();
  });
});

describe("S3", () => {
  it("S3: an achievement completed by every present player is never suggested", () => {
    const done = { 7: { current: 5, max: 5, done: true } };
    const alice = makePlayer("Alice", { achievements: done });
    const bruno = makePlayer("Bruno", { achievements: done });
    const chloe = makePlayer("Chloé");
    const achievements = [makeAchievement(7)];

    expect(keys(makeInput([alice, bruno], { achievements }))).not.toContain("achievement:7");
    // Still suggested when someone present has not finished it.
    expect(keys(makeInput([alice, bruno, chloe], { achievements }))).toContain("achievement:7");
  });
});

describe("S4", () => {
  it("S4: at equal effort, an activity benefiting 3 players ranks before one benefiting 1 player", () => {
    const doneByTwo = { 1: { current: 5, max: 5, done: true } };
    const players = [
      makePlayer("Alice"),
      makePlayer("Bruno", { achievements: doneByTwo }),
      makePlayer("Chloé", { achievements: doneByTwo }),
    ];
    const onlyAlice = makeAchievement(1, { totalSteps: 5 });
    const everyone = makeAchievement(2, { totalSteps: 5 });

    const result = suggest(makeInput(players, { achievements: [onlyAlice, everyone] }));
    expect(result.all.map((s) => s.key)).toEqual(["achievement:2", "achievement:1"]);
    expect(result.all[0]?.beneficiaries).toHaveLength(3);
    expect(result.all[1]?.beneficiaries).toHaveLength(1);
  });
});

describe("S5", () => {
  it("S5: at equal benefit, an achievement 1 step from the end ranks before one 10 steps from the end", () => {
    const alice = makePlayer("Alice", {
      achievements: {
        1: { current: 0, max: 10, done: false },
        2: { current: 9, max: 10, done: false },
      },
    });
    const achievements = [makeAchievement(1, { totalSteps: 10 }), makeAchievement(2, { totalSteps: 10 })];

    const result = suggest(makeInput([alice], { achievements }));
    expect(result.all.map((s) => [s.key, s.stepsRemaining])).toEqual([
      ["achievement:2", 1],
      ["achievement:1", 10],
    ]);
  });
});

describe("S6", () => {
  it("S6: a raid needing 10 players with 3 present must be completed with 7 seats from the in-game LFG", () => {
    const players = ["Alice", "Bruno", "Chloé"].map((n) => makePlayer(n, { access: ["GuildWars2", "HeartOfThorns"] }));
    const raidWings: RaidWingDefinition[] = [
      { id: "wing", name: "Aile fictive", requiredAccess: ["HeartOfThorns"], encounterIds: ["a", "b"] },
    ];

    const [raid] = suggest(makeInput(players, { raidWings })).all;
    expect(raid?.requiredPlayers).toBe(10);
    expect(raid?.missingPlayers).toBe(7);
  });
});

describe("S7", () => {
  const boss: WorldBossDefinition = {
    id: "boss",
    name: "Boss fictif",
    requiredAccess: [],
    scheduleUtc: ["01:00", "13:30"],
  };

  it("S7: a world boss is only suggested with its next spawn time, shown in local time", () => {
    const players = [makePlayer("Alice")];

    const summer = suggest(makeInput(players, { worldBosses: [boss] }, new Date("2026-07-01T12:00:00Z"))).all[0];
    expect(summer?.nextStart?.toISOString()).toBe("2026-07-01T13:30:00.000Z");
    expect(formatLocalTime(summer!.nextStart!, "Europe/Paris")).toBe("15:30");

    // After the last spawn of the day, the next one is tomorrow; winter time is handled.
    const winter = suggest(makeInput(players, { worldBosses: [boss] }, new Date("2026-12-01T20:00:00Z"))).all[0];
    expect(winter?.nextStart?.toISOString()).toBe("2026-12-02T01:00:00.000Z");
    expect(formatLocalTime(winter!.nextStart!, "Europe/Paris")).toBe("02:00");

    // Without a known spawn time, the boss is not suggested.
    const unscheduled = { ...boss, id: "unscheduled", scheduleUtc: [] };
    expect(keys(makeInput(players, { worldBosses: [unscheduled] }))).toEqual([]);
  });
});

describe("S8", () => {
  it("S8: a world boss already done today by every present player is not suggested", () => {
    const boss: WorldBossDefinition = { id: "boss", name: "Boss fictif", requiredAccess: [], scheduleUtc: ["12:00"] };
    const alice = makePlayer("Alice", { worldBossesDoneToday: ["boss"] });
    const bruno = makePlayer("Bruno", { worldBossesDoneToday: ["boss"] });
    const chloe = makePlayer("Chloé");

    expect(keys(makeInput([alice, bruno], { worldBosses: [boss] }))).toEqual([]);
    expect(keys(makeInput([alice, bruno, chloe], { worldBosses: [boss] }))).toEqual(["worldBoss:boss"]);

    // Today's kill no longer counts when the next spawn is after the daily reset.
    const lateEvening = new Date("2026-10-25T22:00:00Z");
    expect(keys(makeInput([alice, bruno], { worldBosses: [boss] }, lateEvening))).toEqual(["worldBoss:boss"]);
  });
});

describe("Featured suggestions (spec: choice of the 3 suggestions)", () => {
  it("never features 3 achievements of the same category", () => {
    const players = [makePlayer("Alice")];
    const achievements = [
      makeAchievement(1, { categoryId: 9, totalSteps: 1 }),
      makeAchievement(2, { categoryId: 9, totalSteps: 2 }),
      makeAchievement(3, { categoryId: 9, totalSteps: 3 }),
      makeAchievement(4, { categoryId: 8, totalSteps: 4 }),
    ];

    const result = suggest(makeInput(players, { achievements }));
    expect(result.featured.map((s) => s.key)).toEqual(["achievement:1", "achievement:2", "achievement:4"]);
    expect(result.all).toHaveLength(4);
  });

  it("groups each player's own Wizard's Vault objectives", () => {
    const objective = { id: 5, title: "Vaincre 10 ennemis fictifs", acclaim: 10, current: 2, complete: 10, claimed: false };
    const alice = makePlayer("Alice", { wizardsVaultObjectives: [objective] });
    const bruno = makePlayer("Bruno", { wizardsVaultObjectives: [{ ...objective, current: 10 }] });
    const chloe = makePlayer("Chloé", { wizardsVaultObjectives: [{ ...objective, current: 7 }] });

    const [vault] = suggest(makeInput([alice, bruno, chloe], {})).all;
    expect(vault?.key).toBe("wizardsVault:5");
    expect(vault?.beneficiaries.map((b) => [b.name, b.stepsRemaining])).toEqual([
      ["Alice", 8],
      ["Chloé", 3],
    ]);
  });
});
