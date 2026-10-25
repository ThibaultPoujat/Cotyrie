import { beforeEach, describe, expect, it } from "vitest";
import { API_ORIGIN, Gw2Client } from "../api/client";
import { fr, frGameNames, type Texts } from "../i18n/fr";
import { CONTENT_SECURITY_POLICY } from "../security/csp";
import { STORAGE_PREFIX } from "../storage/store";
import { createFakeApi, fakeKey, type FakeApiOptions } from "../test/fakeApi";
import { App } from "./app";

const NOW = new Date("2026-10-25T10:00:00Z");
const ALICE_KEY = fakeKey(1);
const BRUNO_KEY = fakeKey(2);
const CHLOE_KEY = fakeKey(3);

function setup(api: FakeApiOptions, texts: Texts = fr) {
  const fake = createFakeApi(api);
  const root = document.createElement("main");
  let now = NOW;
  const app = new App(root, {
    client: new Gw2Client(fake.fetch),
    storage: window.localStorage,
    texts,
    names: frGameNames,
    now: () => now,
    timeZone: "Europe/Paris",
  });
  return { app, root, calls: fake.calls, setNow: (date: Date) => (now = date) };
}

const text = (root: HTMLElement, selector: string) =>
  [...root.querySelectorAll(selector)].map((node) => node.textContent ?? "");

const suggestionKeys = (root: HTMLElement, selector: string) =>
  [...root.querySelectorAll(`${selector} .suggestion`)].map((node) => node.getAttribute("data-key"));

beforeEach(() => window.localStorage.clear());

describe("S9", () => {
  it("S9: every suggestion shows its reason, its beneficiaries and the number of players required", async () => {
    const { app, root } = setup({ accounts: { [ALICE_KEY]: {}, [BRUNO_KEY]: {} } });
    app.addPlayer("Alice", ALICE_KEY);
    app.addPlayer("Bruno", BRUNO_KEY);
    await app.run();

    const cards = [...root.querySelectorAll(".all .suggestion")];
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.querySelector(".reason")?.textContent).toBeTruthy();
      expect(card.querySelector(".beneficiaries")?.textContent).toMatch(/^Qui en profite : .*Alice/);
      expect(card.querySelector(".players")?.textContent).toMatch(/^Joueurs requis : \d+\.$/);
    }

    const collector = root.querySelector('.all [data-key="achievement:101"]')!;
    expect(collector.querySelector(".reason")?.textContent).toBe(
      "Il reste au plus 3 étapes à Alice et Bruno pour terminer ce succès.",
    );
    expect(collector.querySelector(".beneficiaries")?.textContent).toBe(
      "Qui en profite : Alice (3 étapes) et Bruno (3 étapes).",
    );
    expect(collector.querySelector(".rewards")?.textContent).toBe(
      "Récompense : titre « Collectionneur de fiction », 5 points de succès.",
    );
  });

  it("S6: the raid card tells to complete the group with the in-game LFG", async () => {
    const access = ["GuildWars2", "HeartOfThorns"];
    const { app, root } = setup({
      accounts: { [ALICE_KEY]: { access }, [BRUNO_KEY]: { access }, [CHLOE_KEY]: { access } },
    });
    app.addPlayer("Alice", ALICE_KEY);
    app.addPlayer("Bruno", BRUNO_KEY);
    app.addPlayer("Chloé", CHLOE_KEY);
    await app.run();

    const raid = root.querySelector('.all [data-key="raid:spirit_vale"]')!;
    expect(raid.querySelector(".players")?.textContent).toBe("Joueurs requis : 10.");
    expect(raid.querySelector(".lfg")?.textContent).toBe("À compléter avec le LFG du jeu (7 places).");
  });

  it("S2: the card says what a player must unlock first, with the API's text", async () => {
    const { app, root } = setup({
      accounts: {
        [ALICE_KEY]: { achievements: [{ id: 101, current: 3, max: 3, done: true }, { id: 104, current: 0, max: 2, done: false, unlocked: true }] },
        [BRUNO_KEY]: {},
      },
    });
    app.addPlayer("Alice", ALICE_KEY);
    app.addPlayer("Bruno", BRUNO_KEY);
    await app.run();

    const heir = root.querySelector('.all [data-key="achievement:104"]')!;
    expect(text(heir as HTMLElement, ".unlock")).toEqual([
      "Bruno doit d'abord débloquer : Terminez le succès « Collectionneur fictif ».",
    ]);
  });
});

describe("S1", () => {
  it("S1: an expansion's achievements, found from the API's achievement groups, are not suggested when a present player lacks it", async () => {
    const { app, root } = setup({
      accounts: { [ALICE_KEY]: { access: ["GuildWars2", "PathOfFire"] }, [BRUNO_KEY]: { access: ["GuildWars2"] } },
    });
    app.addPlayer("Alice", ALICE_KEY);
    app.addPlayer("Bruno", BRUNO_KEY);
    await app.run();
    expect(suggestionKeys(root, ".all")).not.toContain("achievement:103");

    // Bruno leaves: untick him.
    const brunoBox = root.querySelectorAll<HTMLInputElement>("ul.players input[type=checkbox]")[1]!;
    brunoBox.checked = false;
    brunoBox.dispatchEvent(new Event("change"));
    await app.run();
    expect(suggestionKeys(root, ".all")).toContain("achievement:103");
  });
});

