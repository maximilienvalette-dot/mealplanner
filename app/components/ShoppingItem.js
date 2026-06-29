// Ligne cochable de la liste de courses (pour barrer au supermarché).
// onMore (optionnel) affiche un bouton d'actions (changer de rayon, supprimer).

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatItem } from "../utils/mergeIngredients";
import { colors, spacing, radius, fonts } from "../theme";

export default function ShoppingItem({ item, onToggle, onMore }) {
  const checked = !!item.checked;
  // formatItem gère quantité/unité/pluriel ; on sépare la quantité du nom
  // pour pouvoir la mettre en gras.
  const label = formatItem(item);
  const sepIndex = label.indexOf(" — ");
  const qtyPart = sepIndex >= 0 ? label.slice(0, sepIndex) : "";
  const namePart = sepIndex >= 0 ? label.slice(sepIndex + 3) : label;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.main}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Ionicons
          name={checked ? "checkbox" : "square-outline"}
          size={24}
          color={checked ? colors.checked : colors.textMuted}
        />
        <Text style={[styles.text, checked && styles.textChecked]}>
          {qtyPart ? <Text style={styles.qty}>{qtyPart} </Text> : null}
          {namePart}
          {item.source === "manual" ? (
            <Text style={styles.manualTag}>  •  ajouté</Text>
          ) : null}
        </Text>
      </TouchableOpacity>

      {onMore && (
        <TouchableOpacity
          onPress={onMore}
          style={styles.moreBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: spacing.sm,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  text: {
    marginLeft: spacing.md,
    fontSize: 16,
    color: colors.text,
    flex: 1,
    fontFamily: fonts.medium,
  },
  qty: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  manualTag: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  textChecked: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  moreBtn: {
    padding: spacing.sm,
  },
});
