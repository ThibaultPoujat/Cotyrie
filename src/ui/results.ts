// Renders the engine's suggestions. Every sentence comes from the texts.
import type { EngineResult, Reward, Suggestion } from "../engine/types";
import { FEATURED_COUNT } from "../engine/suggest";
import { joinNames, type Texts } from "../i18n/fr";
import { el } from "./dom";
import { formatLocalDateTime, formatLocalTime } from "./format";

export function renderResults(result: EngineResult, readAt: Date, t: Texts, timeZone?: string): HTMLElement {
  const section = el("section", { class: "results" });
  section.append(el("p", { class: "last-read" }, t.lastRead(formatLocalDateTime(readAt, timeZone))));

  if (result.all.length < FEATURED_COUNT) {
    section.append(el("p", { class: "fewer" }, t.fewerThanThree(result.all.length)));
  }

  if (result.featured.length > 0) {
    const featured = el("ol", { class: "featured" });
    for (const suggestion of result.featured) featured.append(el("li", {}, renderSuggestion(suggestion, t, timeZone)));
    section.append(el("h2", {}, t.featuredHeading), featured);
  }

  if (result.all.length > 0) {
    const list = el("ol", { class: "all" });
    for (const suggestion of result.all) list.append(el("li", {}, renderSuggestion(suggestion, t, timeZone)));
    section.append(el("details", { class: "all-activities" }, el("summary", {}, t.allHeading(result.all.length)), list));
  }
  return section;
}

export function renderSuggestion(s: Suggestion, t: Texts, timeZone?: string): HTMLElement {
  const article = el("article", { class: "suggestion", "data-key": s.key });
  article.append(
    el("h3", {}, el("span", { class: "kind" }, t.kinds[s.kind]), " ", el("span", { class: "name" }, s.name)),
    el("p", { class: "reason" }, reasonOf(s, t, timeZone)),
    el(
      "p",
      { class: "beneficiaries" },
      t.beneficiaries(joinNames(s.beneficiaries.map((b) => t.beneficiaryWithSteps(b.name, t.steps(b.stepsRemaining))))),
    ),
  );
  for (const b of s.beneficiaries) {
    if (b.mustUnlockFirst === undefined) continue;
    const text = b.mustUnlockFirst ? t.mustUnlockFirst(b.name, b.mustUnlockFirst) : t.mustUnlockFirstUnknown(b.name);
    article.append(el("p", { class: "unlock" }, text));
  }
  article.append(el("p", { class: "players" }, t.requiredPlayers(s.requiredPlayers)));
  if (s.missingPlayers > 0) article.append(el("p", { class: "lfg" }, t.lfg(s.missingPlayers)));
  if (s.rewards.length > 0) {
    article.append(el("p", { class: "rewards" }, t.rewardsLabel(s.rewards.map((r) => rewardText(r, t)).join(", "))));
  }
  return article;
}

function reasonOf(s: Suggestion, t: Texts, timeZone?: string): string {
  const names = joinNames(s.beneficiaries.map((b) => b.name));
  const steps = t.steps(s.stepsRemaining);
  switch (s.kind) {
    case "worldBoss":
      return t.reason.worldBoss(names, s.nextStart ? formatLocalTime(s.nextStart, timeZone) : "");
    case "achievement":
    case "dungeon":
    case "raid":
    case "wizardsVault":
      return t.reason[s.kind](names, steps);
  }
}

function rewardText(reward: Reward, t: Texts): string {
  switch (reward.type) {
    case "title":
      return t.rewards.title(reward.name);
    case "achievementPoints":
      return t.rewards.achievementPoints(reward.amount);
    case "acclaim":
      return t.rewards.acclaim(reward.amount);
    case "mastery":
    case "item":
    case "loot":
      return t.rewards[reward.type];
  }
}