describe("S10", () => {
  it("S10: every name and text shown is in French: texts come from the French file and game names from the API in French", async () => {
    // Pseudo-locale: every text of the French file gets a marker. Any shown
    // text without the marker would be hard-coded instead of translatable.
    const MARK = "‹fr›";
    const mark = (value: unknown): unknown => {
      if (typeof value === "string") return MARK + value;
      if (typeof value === "function") return (...args: unknown[]) => MARK + (value as (...a: unknown[]) => string)(...args);
      return Object.fromEntries(Object.entries(value as object).map(([k, v]) => [k, mark(v)]));
    };
    const marked = mark(fr) as Texts;
    const { app, root, calls } = setup({ accounts: { [ALICE_KEY]: {} } }, marked);
    app.addPlayer("Alice", ALICE_KEY);
    await app.run();

    const gameNames = [
      ...["Collectionneur fictif", "Chasseur fictif", "Héritier fictif"],
      ...Object.values(frGameNames).flatMap((group) => Object.values(group)),
    ];
    const allowedData = new Set(["Alice", "account.arena.net/applications", ...gameNames]);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const value = node.textContent?.trim() ?? "";
      if (!value) continue;
      expect(value.startsWith(MARK) || allowedData.has(value), `untranslated text: "${value}"`).toBe(true);
    }

    // Every request asks the API for French.
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) expect(new URL(call).searchParams.get("lang")).toBe("fr");
  });
});

describe("S11", () => {
  it("S11: the page shows when the data was last read", async () => {
    const { app, root, setNow } = setup({ accounts: { [ALICE_KEY]: {} } });
    app.addPlayer("Alice", ALICE_KEY);
    await app.run();
    expect(text(root, ".last-read")).toEqual(["Dernière lecture des données : 25 octobre 2026 à 11:00."]);

    setNow(new Date("2026-10-25T11:30:00Z"));
    await app.run();
    expect(text(root, ".last-read")).toEqual(["Dernière lecture des données : 25 octobre 2026 à 12:30."]);
  });
});

describe("S12", () => {
  it("S12: beyond the 3 featured suggestions, the full list of possible activities is available, sorted by decreasing score", async () => {
    const { app, root } = setup({
      accounts: {
        [ALICE_KEY]: { achievements: [{ id: 102, current: 9, max: 10, done: false }], worldbosses: ["the_shatterer"] },
        [BRUNO_KEY]: { achievements: [{ id: 102, current: 9, max: 10, done: false }] },
      },
    });
    app.addPlayer("Alice", ALICE_KEY);
    app.addPlayer("Bruno", BRUNO_KEY);
    await app.run();

    expect(suggestionKeys(root, ".featured")).toEqual(["achievement:102", "achievement:104", "dungeon:ascalonian_catacombs"]);
    expect(root.querySelector(".all-activities summary")?.textContent).toBe(
      "Toutes les activités possibles (5), triées par score",
    );
    // Both players before one; then fewest steps; then the better reward.
    expect(suggestionKeys(root, ".all")).toEqual([
      "achievement:102",
      "achievement:104",
      "dungeon:ascalonian_catacombs",
      "achievement:101",
      "worldBoss:the_shatterer",
    ]);
  });
});

describe("E1", () => {
  it("E1: an invalid or revoked key is reported, naming the player", async () => {
    const { app, root } = setup({ accounts: { [ALICE_KEY]: {} } });
    app.addPlayer("Alice", ALICE_KEY);
    app.addPlayer("Bruno", BRUNO_KEY);
    await app.run();

    expect(text(root, ".status p")).toEqual([
      "La clé de Bruno est invalide ou a été révoquée. Demandez-lui une nouvelle clé.",
      "Les suggestions sont calculées sans les joueurs dont la clé pose problème.",
    ]);
    expect(text(root, ".all .beneficiaries").every((line) => !line.includes("Bruno"))).toBe(true);
    expect(suggestionKeys(root, ".all").length).toBeGreaterThan(0);
  });
});

describe("E2", () => {
  it("E2: missing permissions are reported, saying which ones to add to the key", async () => {
    const { app, root } = setup({ accounts: { [ALICE_KEY]: { permissions: ["account"] } } });
    app.addPlayer("Alice", ALICE_KEY);
    await app.run();

    expect(text(root, ".status p")).toEqual([
      "La clé de Alice n'a pas toutes les permissions nécessaires. Ajoutez-lui : « progression ».",
    ]);
  });
});

