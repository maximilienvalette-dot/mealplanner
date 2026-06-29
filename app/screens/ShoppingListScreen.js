// Liste de courses : items groupés par rayon, cochables, ajout d'articles
// libres (hors recette), changement de rayon, "Tout décocher" et partage.

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  SectionList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ShoppingItem from "../components/ShoppingItem";
import {
  getShoppingList,
  saveShoppingList,
  setCategoryOverride,
} from "../storage/storage";
import {
  formatItem,
  groupItems,
  CATEGORIES,
  normalizeName,
} from "../utils/mergeIngredients";
import { colors, spacing, radius, fonts } from "../theme";

export default function ShoppingListScreen() {
  const [list, setList] = useState([]);
  const [draft, setDraft] = useState("");
  const [actionItem, setActionItem] = useState(null); // item dont on ouvre le menu

  const load = useCallback(async () => {
    setList(await getShoppingList());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const persist = async (next) => {
    setList(next);
    await saveShoppingList(next);
  };

  const sections = groupItems(list);

  const toggleItem = (id) => {
    persist(
      list.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  };

  const uncheckAll = () => {
    persist(list.map((it) => ({ ...it, checked: false })));
  };

  const addManualItem = () => {
    const name = draft.trim();
    if (!name) return;
    const id = "manual-" + Date.now().toString(36);
    const item = {
      id,
      name,
      unit: "",
      quantity: 0,
      category: "Autre",
      checked: false,
      source: "manual",
    };
    setDraft("");
    persist([...list, item]);
  };

  const removeItem = (id) => {
    persist(list.filter((it) => it.id !== id));
    setActionItem(null);
  };

  const changeCategory = async (item, category) => {
    const next = list.map((it) =>
      it.id === item.id ? { ...it, category } : it
    );
    await persist(next);
    // Mémorise le rayon choisi pour les ingrédients de recette, afin que les
    // prochaines générations le respectent.
    if (item.source === "recipe") {
      await setCategoryOverride(normalizeName(item.name), category);
    }
    setActionItem(null);
  };

  const shareList = async () => {
    if (list.length === 0) return;
    const lines = ["🛒 Liste de courses", ""];
    for (const section of groupItems(list)) {
      lines.push(`— ${section.title} —`);
      for (const item of section.data) lines.push(`• ${formatItem(item)}`);
      lines.push("");
    }
    const text = lines.join("\n").trim();

    if (Platform.OS === "web") {
      try {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ text });
        } else if (
          typeof navigator !== "undefined" &&
          navigator.clipboard?.writeText
        ) {
          await navigator.clipboard.writeText(text);
          Alert.alert("Copié", "Liste copiée dans le presse-papier.");
        } else {
          Alert.alert("Liste de courses", text);
        }
      } catch (e) {
        if (e?.name !== "AbortError") Alert.alert("Liste de courses", text);
      }
      return;
    }

    try {
      await Share.share({ message: text });
    } catch (e) {
      Alert.alert("Partage impossible", String(e?.message || e));
    }
  };

  const isEmpty = list.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Barre d'ajout d'article libre */}
      <View style={styles.addBar}>
        <TextInput
          style={styles.addInput}
          value={draft}
          onChangeText={setDraft}
          placeholder="Ajouter un article (ex. lessive, café…)"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          onSubmitEditing={addManualItem}
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={addManualItem}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={56} color={colors.border} />
          <Text style={styles.emptyTitle}>Liste vide</Text>
          <Text style={styles.emptyText}>
            Cochez des repas dans l'onglet Semaine puis « Générer la liste »,
            ou ajoutez un article ci-dessus.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <ShoppingItem
              item={item}
              onToggle={() => toggleItem(item.id)}
              onMore={() => setActionItem(item)}
            />
          )}
        />
      )}

      {!isEmpty && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.secondaryBtn]}
            onPress={uncheckAll}
            activeOpacity={0.85}
          >
            <Ionicons name="square-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryText}>Tout décocher</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={shareList}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social-outline" size={18} color={colors.white} />
            <Text style={styles.primaryText}>Partager</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu d'action d'un article : changer de rayon / supprimer */}
      <Modal
        visible={!!actionItem}
        animationType="slide"
        transparent
        onRequestClose={() => setActionItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {actionItem?.name}
              </Text>
              <TouchableOpacity onPress={() => setActionItem(null)}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Ranger dans</Text>
            <View style={styles.catWrap}>
              {CATEGORIES.map((cat) => {
                const active = actionItem?.category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => changeCategory(actionItem, cat)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        active && styles.catChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.deleteRow}
              onPress={() => removeItem(actionItem.id)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={styles.deleteText}>Retirer de la liste</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    marginRight: spacing.sm,
    fontFamily: fonts.regular,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  sectionHeader: {
    fontSize: 14,
    fontFamily: fonts.extrabold,
    color: colors.secondaryDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
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
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  footer: {
    flexDirection: "row",
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: spacing.sm,
  },
  primaryBtn: { backgroundColor: colors.primary },
  secondaryText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    marginLeft: spacing.sm,
  },
  primaryText: {
    color: colors.white,
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.extrabold,
    color: colors.text,
    flex: 1,
  },
  modalLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  catWrap: { flexDirection: "row", flexWrap: "wrap" },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  catChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  catChipText: { fontSize: 14, color: colors.text, fontFamily: fonts.medium },
  catChipTextActive: { color: colors.white, fontFamily: fonts.bold },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  deleteText: {
    color: colors.danger,
    marginLeft: spacing.sm,
    fontFamily: fonts.semibold,
  },
});
