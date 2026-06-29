// Point d'entrée : navigation par onglets (Recettes / Semaine / Courses).
// L'onglet Recettes contient une pile (liste -> ajout/édition).

import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
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

const tabLabelStyle = { fontFamily: fonts.semibold, fontSize: 11 };

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
    <NavigationContainer onReady={() => SplashScreen.hideAsync()}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          ...screenHeader,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: tabLabelStyle,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarIcon: ({ color, size }) => {
            const icons = {
              Recettes: "restaurant",
              Semaine: "calendar",
              Courses: "cart",
            };
            return (
              <Ionicons name={icons[route.name]} size={size} color={color} />
            );
          },
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
