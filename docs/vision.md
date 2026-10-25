# Vision

**Ne plus jamais se demander quoi faire dans GW2.**

Un outil indépendant qui part de la progression réelle de chaque joueur de Guild Wars 2 pour l'aider à savoir quoi faire : seul, en groupe, ou avec des joueurs qui visent la même chose.

- **Problème** : on ne sait pas toujours quoi faire, surtout dans un groupe improvisé aux niveaux très différents, et trouver des partenaires pour un objectif précis est difficile.
- **Public** : tous les joueurs de Guild Wars 2, seuls, entre amis ou en guilde, du grand débutant au vétéran, en passant par ceux qui reviennent après une pause.
- **Valeur** : chacun repart avec quelque chose (un succès, une récompense, de l'expérience), et le débutant n'est jamais laissé de côté.
- **Ambition** : d'abord pour Thibault et ses amis, puis un outil assez solide pour la communauté francophone. L'international viendra plus tard, donc le site est pensé traduisible dès le départ.
- **Modèle** : projet personnel, financé d'abord par des dons. Si des options payantes existent un jour, elles seront purement cosmétiques (thèmes du site, titres honorifiques, badges). Toutes les fonctionnalités restent gratuites.
- **Périmètre** : Guild Wars 2 uniquement.
- **Réussite** : d'abord, l'outil est utile à Thibault, et ça suffit. S'il devient utile à la communauté, c'est un bonus.

## Ce que le projet évoque

Rassembler, décider, avancer ensemble. L'outil voit où en est chacun et trouve le point où les chemins se croisent, à n'importe quel moment.

## Ce que c'est, ce que ce n'est pas

- **C'est** un outil qui croise la progression réelle des joueurs entre eux, au service du groupe autant que du joueur. Aucun outil existant ne le fait, d'après nos recherches.
- **Ce n'est pas** un simple suivi de compte (gw2efficiency le fait), ni un planificateur d'événements (Aleeva, GW2Bot), ni un outil de recherche de joueurs (le LFG du jeu).

## Principes

- **Indépendance** : le projet ne dépend ni d'un bot existant, ni d'un serveur Discord, ni d'une guilde.
- **Zéro effort pour le joueur** : l'outil fait tout le travail (lire le compte, connaître le jeu, proposer). Le joueur donne sa clé une fois, puis se contente de lire et de choisir.
- **Transparence** : chaque suggestion explique pourquoi elle a été choisie.
- **Conforme au RGPD dès le départ** : minimum de données, suppression complète sur demande, politique de confidentialité, hébergement adapté. Vérifié à chaque nouvelle fonctionnalité.
- **La connaissance reste en français** : chaque règle existe d'abord sous forme de spec et de scénarios d'acceptation en langage naturel, validés par Thibault. Les tests en découlent.
- **Code écrit par IA** : les specs passent avant le code, chaque fonctionnalité est prouvée par des tests, chaque changement est résumé en français. Thibault valide les specs et les résultats, jamais le code.
- **Code public** : pour que chacun puisse vérifier que les clés ne sont pas détournées.
- **Un cœur séparé de l'interface** : le moteur de suggestions est indépendant, branché d'abord sur une page web, plus tard sur autre chose (bot Discord par exemple).
- **Gratuit au début** : hébergement gratuit pendant les tests, quelques euros par mois une fois l'outil adopté.

## Sécurité des clés

- **V0** : page sans serveur. Les clés dédiées (`account` + `progression`) restent dans le navigateur de celui qui ouvre la page.
- **Site public, plus tard** : le serveur garde un sous-jeton limité à la progression, chiffré, renouvelé en silence depuis le navigateur du joueur (endpoint `createsubtoken`, durée maximale d'un an). La clé complète n'est jamais stockée sur le serveur.
- Sans budget d'audit : revues de code et de sécurité à chaque changement, analyses gratuites de GitHub, et relecture humaine bénévole avant toute ouverture au public.

## Plan par étapes

1. **Valider les specs de la V0** : fait le 2026-10-22.
2. **Construire la V0** avec les amis de Thibault, sans serveur ([specs](specs/v0.md)). Fini quand Thibault s'en sert réellement pour choisir quoi faire.
3. **Construire la V1 web** : inscription, sous-jeton renouvelé automatiquement, catalogue tiré du wiki, filtre sur extensions, maîtrises et montures, apprentissage des goûts. Fini quand les suggestions donnent vraiment envie de jouer.
4. **Faire tester** par quelques joueurs de profils différents, avec revue de sécurité avant toute ouverture au public.
5. **Élargir** : groupes, mise en relation, bot Discord, hébergement payant.

## Pistes pour plus tard

Toute nouvelle idée rejoint cette liste, jamais la version en cours.

- Objectifs suivis automatiquement, bilan du joueur qui revient, journal de la semaine.
- Groupes permanents, objectif partagé, mentorat (un vétéran qui vient aider sans rien vouloir gagner).
- Annonces par activité, mise en relation par objectifs.
- Succès qui demandent des objets (permission inventaires en option).
- Gamification du site sans doublonner les succès du jeu.

## Risques connus

- **Tri des succès** : il y en a des milliers, il faudra marquer ceux qui se jouent bien à plusieurs.
- **Limites de l'API** : 5 requêtes par seconde, donc catalogue en cache et rafraîchissements étalés.
- **Dépendance à ArenaNet** : si l'API tombe, message clair et dernières données connues.
- **Éparpillement** : le périmètre de chaque version fait foi.
- **Le débutant** : peu de données sur son compte, et créer une clé API est une marche pour lui.
