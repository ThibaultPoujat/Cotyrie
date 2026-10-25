// World boss spawn times in UTC, copied from the official wiki
// (https://wiki.guildwars2.com/wiki/World_boss). The API does not provide them.

function every(hours: number, firstHour: number, minute: number): string[] {
  const times: string[] = [];
  for (let hour = firstHour; hour < 24; hour += hours) {
    times.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  }
  return times;
}

export const WORLD_BOSS_SCHEDULE_UTC: Record<string, string[]> = {
  admiral_taidha_covington: every(3, 0, 0),
  svanir_shaman_chief: every(2, 0, 15),
  megadestroyer: every(3, 0, 30),
  fire_elemental: every(2, 0, 45),
  the_shatterer: every(3, 1, 0),
  great_jungle_wurm: every(2, 1, 15),
  modniir_ulgoth: every(3, 1, 30),
  shadow_behemoth: every(2, 1, 45),
  inquest_golem_mark_ii: every(3, 2, 0),
  claw_of_jormag: every(3, 2, 30),
  tequatl_the_sunless: ["00:00", "03:00", "07:00", "11:30", "16:00", "19:00"],
  triple_trouble_wurm: ["01:00", "04:00", "08:00", "12:30", "17:00", "20:00"],
  karka_queen: ["02:00", "06:00", "10:30", "15:00", "18:00", "23:00"],
};
