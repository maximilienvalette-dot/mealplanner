# Cuisine Semaine (MealPlanner)

Application mobile (iOS + Android) de planification de repas et de génération
automatique de liste de courses. 100 % offline, données stockées localement.

## Fonctionnalités

- **Recettes** : créer / modifier / supprimer des recettes avec nombre de
  personnes de référence et liste d'ingrédients dynamique (quantité · unité · nom).
- **Semaine** : calendrier Lundi → Dimanche, 3 créneaux par jour (Matin / Midi /
  Soir). Pour chaque créneau : assigner une recette, choisir le nombre de
  personnes réel, cocher pour l'inclure dans les courses.
- **Courses** : liste agrégée et mise à l'échelle, doublons fusionnés, groupée
  par catégorie, items cochables, « Tout décocher » et partage texte natif.
- **Persistance** : AsyncStorage. Recettes permanentes, planning
  réinitialisable (avec confirmation).

## Lancer le projet

```bash
npm install
npx expo start
```

Puis scannez le QR code avec l'app **Expo Go** (iOS / Android), ou lancez
`npx expo start --android` / `--ios`.

## Build de production

```bash
npx eas build --platform all
```

## Structure

```
/app
  /screens     RecipesScreen, AddRecipeScreen, WeekScreen, ShoppingListScreen
  /components  IngredientRow, MealSlot, ShoppingItem
  /storage     storage.js        (CRUD AsyncStorage)
  /utils       mergeIngredients.js (fusion / mise à l'échelle des quantités)
  theme.js
App.js
app.json
```

## Logique de mise à l'échelle

`quantité réelle = (quantité référence / personnes référence) × personnes réelles`

La fusion est insensible à la casse et aux espaces. Deux unités différentes
(ex : 200 g et 2 pièces) ne sont jamais additionnées.
