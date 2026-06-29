// Couche de persistance locale (AsyncStorage) — fonctions CRUD.
// Aucune dépendance réseau : tout est stocké sur l'appareil.

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  RECIPES: "@mealplanner/recipes",
  PLANNING: "@mealplanner/planning",
  SHOPPING: "@mealplanner/shopping",
  CATEGORY_OVERRIDES: "@mealplanner/categoryOverrides",
};

// --- Helpers bas niveau --------------------------------------------------

async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`storage: lecture ${key} échouée`, e);
    return fallback;
  }
}

async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`storage: écriture ${key} échouée`, e);
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- Recettes (permanentes) ----------------------------------------------

export async function getRecipes() {
  return readJSON(KEYS.RECIPES, []);
}

export async function getRecipe(id) {
  const recipes = await getRecipes();
  return recipes.find((r) => r.id === id) || null;
}

// recipe : { name, refPersons, ingredients: [{ quantity, unit, name }] }
// Si recipe.id existe, mise à jour ; sinon création.
export async function saveRecipe(recipe) {
  const recipes = await getRecipes();
  let saved;
  if (recipe.id) {
    saved = { ...recipe };
    const idx = recipes.findIndex((r) => r.id === recipe.id);
    if (idx >= 0) recipes[idx] = saved;
    else recipes.push(saved);
  } else {
    saved = { ...recipe, id: genId() };
    recipes.push(saved);
  }
  await writeJSON(KEYS.RECIPES, recipes);
  return saved;
}

export async function deleteRecipe(id) {
  const recipes = await getRecipes();
  const next = recipes.filter((r) => r.id !== id);
  await writeJSON(KEYS.RECIPES, next);

  // Nettoie le planning des créneaux référençant cette recette
  const planning = await getPlanning();
  let changed = false;
  for (const dayKey of Object.keys(planning)) {
    for (const slotKey of Object.keys(planning[dayKey])) {
      if (planning[dayKey][slotKey]?.recipeId === id) {
        planning[dayKey][slotKey] = null;
        changed = true;
      }
    }
  }
  if (changed) await writeJSON(KEYS.PLANNING, planning);
}

// --- Planning hebdomadaire (réinitialisable) -----------------------------

export const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export const SLOTS = ["Matin", "Midi", "Soir"];

// Structure : { [jour]: { [créneau]: { recipeId, persons, checked } | null } }
export function emptyPlanning() {
  const planning = {};
  for (const day of DAYS) {
    planning[day] = {};
    for (const slot of SLOTS) planning[day][slot] = null;
  }
  return planning;
}

export async function getPlanning() {
  const stored = await readJSON(KEYS.PLANNING, null);
  if (!stored) return emptyPlanning();
  // Fusionne avec la structure vide pour garantir tous les jours/créneaux
  const base = emptyPlanning();
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      if (stored[day] && stored[day][slot]) base[day][slot] = stored[day][slot];
    }
  }
  return base;
}

export async function savePlanning(planning) {
  await writeJSON(KEYS.PLANNING, planning);
}

// Assigne / met à jour un créneau. slotData = { recipeId, persons, checked }
export async function setSlot(day, slot, slotData) {
  const planning = await getPlanning();
  planning[day][slot] = slotData;
  await savePlanning(planning);
  return planning;
}

export async function clearSlot(day, slot) {
  const planning = await getPlanning();
  planning[day][slot] = null;
  await savePlanning(planning);
  return planning;
}

// Réinitialise tout le planning de la semaine (recettes conservées).
export async function resetPlanning() {
  const empty = emptyPlanning();
  await savePlanning(empty);
  return empty;
}

// --- Liste de courses ----------------------------------------------------
//
// Format : tableau PLAT d'items
//   { id, name, unit, quantity, category, checked, source: 'recipe' | 'manual' }

export async function getShoppingList() {
  const stored = await readJSON(KEYS.SHOPPING, null);
  if (!Array.isArray(stored)) return [];
  // Migration : on ne garde que les items au format plat valide (un ancien
  // format imbriqué {category, items} est ignoré ; il suffit de régénérer).
  return stored.filter(
    (it) => it && typeof it === "object" && typeof it.name === "string" && it.id
  );
}

export async function saveShoppingList(items) {
  await writeJSON(KEYS.SHOPPING, Array.isArray(items) ? items : []);
}

export async function clearShoppingList() {
  await AsyncStorage.removeItem(KEYS.SHOPPING);
}

// Régénère la partie "recettes" de la liste tout en :
//   - conservant les cases déjà cochées (par id),
//   - conservant les articles ajoutés à la main (source 'manual').
// recipeItems : items générés par mergeIngredients (source 'recipe').
export async function applyGeneratedItems(recipeItems) {
  const old = await getShoppingList();
  const checkedById = {};
  const manual = [];
  for (const it of old) {
    if (it.source === "manual") manual.push(it);
    else if (it.checked) checkedById[it.id] = true;
  }
  const merged = [
    ...recipeItems.map((it) => ({
      ...it,
      checked: !!checkedById[it.id],
    })),
    ...manual,
  ];
  await saveShoppingList(merged);
  return merged;
}

// Indique s'il existe une liste avec au moins une case cochée (pour avertir
// avant d'écraser la progression au supermarché).
export async function shoppingListHasChecked() {
  const list = await getShoppingList();
  return list.some((it) => it.checked);
}

// --- Catégories corrigées par l'utilisateur ------------------------------

export async function getCategoryOverrides() {
  const stored = await readJSON(KEYS.CATEGORY_OVERRIDES, null);
  return stored && typeof stored === "object" ? stored : {};
}

// normName : nom déjà normalisé (voir makeItemId / normalizeName).
export async function setCategoryOverride(normName, category) {
  const overrides = await getCategoryOverrides();
  overrides[normName] = category;
  await writeJSON(KEYS.CATEGORY_OVERRIDES, overrides);
  return overrides;
}
