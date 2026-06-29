// Ligne d'édition d'un ingrédient : quantité (optionnelle) + unité (libre,
// avec puces de suggestion) + nom, avec bouton suppression.

import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fonts } from "../theme";

// Unités courantes proposées en puces. L'utilisateur reste libre de taper
// n'importe quelle unité personnalisée dans le champ.
const COMMON_UNITS = [
  "g",
  "kg",
  "ml",
  "cl",
  "l",
  "pièce",
  "boîte",
  "gousse",
  "c. à s.",
  "c. à c.",
  "pincée",
  "sachet",
  "tranche",
];

export default function IngredientRow({ ingredient, onChange, onRemove }) {
  const activeUnit = String(ingredient.unit || "").trim().toLowerCase();

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.qty]}
          value={String(ingredient.quantity ?? "")}
          onChangeText={(v) => onChange({ ...ingredient, quantity: v })}
          placeholder="1"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.unit]}
          value={ingredient.unit}
          onChangeText={(v) => onChange({ ...ingredient, unit: v })}
          placeholder="unité"
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          style={[styles.input, styles.name]}
          value={ingredient.name}
          onChangeText={(v) => onChange({ ...ingredient, name: v })}
          placeholder="sauce tomate"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={26} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        keyboardShouldPersistTaps="handled"
      >
        {COMMON_UNITS.map((u) => {
          const active = u.toLowerCase() === activeUnit;
          return (
            <TouchableOpacity
              key={u}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() =>
                onChange({ ...ingredient, unit: active ? "" : u })
              }
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {u}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  qty: {
    width: 52,
    marginRight: spacing.xs,
    textAlign: "center",
  },
  unit: {
    width: 70,
    marginRight: spacing.xs,
    textAlign: "center",
  },
  name: {
    flex: 1,
    marginRight: spacing.xs,
  },
  removeBtn: {
    paddingLeft: 2,
  },
  chips: {
    paddingTop: spacing.xs,
    paddingRight: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.medium,
  },
  chipTextActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
});
