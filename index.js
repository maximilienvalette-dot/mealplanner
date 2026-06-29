// Point d'entrée Expo : enregistre le composant racine de l'application.
// registerRootComponent gère AppRegistry (natif) et le rendu DOM (web).
import { Platform } from "react-native";
import { registerRootComponent } from "expo";
import App from "./App";

// Web : on déclare que l'app n'existe qu'en thème clair, pour empêcher le
// "thème sombre automatique" de Chrome/Android d'inverser nos couleurs.
if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.style.colorScheme = "only light";
  const meta = document.createElement("meta");
  meta.name = "color-scheme";
  meta.content = "only light";
  document.head.appendChild(meta);
}

registerRootComponent(App);
