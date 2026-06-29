// Couche de persistance locale (AsyncStorage) — fonctions CRUD.
// Aucune dépendance réseau : tout est stocké sur l'appareil.

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  RECIPES: "@mealplanner/recipes",
  PLANNING: "@mealplanner/planning",
  SHOPPING: "@mealplanner/shopping",
  CATEGORY_OVERRIDES: "@mealplanner/categoryOverrides",
  RECIPE_CATEGORIES: "@mealplanner/recipeCategories",
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

  // Nettoie le planning des plats référençant cette recette
  const planning = await getPlanning();
  let changed = false;
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      const dishes = planning[day][slot];
      const filtered = dishes.filter((d) => d.recipeId !== id);
      if (filtered.length !== dishes.length) {
        planning[day][slot] = filtered;
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

export const SLOTS = ["Matin", "Midi", "Goûter", "Soir"];

// Structure : { [jour]: { [créneau]: [ { recipeId, persons, checked } ] } }
// Chaque créneau contient une LISTE de plats (0..n).
export function emptyPlanning() {
  const planning = {};
  for (const day of DAYS) {
    planning[day] = {};
    for (const slot of SLOTS) planning[day][slot] = [];
  }
  return planning;
}

// Normalise une valeur de créneau stockée vers une liste de plats.
// Gère la migration de l'ancien format (un seul objet { recipeId, ... }).
function normalizeSlot(value) {
  if (Array.isArray(value)) {
    return value.filter((d) => d && d.recipeId);
  }
  if (value && typeof value === "object" && value.recipeId) {
    return [
      {
        recipeId: value.recipeId,
        persons: value.persons,
        checked: !!value.checked,
      },
    ];
  }
  return [];
}

export async function getPlanning() {
  const stored = await readJSON(KEYS.PLANNING, null);
  const base = emptyPlanning();
  if (!stored) return base;
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      base[day][slot] = normalizeSlot(stored[day] && stored[day][slot]);
    }
  }
  return base;
}

export async function savePlanning(planning) {
  await writeJSON(KEYS.PLANNING, planning);
}

// Remplace toute la liste de plats d'un créneau.
export async function setSlot(day, slot, dishes) {
  const planning = await getPlanning();
  planning[day][slot] = Array.isArray(dishes) ? dishes : [];
  await savePlanning(planning);
  return planning;
}

// Ajoute un plat à un créneau. dish = { recipeId, persons, checked }
export async function addDish(day, slot, dish) {
  const planning = await getPlanning();
  planning[day][slot] = [...planning[day][slot], dish];
  await savePlanning(planning);
  return planning;
}

// Met à jour le plat d'index donné dans un créneau.
export async function updateDish(day, slot, index, dish) {
  const planning = await getPlanning();
  const dishes = planning[day][slot];
  if (index >= 0 && index < dishes.length) {
    dishes[index] = dish;
    await savePlanning(planning);
  }
  return planning;
}

// Retire le plat d'index donné.
export async function removeDish(day, slot, index) {
  const planning = await getPlanning();
  planning[day][slot] = planning[day][slot].filter((_, i) => i !== index);
  await savePlanning(planning);
  return planning;
}

export async function clearSlot(day, slot) {
  return setSlot(day, slot, []);
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

// --- Catégories de recettes (définies par l'utilisateur) -----------------
//
// Format : [{ id, name, emoji }]. Une recette pointe dessus via recipe.categoryId.

export async function getCategories() {
  const stored = await readJSON(KEYS.RECIPE_CATEGORIES, []);
  return Array.isArray(stored) ? stored : [];
}

// cat = { id?, name, emoji } ; crée si pas d'id, sinon met à jour.
export async function saveCategory(cat) {
  const categories = await getCategories();
  let saved;
  if (cat.id) {
    saved = { ...cat };
    const idx = categories.findIndex((c) => c.id === cat.id);
    if (idx >= 0) categories[idx] = saved;
    else categories.push(saved);
  } else {
    saved = { ...cat, id: genId() };
    categories.push(saved);
  }
  await writeJSON(KEYS.RECIPE_CATEGORIES, categories);
  return saved;
}

// Supprime une catégorie ; les recettes concernées repassent "Sans catégorie".
export async function deleteCategory(id) {
  const categories = await getCategories();
  await writeJSON(
    KEYS.RECIPE_CATEGORIES,
    categories.filter((c) => c.id !== id)
  );
}
