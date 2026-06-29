// Écran d'ajout / modification d'une recette.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import IngredientRow from "../components/IngredientRow";
import { getRecipe, saveRecipe } from "../storage/storage";
import { colors, spacing, radius, fonts } from "../theme";

function blankIngredient() {
  return { quantity: "", unit: "", name: "" };
}

export default function AddRecipeScreen({ navigation, route }) {
  const editId = route.params?.id || null;

  const [name, setName] = useState("");
  const [refPersons, setRefPersons] = useState("2");
  const [ingredients, setIngredients] = useState([blankIngredient()]);

  useEffect(() => {
    navigation.setOptions({
      title: editId ? "Modifier la recette" : "Nouvelle recette",
    });
    if (editId) {
      (async () => {
        const recipe = await getRecipe(editId);
        if (recipe) {
          setName(recipe.name);
          setRefPersons(String(recipe.refPersons));
          setIngredients(
            recipe.ingredients.length
              ? recipe.ingredients.map((i) => ({
                  quantity: String(i.quantity ?? ""),
                  unit: i.unit ?? "",
                  name: i.name ?? "",
                }))
              : [blankIngredient()]
          );
        }
      })();
    }
  }, [editId, navigation]);

  const updateIngredient = (index, next) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? next : ing)));
  };

  const removeIngredient = (index) => {
    setIngredients((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, blankIngredient()]);
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert("Nom manquant", "Donnez un nom à votre recette.");
      return;
    }
    const persons = parseInt(refPersons, 10);
    if (!persons || persons < 1) {
      Alert.alert("Nombre de personnes invalide", "Indiquez au moins 1 personne.");
      return;
    }
    const cleaned = ingredients
      .filter((i) => String(i.name).trim())
      .map((i) => ({
        quantity: String(i.quantity).trim(),
        unit: String(i.unit).trim(),
        name: String(i.name).trim(),
      }));
    if (cleaned.length === 0) {
      Alert.alert("Aucun ingrédient", "Ajoutez au moins un ingrédient.");
      return;
    }

    await saveRecipe({
      id: editId || undefined,
      name: name.trim(),
      refPersons: persons,
      ingredients: cleaned,
    });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Nom de la recette</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Pâtes bolognaise"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Nombre de personnes de référence</Text>
        <TextInput
          style={[styles.input, styles.personsInput]}
          value={refPersons}
          onChangeText={setRefPersons}
          placeholder="2"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
        />

        <View style={styles.ingredientsHeader}>
          <Text style={styles.label}>Ingrédients</Text>
          <Text style={styles.hint}>quantité · unité · nom</Text>
        </View>

        {ingredients.map((ing, index) => (
          <IngredientRow
            key={index}
            ingredient={ing}
            onChange={(next) => updateIngredient(index, next)}
            onRemove={() => removeIngredient(index)}
          />
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
          <Ionicons name="add-circle-outline" size={22} color={colors.secondary} />
          <Text style={styles.addBtnText}>Ajouter un ingrédient</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.85}>
          <Ionicons name="save-outline" size={20} color={colors.white} />
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  label: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  hint: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.regular },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  personsInput: { width: 90, textAlign: "center" },
  ingredientsHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  addBtnText: {
    marginLeft: spacing.xs,
    color: colors.secondary,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
    marginLeft: spacing.sm,
  },
});
