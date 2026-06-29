// Logique de fusion et de mise à l'échelle des quantités pour la liste de courses.
//
// Règle de mise à l'échelle :
//   quantité réelle = (quantité référence / personnes référence) × personnes réelles
//
// Règles de fusion :
//   - insensible à la casse et aux espaces ("Pâtes" === "pâtes")
//   - on ne fusionne JAMAIS deux unités différentes (200 g + 2 pièces restent séparés)
//   - regroupement par catégorie (Féculents, Viandes, Légumes, Produits laitiers, Autre)
//
// La liste de courses est un tableau PLAT d'items :
//   { id, name, unit, quantity, category, checked, source: 'recipe' | 'manual' }
// Le regroupement par catégorie est fait à l'affichage via groupItems().

// --- Catégorisation par mots-clés ----------------------------------------

export const CATEGORIES = [
  "Féculents",
  "Viandes",
  "Légumes",
  "Produits laitiers",
  "Autre",
];

const CATEGORY_KEYWORDS = {
  Féculents: [
    "pate", "pâte", "riz", "pomme de terre", "patate", "semoule", "quinoa",
    "boulgour", "boulghour", "pain", "farine", "lentille", "pois chiche",
    "haricot sec", "couscous", "polenta", "gnocchi", "ble", "blé",
  ],
  Viandes: [
    "viande", "boeuf", "bœuf", "poulet", "porc", "agneau", "veau", "dinde",
    "jambon", "lardon", "saucisse", "steak", "hache", "haché", "poisson",
    "saumon", "thon", "cabillaud", "crevette", "merguez", "bacon", "canard",
  ],
  Légumes: [
    "oignon", "ail", "tomate", "carotte", "courgette", "poivron", "salade",
    "epinard", "épinard", "champignon", "brocoli", "chou", "concombre",
    "poireau", "aubergine", "haricot vert", "petit pois", "echalote",
    "échalote", "celeri", "céleri", "navet", "betterave", "radis", "legume",
    "légume",
  ],
  "Produits laitiers": [
    "lait", "creme", "crème", "beurre", "fromage", "yaourt", "yogourt",
    "mozzarella", "parmesan", "gruyere", "gruyère", "emmental", "ricotta",
    "mascarpone", "feta", "chevre", "chèvre",
  ],
};

