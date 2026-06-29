// Écran liste des recettes : afficher, modifier, supprimer, ajouter.

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getRecipes, deleteRecipe } from "../storage/storage";
import { colors, spacing, radius, fonts } from "../theme";

export default function RecipesScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);

  const load = useCallback(async () => {
    setRecipes(await getRecipes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmDelete = (recipe) => {
    Alert.alert(
      "Supprimer la recette",
      `Supprimer "${recipe.name}" ? Elle sera aussi retirée du planning.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteRecipe(recipe.id);
            load();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const count = item.ingredients?.length || 0;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("AddRecipe", { id: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconBubble}>
            <Ionicons name="restaurant" size={20} color={colors.white} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>
              {item.refPersons} pers. · {count} ingrédient{count > 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => confirmDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="fast-food-outline" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>Aucune recette</Text>
            <Text style={styles.emptyText}>
              Ajoutez votre première recette avec le bouton +
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddRecipe")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  cardSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  empty: { alignItems: "center", marginTop: 100, paddingHorizontal: spacing.xl },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
