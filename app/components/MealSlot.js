// Carte d'un créneau de repas (Matin / Midi / Goûter / Soir) dans la vue
// semaine. Un créneau contient une LISTE de plats ; chaque plat a son propre
// nombre de personnes et sa propre case "inclure aux courses".

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fonts } from "../theme";

export default function MealSlot({
  slotLabel,
  dishes,
  recipeById,
  onAddDish,
  onToggleDish,
  onChangeDishPersons,
  onRemoveDish,
}) {
  const checkedCount = dishes.filter((d) => d.checked).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.slotLabel}>{slotLabel}</Text>
        {dishes.length > 0 && (
          <Text style={styles.count}>
            {dishes.length} plat{dishes.length > 1 ? "s" : ""}
            {checkedCount > 0 ? ` · ${checkedCount} aux courses` : ""}
          </Text>
        )}
      </View>

      {dishes.map((dish, index) => {
        const recipe = recipeById(dish.recipeId);
        const checked = !!dish.checked;
        const persons = dish.persons ?? (recipe ? recipe.refPersons : 1);
        return (
          <View
            key={index}
            style={[styles.dish, checked && styles.dishChecked]}
          >
            <View style={styles.dishTop}>
              <TouchableOpacity
                onPress={() => onToggleDish(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={checked ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={checked ? colors.checked : colors.textMuted}
                />
              </TouchableOpacity>
              <Text style={styles.dishName} numberOfLines={2}>
                {recipe ? recipe.name : "Recette supprimée"}
              </Text>
              <TouchableOpacity
                onPress={() => onRemoveDish(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.dishBottom}>
              <Ionicons name="people-outline" size={15} color={colors.textMuted} />
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => onChangeDishPersons(index, -1)}
              >
                <Ionicons name="remove" size={15} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.personsText}>{persons}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => onChangeDishPersons(index, 1)}
              >
                <Ionicons name="add" size={15} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.personsLabel}>pers.</Text>
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={styles.addBtn} onPress={onAddDish}>
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addText}>Ajouter un plat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  slotLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  count: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.regular },
  dish: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  dishChecked: {
    borderColor: colors.checked,
    backgroundColor: "#F1F8F1",
  },
  dishTop: { flexDirection: "row", alignItems: "center" },
  dishName: {
    flex: 1,
    marginHorizontal: spacing.sm,
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  dishBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    marginLeft: 2,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.xs,
  },
  personsText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
    minWidth: 18,
    textAlign: "center",
  },
  personsLabel: {
    marginLeft: spacing.xs,
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  addText: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
});
