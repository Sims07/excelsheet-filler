# PWA Time Filler

Bookmarklet pour remplir automatiquement la grille de saisie des temps ("Mes tâches") de **Project Web App / Project Server (PWA)**, à partir d'un template de semaine type que tu définis une fois et réutilises chaque semaine.

Plus besoin de cliquer et taper manuellement dans chaque case de la grille : tu définis ton pattern habituel (ex: 1j sur telle tâche du lundi au vendredi, 0,5j sur une autre le mercredi...), et l'outil le rejoue automatiquement dans PWA.

## Pourquoi

PWA ne permet pas d'ajouter un bouton ou un raccourci natif dans son interface de saisie des temps. Ce bookmarklet contourne cette limite en pilotant directement la grille JS de PWA (JSGrid), en simulant les mêmes clics et frappes clavier qu'une saisie manuelle — la sauvegarde des données passe donc par le mécanisme natif de PWA, sans appel réseau reconstruit à la main.

## Installation

1. Ouvre `install.html` dans ton navigateur (ou héberge-le, ex: via GitHub Pages)
2. Glisse le bouton **"PWA Time Filler"** dans ta barre de favoris

Sinon, en usage ponctuel sans installation :

1. Ouvre ta page **Tâches** dans PWA
2. Ouvre la console développeur (`F12` → onglet Console)
3. Colle le contenu de [`excelsheet-time-filler.js`](./excelsheet-time-filler.js) et valide

## Utilisation

1. Sur la page Tâches de PWA, lance le bookmarklet
2. Un panneau flottant apparaît en haut à droite de l'écran
3. Pour chaque ligne :
   - **Nom de tâche** : un texte (partiel) qui identifie la tâche dans la grille (ex: `Développement Frontend`)
   - **Lun → Dim** : la valeur à saisir ce jour-là (ex: `1j`, `0,5j`), laisser vide pour ne rien saisir
4. **"+ Ajouter une ligne"** pour compléter ton pattern de semaine
5. **"💾 Enregistrer le template"** sauvegarde ta saisie en local (`localStorage`) — elle sera proposée automatiquement à la prochaine ouverture du panneau
6. **"▶ Appliquer sur la semaine"** enregistre puis rejoue automatiquement chaque cellule renseignée dans la grille PWA, avec un journal d'exécution en bas du panneau

> ⚠️ Les tâches concernées doivent être visibles dans la grille (pas de groupe replié, pas besoin de scroll) au moment de l'exécution.

## Limitations connues

- Le nom de tâche est recherché par correspondance partielle (`includes`) sur le premier lien trouvé dans la grille : si deux tâches partagent le même intitulé partiel, la première dans l'ordre d'affichage est utilisée.
- L'automatisation est séquentielle avec des délais de sécurité entre chaque action, pour rester synchronisée avec le rendu de la grille PWA — un remplissage complet de semaine prend donc quelques secondes.
- Testé sur une instance PWA/Project Server 2016 (JSGrid). Le comportement peut varier selon la version.

## Changelog

### v0.1.0
- Premier jet fonctionnel : éditeur de template en panneau flottant, sauvegarde `localStorage`, remplissage automatique séquentiel de la grille (clic double + saisie clavier simulée + validation Tab)

## Licence

MIT
