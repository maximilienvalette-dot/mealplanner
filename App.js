// Point d'entrée : navigation par onglets (Recettes / Semaine / Courses).
// L'onglet Recettes contient une pile (liste -> ajout/édition).

import React from "react";
import { Platform, View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

import RecipesScreen from "./app/screens/RecipesScreen";
import AddRecipeScreen from "./app/screens/AddRecipeScreen";
import WeekScreen from "./app/screens/WeekScreen";
import ShoppingListScreen from "./app/screens/ShoppingListScreen";
import { colors, fonts } from "./app/theme";

// On garde le splash visible tant que les polices ne sont pas chargées.
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const RecipesStack = createNativeStackNavigator();

const screenHeader = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontFamily: fonts.extrabold, fontSize: 19 },
};

const TAB_ICONS = { Recettes: "restaurant", Semaine: "calendar", Courses: "cart" };
const TAB_LABELS = { Recettes: "Recettes", Semaine: "Semaine", Courses: "Courses" };

// On dessine nous-mêmes icône + libellé (au lieu du label intégré de
// react-navigation, qui fige une hauteur de texte erronée en web avec une
// police custom -> texte rogné). Ici, lineHeight maîtrisée = aucun clip.
function TabItem({ routeName, color }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 76 }}>
      <Ionicons name={TAB_ICONS[routeName]} size={22} color={color} />
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.semibold,
          fontSize: 11,
          lineHeight: 14,
          color,
          marginTop: 3,
        }}
      >
        {TAB_LABELS[routeName]}
      </Text>
    </View>
  );
}

function RecipesStackScreen() {
  return (
    <RecipesStack.Navigator screenOptions={screenHeader}>
      <RecipesStack.Screen
        name="RecipesList"
        component={RecipesScreen}
        options={{ title: "Mes recettes" }}
      />
      <RecipesStack.Screen
        name="AddRecipe"
        component={AddRecipeScreen}
        options={{ title: "Nouvelle recette" }}
      />
    </RecipesStack.Navigator>
  );
}

// Sur mobile web (navigateur ET PWA), la barre de gestes du système recouvre
// les ~24-34 derniers pixels de la fenêtre, ce qui rogne les libellés de la
// barre d'onglets. env(safe-area-inset-bottom) n'est pas fiable sur Android,
// donc on réserve une marge fixe dès qu'on est sur un appareil tactile.
function isWebTouch() {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

function AppContent() {
  // Marge de sécurité du bas ajoutée à la barre d'onglets pour que les
  // libellés ne soient jamais rognés par la barre de gestes / home indicator.
  //  - natif : inset réel de l'appareil ;
  //  - mobile web (onglet ou PWA) : 34px fixes ;
  //  - desktop web : 0.
  const insets = useSafeAreaInsets();
  const bottomInset =
    Platform.OS === "web" ? (isWebTouch() ? 24 : 0) : insets.bottom;

  return (
    <NavigationContainer onReady={() => SplashScreen.hideAsync()}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          ...screenHeader,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 52 + bottomInset,
            paddingBottom: bottomInset + 6,
            paddingTop: 6,
          },
          tabBarIcon: ({ color }) => (
            <TabItem routeName={route.name} color={color} />
          ),
        })}
      >
        <Tab.Screen
          name="Recettes"
          component={RecipesStackScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Semaine"
          component={WeekScreen}
          options={{ title: "Ma semaine" }}
        />
        <Tab.Screen
          name="Courses"
          component={ShoppingListScreen}
          options={{ title: "Liste de courses" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
