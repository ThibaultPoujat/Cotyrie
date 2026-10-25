// Expansion needed for each achievement. The API's "required_access" field on
// categories is empty, so access comes from the achievement groups and, for
// groups that mix content, from a few categories. Ids checked against
// /v2/achievements/groups and /v2/achievements/categories on 2026-10-25.

export const ACHIEVEMENT_GROUPS = {
  daily: "18DB115A-8637-4290-A636-821362A3C4A8",
  historical: "A9F7378E-9C8A-48CC-9505-3094E661D5F6",
  heartOfThorns: "65B4B678-607E-4D97-B458-076C3E96A810",
  pathOfFire: "B42E2379-9599-46CA-9D4A-40A27E192BBE",
  endOfDragons: "B1311A68-2F67-4718-AB57-5E1750C1410B",
  secretsOfTheObscure: "345BA893-F022-40B8-A881-DB7422D95AE5",
  janthirWilds: "43167413-6A41-4407-8A42-EEB33825EDC5",
  visionsOfEternity: "1869FD2C-6305-4A75-8305-78AE94E1404A",
} as const;

// Legacy dailies and historical achievements can no longer be earned.
export const EXCLUDED_ACHIEVEMENT_GROUPS: string[] = [ACHIEVEMENT_GROUPS.daily, ACHIEVEMENT_GROUPS.historical];

// "VisionsOfEternity" is the expected account access value; it could not be
// checked against an account yet.
export const ACHIEVEMENT_GROUP_ACCESS: Record<string, string> = {
  [ACHIEVEMENT_GROUPS.heartOfThorns]: "HeartOfThorns",
  [ACHIEVEMENT_GROUPS.pathOfFire]: "PathOfFire",
  [ACHIEVEMENT_GROUPS.endOfDragons]: "EndOfDragons",
  [ACHIEVEMENT_GROUPS.secretsOfTheObscure]: "SecretsOfTheObscure",
  [ACHIEVEMENT_GROUPS.janthirWilds]: "JanthirWilds",
  [ACHIEVEMENT_GROUPS.visionsOfEternity]: "VisionsOfEternity",
};

const byAccess: Record<string, number[]> = {
  // Raid wings 1 to 4, raid general and weekly raids; story acts.
  HeartOfThorns: [124, 134, 138, 155, 476, 477, 104, 121, 122, 123],
  // Raid wings 5 to 7; story acts.
  PathOfFire: [195, 215, 229, 183, 187, 188],
  // Strike missions, Dragonstorm; story acts and interlude.
  EndOfDragons: [333, 284, 311, 312, 319, 322, 325, 354],
  // Strike missions, rift hunting; story acts and updates.
  SecretsOfTheObscure: [362, 361, 355, 360, 368, 405, 408, 417],
  // Raid wing 8, Guardian's Glade; story acts and updates.
  JanthirWilds: [438, 480, 424, 427, 442, 445, 457],
  // Nexus of Eternity raid; story acts and updates.
  VisionsOfEternity: [488, 469, 471, 481, 485],
};

export const ACHIEVEMENT_CATEGORY_ACCESS: Record<number, string> = Object.fromEntries(
  Object.entries(byAccess).flatMap(([access, categories]) => categories.map((id) => [id, access])),
);
