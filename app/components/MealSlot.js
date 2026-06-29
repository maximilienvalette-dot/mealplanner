// Carte d'un créneau de repas (Matin / Midi / Soir) dans la vue semaine.
// Permet d'assigner une recette, fixer le nombre de personnes et cocher
// l'inclusion dans la liste de courses.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fonts } from "../theme";

export default function MealSlot({
  slotLabel,
  slotData,
  recipe,
  onPress,
  onToggleCheck,
  onChangePersons,
}) {
  const hasRecipe = !!recipe;
  const checked = !!(slotData && slotData.checked);

  return (
    <View
      style={[
        styles.card,
        hasRecipe && checked && styles.cardChecked,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.slotLabel}>{slotLabel}</Text>
        {hasRecipe && (
          <TouchableOpacity
            onPress={onToggleCheck}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={checked ? "checkmark-circle" : "ellipse-outline"}
              size={26}
              color={checked ? colors.checked : colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.body} onPress={onPress}>
        {hasRecipe ? (
          <Text style={styles.recipeName} numberOfLines={2}>
            {recipe.name}
          </Text>
        ) : (
          <View style={styles.emptyBody}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.emptyText}>Assigner une recette</Text>
          </View>
        )}
      </TouchableOpacity>

      {hasRecipe && (
        <View style={styles.footer}>
          <Ionicons name="people-outline" size={16} color={colors.textMuted} />
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onChangePersons(-1)}
          >
            <Ionicons name="remove" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.personsText}>
            {slotData?.persons ?? recipe.refPersons}
          </Text>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => onChangePersons(1)}
          >
            <Ionicons name="add" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.personsLabel}>pers.</Text>
        </View>
      )}
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
  cardChecked: {
    borderColor: colors.checked,
    backgroundColor: "#F1F8F1",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  body: {
    marginTop: spacing.sm,
    minHeight: 28,
    justifyContent: "center",
  },
  recipeName: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  emptyBody: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyText: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.xs,
  },
  personsText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text,
    minWidth: 20,
    textAlign: "center",
  },
  personsLabel: {
    marginLeft: spacing.xs,
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
});
