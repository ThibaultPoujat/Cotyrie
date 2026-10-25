// All user-facing text lives here so other languages can be added later.
// Game names come from the API with lang=fr; the ones the API does not
// provide (dungeons, raid wings, world bosses) are listed below.

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// "Alice", "Alice et Bruno", "Alice, Bruno et Chloé".
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

export const fr = {
  appTitle: "Cotyrie",
  tagline: "Que pouvons-nous faire ensemble maintenant, et pourquoi ?",

  playersHeading: "Joueurs",
  noPlayers: "Aucun joueur pour l'instant : ajoutez la clé API de chaque joueur.",
  present: "Présent",
  removePlayer: "Retirer",
  addPlayerHeading: "Ajouter un joueur",
  playerNameLabel: "Pseudo",
  apiKeyLabel: "Clé API",
  addPlayerButton: "Ajouter",
  keyHelpBefore: "Chaque joueur crée une clé dédiée avec les permissions « account » et « progression » sur ",
  keyHelpAfter:
    ". Les clés restent dans ce navigateur, ne sont envoyées qu'à l'API officielle de Guild Wars 2, et chaque joueur peut révoquer la sienne à tout moment.",
  missingName: "Indiquez un pseudo.",
  duplicateName: "Ce pseudo est déjà utilisé.",
  invalidKeyFormat: "Cette clé n'a pas le format d'une clé API Guild Wars 2.",

  suggestButton: "Proposer des activités",
  loading: "Lecture des comptes en cours…",
  noPresentPlayers: "Cochez au moins un joueur présent.",
  forgetButton: "Oublier les clés",
  forgotten: "Les clés et toutes les données gardées par cette page dans ce navigateur ont été effacées.",

  lastRead: (date: string) => `Dernière lecture des données : ${date}.`,
  featuredHeading: "À faire maintenant",
  allHeading: (n: number) => `Toutes les activités possibles (${n}), triées par score`,
  fewerThanThree: (n: number) =>
    n === 0
      ? "Aucune activité possible avec les joueurs présents : tout est déjà fait, ou demande une extension qu'un joueur présent ne possède pas."
      : `Seulement ${plural(n, "activité possible", "activités possibles")} avec les joueurs présents : le reste est déjà fait, ou demande une extension qu'un joueur présent ne possède pas.`,

  kinds: {
    achievement: "Succès",
    dungeon: "Donjon du jour",
    raid: "Raid de la semaine",
    worldBoss: "Boss du monde",
    wizardsVault: "Chambre forte du sorcier",
  },
  steps: (n: number) => plural(n, "étape", "étapes"),
  reason: {
    achievement: (names: string, steps: string) => `Il reste au plus ${steps} à ${names} pour terminer ce succès.`,
    dungeon: (names: string, steps: string) => `Pas encore fait aujourd'hui par ${names}, il reste au plus ${steps}.`,
    raid: (names: string, steps: string) => `Pas encore terminé cette semaine par ${names}, il reste au plus ${steps}.`,
    worldBoss: (names: string, time: string) => `Prochaine apparition à ${time}, pas encore vaincu aujourd'hui par ${names}.`,
    wizardsVault: (names: string, steps: string) => `Dans la Chambre forte du sorcier de ${names}, il reste au plus ${steps}.`,
  },
  beneficiaries: (list: string) => `Qui en profite : ${list}.`,
  beneficiaryWithSteps: (name: string, steps: string) => `${name} (${steps})`,
  mustUnlockFirst: (name: string, text: string) => `${name} doit d'abord débloquer : ${text}`,
  mustUnlockFirstUnknown: (name: string) => `${name} doit d'abord débloquer ce succès (prérequis non rempli).`,
  requiredPlayers: (n: number) => `Joueurs requis : ${n}.`,
  lfg: (seats: number) => `À compléter avec le LFG du jeu (${plural(seats, "place", "places")}).`,
  rewardsLabel: (list: string) => `Récompense : ${list}.`,
  rewards: {
    title: (name: string) => `titre « ${name} »`,
    mastery: "point de maîtrise",
    item: "objet",
    achievementPoints: (n: number) => plural(n, "point de succès", "points de succès"),
    acclaim: (n: number) => plural(n, "acclamation astrale", "acclamations astrales"),
    loot: "butin",
  },

  errors: {
    invalidKey: (name: string) => `La clé de ${name} est invalide ou a été révoquée. Demandez-lui une nouvelle clé.`,
    missingPermissions: (name: string, permissions: string) =>
      `La clé de ${name} n'a pas toutes les permissions nécessaires. Ajoutez-lui : ${permissions}.`,
    skippedPlayers: "Les suggestions sont calculées sans les joueurs dont la clé pose problème.",
    apiUnavailable: "L'API de Guild Wars 2 ne répond pas pour le moment. Réessayez dans quelques minutes.",
    lastKnownData: (date: string) => `Voici les dernières suggestions connues, lues le ${date}.`,
    noLastKnownData: "Aucune donnée précédente n'est gardée dans ce navigateur.",
    unexpected: "Une erreur inattendue s'est produite.",
  },
};

export type Texts = typeof fr;

export interface GameNames {
  dungeons: Record<string, string>;
  raidWings: Record<string, string>;
  worldBosses: Record<string, string>;
}

export const frGameNames: GameNames = {
  dungeons: {
    ascalonian_catacombs: "Catacombes d'Ascalon",
    caudecus_manor: "Manoir de Caudecus",
    twilight_arbor: "Tonnelle du Crépuscule",
    sorrows_embrace: "Étreinte des Lamentations",
    citadel_of_flame: "Citadelle de la Flamme",
    honor_of_the_waves: "Honneur des vagues",
    crucible_of_eternity: "Creuset de l'éternité",
    ruined_city_of_arah: "La cité en ruine d'Arah",
  },
  raidWings: {
    spirit_vale: "Vallée des esprits",
    salvation_pass: "Passage du Salut",
    stronghold_of_the_faithful: "Bastion des Fidèles",
    bastion_of_the_penitent: "Bastion du Pénitent",
    hall_of_chains: "Salle des chaînes",
    mythwright_gambit: "Le Pari du Mythographe",
    the_key_of_ahdashim: "La Clé d'Ahdashim",
    mount_balrior: "Mont Balrior",
  },
  worldBosses: {
    admiral_taidha_covington: "Amirale Taidha Covington",
    svanir_shaman_chief: "Chef chamane de Svanir",
    megadestroyer: "Mégadestructeur",
    fire_elemental: "Élémentaire de feu",
    the_shatterer: "Le Destructeur",
    great_jungle_wurm: "Grande guivre de la jungle",
    modniir_ulgoth: "Ulgoth le Modniir",
    shadow_behemoth: "Béhémoth des ombres",
    inquest_golem_mark_ii: "Golem Marque II de l'Inquisition",
    claw_of_jormag: "Griffe de Jormag",
    tequatl_the_sunless: "Tequatl le Sans-soleil",
    triple_trouble_wurm: "Triple Terreur",
    karka_queen: "Reine karka",
  },
};
