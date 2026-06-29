// Vue calendrier hebdomadaire : Lundi → Dimanche, 3 créneaux par jour.
// Assignation de recettes, choix du nombre de personnes, cochage pour la
// liste de courses, génération de la liste et réinitialisation.

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MealSlot from "../components/MealSlot";
import {
  getRecipes,
  getPlanning,
  addDish,
  updateDish,
  removeDish,
  resetPlanning,
  applyGeneratedItems,
  getCategoryOverrides,
  DAYS,
  SLOTS,
} from "../storage/storage";
import { mergeIngredients } from "../utils/mergeIngredients";
import { colors, spacing, radius, fonts } from "../theme";

// Jour courant -> index dans DAYS (Lundi = 0 … Dimanche = 6).
function todayIndex() {
  return (new Date().getDay() + 6) % 7;
}

export default function WeekScreen({ navigation }) {
  const [planning, setPlanning] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedDay, setSelectedDay] = useState(DAYS[todayIndex()]);
  const [picker, setPicker] = useState({ visible: false, day: null, slot: null });

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([getPlanning(), getRecipes()]);
    setPlanning(p);
    setRecipes(r);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const recipeById = (id) => recipes.find((r) => r.id === id) || null;

  const openPicker = (day, slot) => {
    if (recipes.length === 0) {
      Alert.alert(
        "Aucune recette",
        "Créez d'abord une recette dans l'onglet Recettes."
      );
      return;
    }
    setPicker({ visible: true, day, slot });
  };

  const addRecipeToSlot = async (recipe) => {
    const { day, slot } = picker;
    const next = await addDish(day, slot, {
      recipeId: recipe.id,
      persons: recipe.refPersons,
      checked: true,
    });
    setPlanning({ ...next });
    setPicker({ visible: false, day: null, slot: null });
  };

  const toggleDish = async (day, slot, index) => {
    const dish = planning[day][slot][index];
    if (!dish) return;
    const next = await updateDish(day, slot, index, {
      ...dish,
      checked: !dish.checked,
    });
    setPlanning({ ...next });
  };

  const changeDishPersons = async (day, slot, index, delta) => {
    const dish = planning[day][slot][index];
    if (!dish) return;
    const persons = Math.max(1, (dish.persons || 1) + delta);
    const next = await updateDish(day, slot, index, { ...dish, persons });
    setPlanning({ ...next });
  };

  const removeDishFromSlot = async (day, slot, index) => {
    const next = await removeDish(day, slot, index);
    setPlanning({ ...next });
  };

  const countChecked = () => {
    if (!planning) return 0;
    let n = 0;
    for (const day of DAYS)
      for (const slot of SLOTS)
        for (const dish of planning[day][slot]) if (dish.checked) n += 1;
    return n;
  };

  const generateList = async () => {
    const meals = [];
    for (const day of DAYS) {
      for (const slot of SLOTS) {
        for (const dish of planning[day][slot]) {
          if (dish.checked) {
            const recipe = recipeById(dish.recipeId);
            if (recipe) meals.push({ recipe, persons: dish.persons });
          }
        }
      }
    }
    if (meals.length === 0) {
      Alert.alert(
        "Liste vide",
        "Cochez au moins un repas pour générer la liste de courses."
      );
      return;
    }
    const overrides = await getCategoryOverrides();
    const recipeItems = mergeIngredients(meals, overrides);
    // applyGeneratedItems conserve les cases déjà cochées et les articles
    // ajoutés à la main (la progression au supermarché n'est pas perdue).
    await applyGeneratedItems(recipeItems);
    navigation.navigate("Courses");
  };

  const confirmReset = () => {
    Alert.alert(
      "Réinitialiser la semaine",
      "Effacer tout le planning ? Vos recettes seront conservées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: async () => {
            const empty = await resetPlanning();
            setPlanning({ ...empty });
          },
        },
      ]
    );
  };

  if (!planning) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  const checkedCount = countChecked();
  const dayChecked = (day) =>
    SLOTS.reduce(
      (n, slot) => n + planning[day][slot].filter((d) => d.checked).length,
      0
    );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.weekTitle}>Ma semaine</Text>
        <TouchableOpacity onPress={confirmReset} style={styles.resetBtn}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
          <Text style={styles.resetText}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>

      {/* Sélecteur de jour : un seul jour affiché à la fois */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayBarWrap}
        contentContainerStyle={styles.dayBar}
      >
        {DAYS.map((day) => {
          const active = day === selectedDay;
          const n = dayChecked(day);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, active && styles.dayChipActive]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[styles.dayChipText, active && styles.dayChipTextActive]}
              >
                {day.slice(0, 3)}
              </Text>
              {n > 0 && (
                <View style={[styles.dayDot, active && styles.dayDotActive]}>
                  <Text
                    style={[
                      styles.dayDotText,
                      active && styles.dayDotTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.dayTitle}>{selectedDay}</Text>
        {SLOTS.map((slot) => (
          <MealSlot
            key={slot}
            slotLabel={slot}
            dishes={planning[selectedDay][slot]}
            recipeById={recipeById}
            onAddDish={() => openPicker(selectedDay, slot)}
            onToggleDish={(index) => toggleDish(selectedDay, slot, index)}
            onChangeDishPersons={(index, delta) =>
              changeDishPersons(selectedDay, slot, index, delta)
            }
            onRemoveDish={(index) => removeDishFromSlot(selectedDay, slot, index)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={generateList}
          activeOpacity={0.85}
        >
          <Ionicons name="cart" size={20} color={colors.white} />
          <Text style={styles.generateText}>
            Générer la liste de courses
            {checkedCount > 0 ? `  (${checkedCount})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sélecteur de recette */}
      <Modal
        visible={picker.visible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setPicker({ visible: false, day: null, slot: null })
        }
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Ajouter un plat · {picker.slot}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setPicker({ visible: false, day: null, slot: null })
                }
              >
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={recipes}
              keyExtractor={(item) => item.id}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickRow}
                  onPress={() => addRecipeToSlot(item)}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.pickInfo}>
                    <Text style={styles.pickName}>{item.name}</Text>
                    <Text style={styles.pickSub}>{item.refPersons} pers.</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.textMuted, fontFamily: fonts.regular },
  scroll: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: 110 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  weekTitle: { fontSize: 23, fontFamily: fonts.extrabold, color: colors.text },
  resetBtn: { flexDirection: "row", alignItems: "center" },
  resetText: { color: colors.primary, marginLeft: 4, fontFamily: fonts.semibold },
  dayBarWrap: { flexGrow: 0, maxHeight: 56 },
  dayBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dayChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: { fontSize: 14, fontFamily: fonts.bold, color: colors.textMuted },
  dayChipTextActive: { color: colors.white },
  dayDot: {
    marginLeft: spacing.xs,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotActive: { backgroundColor: colors.white },
  dayDotText: { fontSize: 11, fontFamily: fonts.extrabold, color: colors.white },
  dayDotTextActive: { color: colors.primary },
  dayTitle: {
    fontSize: 18,
    fontFamily: fonts.extrabold,
    color: colors.secondaryDark,
    marginBottom: spacing.sm,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  generateText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
    marginLeft: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 18, fontFamily: fonts.extrabold, color: colors.text },
  modalList: { flexGrow: 0 },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickInfo: { marginLeft: spacing.md },
  pickName: { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  pickSub: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular },
  removeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  removeText: {
    color: colors.danger,
    marginLeft: spacing.sm,
    fontFamily: fonts.semibold,
  },
});