describe("E3", () => {
  it("E3: with fewer than 3 possible suggestions, the page shows those that exist and explains why", async () => {
    const done = (id: number, max: number) => ({ id, current: max, max, done: true });
    const { app, root } = setup({
      accounts: {
        [ALICE_KEY]: {
          achievements: [done(101, 3), done(104, 2), { id: 102, current: 4, max: 10, done: false }],
          dungeons: ["ac_story", "hodgins"],
          worldbosses: ["the_shatterer"],
        },
      },
    });
    app.addPlayer("Alice", ALICE_KEY);
    await app.run();

    expect(suggestionKeys(root, ".featured")).toEqual(["achievement:102"]);
    expect(text(root, ".fewer")).toEqual([
      "Seulement 1 activité possible avec les joueurs présents : le reste est déjà fait, ou demande une extension qu'un joueur présent ne possède pas.",
    ]);
  });
});

describe("E4", () => {
  it("E4: when the API is unavailable, a clear message and the last known data with their date", async () => {
    const api: FakeApiOptions = { accounts: { [ALICE_KEY]: {} } };
    const { app, root, setNow } = setup(api);
    app.addPlayer("Alice", ALICE_KEY);
    await app.run();
    const before = suggestionKeys(root, ".all");

    api.down = true;
    setNow(new Date("2026-10-26T09:00:00Z"));
    await app.run();

    expect(text(root, ".status p")).toEqual([
      "L'API de Guild Wars 2 ne répond pas pour le moment. Réessayez dans quelques minutes.",
      "Voici les dernières suggestions connues, lues le 25 octobre 2026 à 11:00.",
    ]);
    expect(suggestionKeys(root, ".all")).toEqual(before);
  });

  it("E4: when the API is unavailable and nothing was read before, it says so", async () => {
    const { app, root } = setup({ accounts: { [ALICE_KEY]: {} }, down: true });
    app.addPlayer("Alice", ALICE_KEY);
    await app.run();

    expect(text(root, ".status p")).toEqual([
      "L'API de Guild Wars 2 ne répond pas pour le moment. Réessayez dans quelques minutes.",
      "Aucune donnée précédente n'est gardée dans ce navigateur.",
    ]);
  });
});

describe("E5", () => {
  it("E5: keys are only ever sent to the official Guild Wars 2 API", async () => {
    const { app, root, calls } = setup({ accounts: { [ALICE_KEY]: {} } });
    app.addPlayer("Alice", ALICE_KEY);
    app.addPlayer("Bruno", BRUNO_KEY);
    await app.run();

    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      const url = new URL(call);
      expect(url.origin).toBe("https://api.guildwars2.com");
      expect(url.pathname.startsWith("/v2/")).toBe(true);
    }
    // The key is never shown on the page.
    expect(root.textContent).not.toContain(ALICE_KEY);
  });

  it("E5: the published page forbids the browser to connect anywhere but the official API", () => {
    const connect = CONTENT_SECURITY_POLICY.split("; ").find((d) => d.startsWith("connect-src"));
    expect(connect).toBe("connect-src https://api.guildwars2.com");
    expect(API_ORIGIN).toBe("https://api.guildwars2.com");
  });

  it("E5: the API client refuses a path that would leave the official API", async () => {
    const { fetch, calls } = createFakeApi({ accounts: {} });
    const client = new Gw2Client(fetch);
    await expect(client.get("../evil", { token: ALICE_KEY })).rejects.toThrow();
    await expect(client.get("//evil.example/steal", { token: ALICE_KEY })).rejects.toThrow();
    expect(calls.every((call) => call.startsWith("https://api.guildwars2.com/v2/"))).toBe(true);
  });
});

describe("E6", () => {
  it("E6: a \u00ab forget the keys \u00bb button erases everything the page kept in the browser", async () => {
    window.localStorage.setItem("another-page", "kept");
    const { app, root } = setup({ accounts: { [ALICE_KEY]: {} } });
    app.addPlayer("Alice", ALICE_KEY);
    await app.run();
    expect(Object.keys(window.localStorage).some((k) => k.startsWith(STORAGE_PREFIX))).toBe(true);

    root.querySelector<HTMLButtonElement>("button.forget")!.click();

    expect(Object.keys(window.localStorage).filter((k) => k.startsWith(STORAGE_PREFIX))).toEqual([]);
    expect(window.localStorage.getItem("another-page")).toBe("kept");
    expect(root.querySelectorAll(".suggestion")).toHaveLength(0);
    expect(text(root, "ul.players li")).toEqual([fr.noPlayers]);
    expect(root.textContent).toContain("Oublier les clés");
  });

  it("E6: a reading still in progress when the keys are forgotten keeps nothing", async () => {
    const { app, root } = setup({ accounts: { [ALICE_KEY]: {} } });
    app.addPlayer("Alice", ALICE_KEY);
    const pending = app.run();
    app.forget();
    await pending;

    expect(Object.keys(window.localStorage).filter((k) => k.startsWith(STORAGE_PREFIX))).toEqual([]);
    expect(root.querySelectorAll(".suggestion")).toHaveLength(0);
  });
});
