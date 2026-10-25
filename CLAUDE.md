# Cotyrie : consignes pour les agents

Cotyrie (nom provisoire) est un outil web indépendant pour Guild Wars 2. Il lit la progression réelle de chaque joueur via l'API officielle, la croise entre les joueurs présents et propose quoi faire ensemble maintenant, avec la raison de chaque suggestion.

Le porteur du projet, Thibault, valide les specs et les résultats. **Il ne relit jamais le code.** Tout le code est écrit par l'IA, donc ces règles sont strictes.

## À lire avant tout travail

1. [docs/vision.md](docs/vision.md) : la vision, les principes et ce qui est hors périmètre.
2. [docs/specs/](docs/specs/) : les specs validées. Elles font foi.
3. [docs/decisions.md](docs/decisions.md) : les décisions déjà prises, à ne pas rediscuter sans raison nouvelle.

## Règles de travail

- **Pas de code sans spec validée.** Si une demande n'est pas couverte par une spec validée, rédige ou complète la spec en français et demande sa validation avant de coder.
- **Une spec validée ne change pas sans nouvelle validation**, même pour une formulation.
- **Chaque scénario d'acceptation devient un test automatique**, nommé de façon à retrouver le scénario. Un scénario sans test, ou un test sans scénario, est une anomalie.
- **Aucun test n'est désactivé, sauté ou affaibli** pour faire passer la CI.
- **À chaque changement**, lance les revues de code et de sécurité (skills `code-review` et `security-review`) et corrige ce qu'elles trouvent.
- **Chaque PR est résumée en français clair** : ce qui change pour l'utilisateur, la spec et les scénarios qu'elle réalise, le résultat des tests et des revues.
- **Toute idée nouvelle rejoint les pistes** de [docs/vision.md](docs/vision.md), jamais la version en cours.
- Les décisions importantes prises en cours de route sont ajoutées à [docs/decisions.md](docs/decisions.md).

## Règles techniques permanentes

- **Moteur séparé** : le moteur de suggestions reçoit des données de compte et rend des suggestions. Il ignore d'où viennent les données (navigateur aujourd'hui, serveur demain).
- **Rien de personnel dans le code** : aucune clé, aucun nom de compte, aucune donnée de joueur dans le dépôt, ni dans les tests (utiliser des données fictives).
- **Le minimum de données** : on ne lit et ne garde que ce qui sert aux suggestions (esprit du RGPD).
- **Les clés API ne sont envoyées qu'à l'API officielle** (`https://api.guildwars2.com`), jamais ailleurs, et ne sont jamais journalisées.
- **Tout texte affiché est en français**, regroupé dans des fichiers de traduction pour ajouter d'autres langues plus tard. Les noms du jeu viennent de l'API avec `lang=fr`.
- **Langues** :
  - **En anglais** : le code, les noms de fichiers et de dossiers, les noms de variables, les commentaires, les messages de commit, les noms de branches et les titres de PR.
  - **En français** : l'interface (UI), les specs et leurs scénarios, les échanges avec Thibault, y compris le résumé de chaque PR.

## Commandes

- `npm ci` : installer les dépendances.
- `npm run dev` : lancer la page en local.
- `npm run typecheck`, `npm test`, `npm run build` : les vérifications que la CI lance sur chaque PR. Elles doivent toutes passer avant de pousser.
- La page est publiée sur GitHub Pages à chaque fusion sur `main`.

## Repères sur l'API GW2

- Base : `https://api.guildwars2.com/v2`, clé passée en `access_token` (compatible CORS depuis le navigateur).
- Permissions utilisées en V0 : `account` et `progression`.
- Limites : 300 requêtes d'un coup, puis 5 par seconde par adresse IP ; jusqu'à 200 identifiants par requête.
- `account/achievements` ne renvoie que les succès entamés ; le catalogue complet vient de `achievements` (public).
- Horaires des boss et des métas absents de l'API : ils viennent du wiki officiel, en UTC.
- Documentation : https://wiki.guildwars2.com/wiki/API:Main
