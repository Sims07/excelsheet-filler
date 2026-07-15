# ExcelSheet Time Filler

Bookmarklet pour remplir automatiquement une grille de saisie des temps de type feuille Excel, à partir de templates de semaine nommés que tu définis une fois et réutilises ensuite.

Plus besoin de cliquer et taper manuellement dans chaque case de la grille : tu définis un ou plusieurs patterns habituels (ex: 1j sur telle tâche du lundi au vendredi, 0,5j sur une autre le mercredi...), tu les nommes, et l'outil rejoue automatiquement celui de ton choix dans la grille.

## Pourquoi

Ce type d'outil de saisie des temps ne permet généralement pas d'ajouter un bouton ou un raccourci natif dans son interface. Ce bookmarklet contourne cette limite en pilotant directement la grille JS de l'application, en simulant les mêmes clics et frappes clavier qu'une saisie manuelle — la sauvegarde des données passe donc par le mécanisme natif de l'outil, sans appel réseau reconstruit à la main.

## Installation

1. Ouvre [`install.html`](./install.html) dans ton navigateur (ou héberge-le, ex: via GitHub Pages)
2. Glisse le bouton **"ExcelSheet Time Filler"** dans ta barre de favoris

Sinon, en usage ponctuel sans installation :

1. Ouvre ta page de saisie des temps
2. Ouvre la console développeur (`F12` → onglet Console)
3. Colle le contenu de [`excelsheet-time-filler.js`](./excelsheet-time-filler.js) et valide

## Utilisation

1. Sur la page de saisie des temps, lance le bookmarklet
2. Un panneau flottant apparaît à l'écran
3. Choisis un template existant dans la liste déroulante, ou crée-en un nouveau en cliquant sur **"➕ Nouveau"**
4. Pour chaque ligne du template :
   - **Nom de tâche** : un texte (partiel) qui identifie la tâche dans la grille (ex: `Développement Frontend`) — un champ d'autocomplétion propose les tâches réellement visibles dans la grille
   - **Lun → Ven** : la valeur à saisir ce jour-là (ex: `1j`, `0,5j`), laisser vide pour ne rien saisir
5. **"➕ Ajouter une ligne"** pour compléter le template
6. **Sauvegarde automatique** : Plus besoin de cliquer sur un bouton pour enregistrer ! La sauvegarde dans le `localStorage` est entièrement automatique et instantanée dès que tu modifies un champ. La barre d'état en bas te confirme l'enregistrement en temps réel.
7. **"▶ Appliquer sur la semaine"** rejoue automatiquement chaque cellule renseignée dans la grille, avec un journal d'exécution en bas du panneau
8. **"🗑 Supprimer"** retire le template actuellement sélectionné
9. **"🔄 Tâches"** relit les noms de tâches visibles dans la grille pour mettre à jour l'autocomplétion

### Ergonomie du panneau

* **Drag & Drop fluide** : Glisse le panneau n'importe où en maintenant le clic sur son en-tête bleu. Le positionnement est calculé de manière absolue par rapport à son parent géométrique, évitant tout conflit visuel ou effet de saut avec le CSS de Project Web App (PWA).
* **Redimensionnement à la souris** : Tu peux ajuster librement la largeur et la hauteur du panneau à l'aide de la poignée striée située dans le coin inférieur droit.
* **Réduction / Restauration** : Clique sur le bouton de réduction (`—`) situé à gauche de la croix pour masquer temporairement le corps du panneau et libérer ton espace de travail. Clique sur (`＋`) pour le restaurer à sa taille exacte préalablement personnalisée.

> Les colonnes Samedi et Dimanche ne sont pas proposées (jours non travaillés).

## Limitations connues

- Le nom de tâche est recherché par correspondance partielle (`includes`) sur le premier lien trouvé dans la grille : si deux tâches partagent le même intitulé partiel, la première dans l'ordre d'affichage est utilisée.
- L'autocomplétion ne capte que les tâches actuellement visibles/dépliées dans la grille au moment du clic sur "🔄 Tâches".
- L'automatisation est séquentielle avec des délais de sécurité entre chaque action, pour rester synchronisée avec le rendu de la grille — un remplissage complet de semaine prend donc quelques secondes.
- Testé sur une grille de type JSGrid (Project Server 2016). Le comportement peut varier selon la version.

## Changelog

### v0.6.6
- **Correction définitive du Drag & Drop** : Alignement géométrique absolu basé sur l'`offsetParent` pour éliminer définitivement les décalages et sauts brusques sur PWA / SharePoint.
- **Ancrage initial automatique** : Fige la position du panneau en coordonnées physiques réelles dès le chargement pour éviter les conflits CSS.
- **Bouton de réduction de fenêtre** : Ajout d'un bouton de réduction (`—` / `＋`) à gauche de la croix de fermeture pour plier/déplier le panneau.
- **Mémoire des dimensions** : Conservation et restauration fidèle de la taille personnalisée de l'utilisateur après désactivation de la réduction.

### v0.6.0
- **Redimensionnement dynamique (Resize)** : Ajout d'une poignée de redimensionnement en bas à droite pour étirer librement le panneau.
- **Sauvegarde en temps réel (Auto-save)** : Suppression du bouton d'enregistrement manuel. Tout changement est persisté instantanément en tâche de fond.
- **Bandeau d'état (Status Bar)** : Intégration d'une barre en bas du panneau affichant l'état d'activité, les succès/échecs d'écriture et l'heure de dernière sauvegarde.
- **Notifications "Toasts"** : Micro-messages de confirmation animés et non-intrusifs à l'écran.

### v0.3.0
- Correction du texte devenu invisible au survol de certains boutons
- Autocomplétion du nom de tâche à partir des tâches réellement affichées dans la grille
- Nouveau bouton **"🔄 Tâches"** pour relire la liste à jour (utile après un scroll ou un changement de filtre)

### v0.2.0
- Templates de semaine nommés : créer, sélectionner et supprimer plusieurs semaines types, chacune sauvegardée séparément en `localStorage`
- Suppression des colonnes Samedi / Dimanche (jours non travaillés) pour accélérer la saisie
- Nouvelle charte graphique (fond blanc, bordures `#0C419A`, accents `#006386`, surfaces `#F9F9F9` / `#E7ECF5`)

### v0.1.0
- Premier jet fonctionnel : éditeur de template en panneau flottant, sauvegarde `localStorage`, remplissage automatique séquentiel de la grille (clic double + saisie clavier simulée + validation Tab)

## Licence

MIT
