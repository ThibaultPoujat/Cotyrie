// The page: players and their keys, the "suggest" action, and the results.
import { ApiUnavailableError, InvalidKeyError, MissingPermissionsError, type Gw2Client } from "../api/client";
import { loadCatalog, loadPlayer } from "../api/load";
import { suggest } from "../engine/suggest";
import type { Catalog, PlayerData } from "../engine/types";
import type { GameNames, Texts } from "../i18n/fr";
import {
  forgetAll,
  isApiKeyFormat,
  loadPlayers,
  loadSnapshot,
  savePlayers,
  saveSnapshot,
  type StoredPlayer,
} from "../storage/store";
import { el } from "./dom";
import { formatLocalDateTime } from "./format";
import { renderResults } from "./results";

const KEY_HELP_URL = "https://account.arena.net/applications";

export interface AppDeps {
  client: Gw2Client;
  storage: Storage;
  texts: Texts;
  names: GameNames;
  now?: () => Date;
  timeZone?: string;
  newId?: () => string;
}

export class App {
  private players: StoredPlayer[];
  private catalog: Catalog | undefined;
  // Bumped by each run and by "forget": a run whose number is no longer
  // current drops its results.
  private generation = 0;
  private readonly status: HTMLElement;
  private readonly results: HTMLElement;
  private readonly playerList: HTMLElement;

  constructor(root: HTMLElement, private readonly deps: AppDeps) {
    this.players = loadPlayers(deps.storage);
    const t = deps.texts;
    this.status = el("div", { class: "status", role: "status" });
    this.results = el("div", { class: "results-container" });
    this.playerList = el("ul", { class: "players" });

    const nameInput = el("input", { name: "name", autocomplete: "off", required: "" });
    const keyInput = el("input", { name: "key", type: "password", autocomplete: "off", required: "" });
    const form = el(
      "form",
      { class: "add-player" },
      el("label", {}, t.playerNameLabel, " ", nameInput),
      " ",
      el("label", {}, t.apiKeyLabel, " ", keyInput),
      " ",
      el("button", { type: "submit" }, t.addPlayerButton),
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (this.addPlayer(nameInput.value, keyInput.value)) form.reset();
    });

    const suggestButton = el("button", { type: "button", class: "suggest" }, t.suggestButton);
    suggestButton.addEventListener("click", () => void this.run());
    const forgetButton = el("button", { type: "button", class: "forget" }, t.forgetButton);
    forgetButton.addEventListener("click", () => this.forget());

    const link = el("a", { href: KEY_HELP_URL, target: "_blank", rel: "noopener noreferrer" }, KEY_HELP_URL.replace("https://", ""));
    root.replaceChildren(
      el("h1", {}, t.appTitle),
      el("p", { class: "tagline" }, t.tagline),
      el("h2", {}, t.playersHeading),
      this.playerList,
      el("h3", {}, t.addPlayerHeading),
      el("p", { class: "key-help" }, t.keyHelpBefore, link, t.keyHelpAfter),
      form,
      el("p", { class: "actions" }, suggestButton, " ", forgetButton),
      this.status,
      this.results,
    );
    this.renderPlayers();
  }

  addPlayer(rawName: string, rawKey: string): boolean {
    const t = this.deps.texts;
    const name = rawName.trim();
    const key = rawKey.trim();
    const problem = !name
      ? t.missingName
      : this.players.some((p) => p.name === name)
        ? t.duplicateName
        : !isApiKeyFormat(key)
          ? t.invalidKeyFormat
          : undefined;
    if (problem) {
      this.showStatus([problem]);
      return false;
    }
    const id = this.deps.newId?.() ?? crypto.randomUUID();
    this.players.push({ id, name, key, present: true });
    this.persistPlayers();
    this.showStatus([]);
    return true;
  }

  async run(): Promise<void> {
    const t = this.deps.texts;
    const present = this.players.filter((p) => p.present);
    if (present.length === 0) return this.showStatus([t.noPresentPlayers]);
    const generation = ++this.generation;
    this.showStatus([t.loading]);

    try {
      const catalog = this.catalog ?? (await loadCatalog(this.deps.client, this.deps.names));
      const loaded = await Promise.allSettled(
        present.map((p) => loadPlayer(this.deps.client, p.id, p.name, p.key)),
      );
      if (generation !== this.generation) return;
      this.catalog = catalog;

      const messages: string[] = [];
      const players: PlayerData[] = [];
      loaded.forEach((outcome, index) => {
        const player = present[index]!;
        if (outcome.status === "fulfilled") return void players.push(outcome.value);
        const error = outcome.reason;
        if (error instanceof InvalidKeyError) messages.push(t.errors.invalidKey(player.name));
        else if (error instanceof MissingPermissionsError) {
          messages.push(t.errors.missingPermissions(player.name, error.missing.map((p) => `« ${p} »`).join(", ")));
        } else throw error;
      });

      if (players.length === 0) {
        this.results.replaceChildren();
        return this.showStatus(messages);
      }
      if (messages.length > 0) messages.push(t.errors.skippedPlayers);

      const readAt = this.now();
      const result = suggest({ now: readAt, players, catalog });
      saveSnapshot(this.deps.storage, { readAt, result });
      this.showStatus(messages);
      this.results.replaceChildren(renderResults(result, readAt, t, this.deps.timeZone));
    } catch (error) {
      if (generation !== this.generation) return;
      if (error instanceof ApiUnavailableError) return this.showUnavailable();
      this.showStatus([t.errors.unexpected]);
    }
  }

  forget(): void {
    this.generation++;
    forgetAll(this.deps.storage);
    this.players = [];
    this.catalog = undefined;
    this.results.replaceChildren();
    this.renderPlayers();
    this.showStatus([this.deps.texts.forgotten]);
  }

  private showUnavailable(): void {
    const t = this.deps.texts;
    const snapshot = loadSnapshot(this.deps.storage);
    if (!snapshot) {
      this.results.replaceChildren();
      return this.showStatus([t.errors.apiUnavailable, t.errors.noLastKnownData]);
    }
    this.showStatus([
      t.errors.apiUnavailable,
      t.errors.lastKnownData(formatLocalDateTime(snapshot.readAt, this.deps.timeZone)),
    ]);
    this.results.replaceChildren(renderResults(snapshot.result, snapshot.readAt, t, this.deps.timeZone));
  }

  private renderPlayers(): void {
    const t = this.deps.texts;
    if (this.players.length === 0) {
      this.playerList.replaceChildren(el("li", { class: "empty" }, t.noPlayers));
      return;
    }
    this.playerList.replaceChildren(
      ...this.players.map((player) => {
        const checkbox = el("input", { type: "checkbox" });
        checkbox.checked = player.present;
        checkbox.addEventListener("change", () => {
          player.present = checkbox.checked;
          this.persistPlayers();
        });
        const remove = el("button", { type: "button", class: "remove" }, t.removePlayer);
        remove.addEventListener("click", () => {
          this.players = this.players.filter((p) => p !== player);
          this.persistPlayers();
        });
        return el("li", {}, el("strong", {}, player.name), " ", el("label", {}, checkbox, " ", t.present), " ", remove);
      }),
    );
  }

  private persistPlayers(): void {
    savePlayers(this.deps.storage, this.players);
    this.renderPlayers();
  }

  private showStatus(messages: string[]): void {
    this.status.replaceChildren(...messages.map((m) => el("p", {}, m)));
  }

  private now(): Date {
    return this.deps.now?.() ?? new Date();
  }
}
