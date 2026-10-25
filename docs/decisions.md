# Décisions

Les décisions déjà prises. On ne les rediscute pas sans raison nouvelle ; une décision qui change est barrée et remplacée, avec sa date.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-21 | Projet indépendant, sans Aleeva, bot ni serveur Discord. | Ne dépendre de personne, pouvoir s'intégrer ailleurs plus tard. |
| 2026-10-21 | Guild Wars 2 uniquement. | Rester concentré. |
| 2026-10-21 | Financement par dons ; options payantes éventuelles uniquement cosmétiques. | Toutes les fonctionnalités restent gratuites. |
| 2026-10-21 | Specs et scénarios en français validés par Thibault avant tout code ; tests tirés des scénarios ; Thibault ne relit jamais le code. | Garder la connaissance en langage naturel et un contrôle sans relire le code. |
| 2026-10-21 | Revues de code et de sécurité par les skills Claude Code et les analyses gratuites de GitHub ; relecture humaine bénévole avant l'ouverture au public. | Pas de budget pour un audit payant. |
| 2026-10-21 | Code public. | Prouver que les clés ne sont pas détournées. |
| 2026-10-21 | Site public : sous-jeton limité, chiffré sur le serveur, renouvelé depuis le navigateur ; la clé complète n'est jamais sur le serveur. | Seule option compatible avec le zéro effort et la sécurité. |
| 2026-10-21 | Conforme au RGPD dès le départ, minimum de données. | Obligation légale. |
| 2026-10-22 | V0 sans serveur : Thibault détient dans son navigateur les clés dédiées de ses amis et en est responsable. | Démarrer vite, sans hébergement ni données sur un serveur. |
| 2026-10-22 | Score : qui en profite, puis effort restant en étapes (jamais en pourcentage), puis récompense ; 3 suggestions mises en avant et liste complète triée par score. | Transparence et utilité pour le groupe. |
| 2026-10-22 | Specs de la V0 validées. | Voir [specs/v0.md](specs/v0.md). |
| 2026-10-25 | Nom provisoire : Cotyrie (coterie + Tyrie). | Un dépôt se renomme à tout moment ; le nom ne bloque pas la suite. |
| 2026-10-25 | L'outil sert à n'importe quel moment, pas seulement le soir : « ce soir » devient « maintenant » dans la vision et les specs. | Demande de Thibault. |
| 2026-10-25 | Code, noms de fichiers, commentaires, commits et titres de PR en anglais ; interface, specs et échanges avec Thibault en français. | Demande de Thibault. |
| 2026-10-25 | Technique : TypeScript, Vite et Vitest ; tests lancés par GitHub Actions sur chaque PR ; page publiée sur GitHub Pages. | Langage web le plus répandu, gratuit, sans serveur. Validé par Thibault. |
| 2026-10-25 | Toute la V0 (S1 à S12, E1 à E6) dans une seule PR. | Demande de Thibault. |
| 2026-10-25 | Interprétations de la spec V0 pour le code : l'effort d'une activité est le plus grand nombre d'étapes restant à un bénéficiaire ; le score compare d'abord le nombre de bénéficiaires, puis l'effort, puis la récompense ; joueurs requis : 10 pour un raid, 5 pour un donjon, 1 pour un succès, un boss du monde (joueurs de la carte) ou un objectif de la Chambre forte. | La spec laisse ces points ouverts ; à régler à l'usage. |
| 2026-10-25 | Chaque joueur est désigné par un pseudo saisi avec sa clé ; le nom de compte n'est jamais lu ni gardé. | Le minimum de données. |
| 2026-10-25 | Les dernières suggestions sont gardées dans le navigateur avec leur date, pour les montrer si l'API ne répond pas (E4) ; « Oublier les clés » les efface aussi. | Cas d'erreur E4 et E6. |
| 2026-10-25 | La page publiée interdit au navigateur toute connexion autre que l'API officielle (politique de sécurité du contenu). | Renforce E5. |

## Questions encore ouvertes

- Nom définitif du projet.
- Licence du code (le code sera public).
- Licence du wiki officiel : ce qu'on peut recopier et comment le citer.
- Ce qu'ArenaNet autorise pour un site financé par dons et options cosmétiques.