// Retire les accents pour une comparaison plus tolérante des mots-clés.
function stripAccents(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// overrides : map { nomNormalisé: catégorie } pour corriger manuellement le
// rangement d'un ingrédient (mémorisé entre deux générations).
export function categorize(name, overrides) {
  const norm = normalizeName(name);
  if (overrides && overrides[norm] && CATEGORIES.includes(overrides[norm])) {
    return overrides[norm];
  }
  const n = stripAccents(String(name).toLowerCase());
  for (const cat of CATEGORIES) {
    const keywords = CATEGORY_KEYWORDS[cat];
    if (!keywords) continue;
    for (const kw of keywords) {
      if (n.includes(stripAccents(kw))) return cat;
    }
  }
  return "Autre";
}

// --- Normalisation -------------------------------------------------------

// Clé de fusion : nom insensible casse/espaces + unité normalisée.
export function normalizeName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeUnit(unit) {
  return String(unit || "")
    .trim()
    .toLowerCase();
}

// Identifiant stable d'un item (sert de clé de fusion et de React key).
export function makeItemId(name, unit) {
  return normalizeName(name) + "|" + normalizeUnit(unit);
}

// Unités « dénombrables » : on ne peut pas acheter une demi-boîte, donc on
// arrondit à l'entier supérieur (1,5 boîte -> 2 boîtes). L'unité vide est
// traitée comme dénombrable (1,5 oignon -> 2 oignons).
const COUNTABLE_UNITS = new Set([
  "", "piece", "pièce", "pieces", "pièces", "boite", "boîte", "boites",
  "boîtes", "gousse", "gousses", "sachet", "sachets", "tranche", "tranches",
  "oeuf", "œuf", "oeufs", "œufs", "pot", "pots", "brique", "briques",
]);

function isCountable(unit) {
  return COUNTABLE_UNITS.has(normalizeUnit(unit));
}

// Arrondi propre : entier supérieur pour les unités dénombrables, sinon
// 2 décimales max sans zéros inutiles.
function roundQty(n, unit) {
  if (!isFinite(n)) return 0;
  if (isCountable(unit)) return Math.ceil(n);
  return Math.round(n * 100) / 100;
}

// --- Pluriel des unités « mots » -----------------------------------------

// Unités exprimées en toutes lettres qui prennent un "s" au pluriel.
// (g, kg, ml, cl, l, c. à s.… ne sont pas pluralisés.)
const WORD_UNITS_SINGULAR = new Set([
  "boîte", "boite", "gousse", "pièce", "piece", "sachet", "tranche", "pot",
  "brique", "bouteille", "bouquet", "branche", "feuille", "verre", "tasse",
]);

function displayUnit(unit, qty) {
  const u = String(unit || "");
  if (qty > 1 && WORD_UNITS_SINGULAR.has(normalizeUnit(u))) {
    return u + "s";
  }
  return u;
}

// --- Fusion principale ---------------------------------------------------

// meals : tableau de repas cochés, chacun de la forme
//   { recipe: { refPersons, ingredients: [{ quantity, unit, name }] },
//     persons: <nombre de personnes réel pour ce repas> }
// overrides : map des catégories corrigées (optionnel)
//
// Retourne un tableau PLAT d'items triés (catégorie puis nom).
export function mergeIngredients(meals, overrides) {
  const map = new Map(); // id -> { name, unit, quantity }

  for (const meal of meals || []) {
    const recipe = meal && meal.recipe;
    if (!recipe || !Array.isArray(recipe.ingredients)) continue;

    const refPersons = Number(recipe.refPersons) || 1;
    const realPersons = Number(meal.persons) || refPersons;
    const factor = realPersons / refPersons;

    for (const ing of recipe.ingredients) {
      if (!ing || !String(ing.name || "").trim()) continue;

      const id = makeItemId(ing.name, ing.unit);
      const rawQty = Number(String(ing.quantity).replace(",", "."));
      const scaled = (isFinite(rawQty) ? rawQty : 0) * factor;

      if (map.has(id)) {
        map.get(id).quantity += scaled;
      } else {
        map.set(id, {
          name: String(ing.name).trim(),
          unit: String(ing.unit || "").trim(),
          quantity: scaled,
        });
      }
    }
  }

  const items = [];
  for (const [id, entry] of map.entries()) {
    items.push({
      id,
      name: entry.name,
      unit: entry.unit,
      quantity: roundQty(entry.quantity, entry.unit),
      category: categorize(entry.name, overrides),
      checked: false,
      source: "recipe",
    });
  }

  return sortItems(items);
}

// Tri : par ordre de catégorie puis par nom (français).
export function sortItems(items) {
  const order = {};
  CATEGORIES.forEach((c, i) => (order[c] = i));
  return [...items].sort((a, b) => {
    const ca = order[a.category] ?? 99;
    const cb = order[b.category] ?? 99;
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name, "fr");
  });
}

// Regroupe une liste plate en sections pour la SectionList.
//   -> [{ title: catégorie, data: [items] }]
export function groupItems(items) {
  const byCat = {};
  for (const cat of CATEGORIES) byCat[cat] = [];
  for (const it of items || []) {
    const cat = CATEGORIES.includes(it.category) ? it.category : "Autre";
    byCat[cat].push(it);
  }
  const sections = [];
  for (const cat of CATEGORIES) {
    if (byCat[cat].length === 0) continue;
    byCat[cat].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    sections.push({ title: cat, data: byCat[cat] });
  }
  return sections;
}

// Formate "200 g — pâtes" / "2 boîtes — sauce tomate" pour l'affichage et
// l'export texte. Quantité vide => juste le nom (ingrédient "selon goût").
export function formatItem(item) {
  const qty = item.quantity;
  const unit = displayUnit(item.unit, qty);
  const unitPart = unit ? ` ${unit}` : "";
  const qtyStr = qty ? `${qty}${unitPart}` : unit.trim();
  return qtyStr ? `${qtyStr} — ${item.name}` : item.name;
}
