// Point d'entrée Expo : enregistre le composant racine de l'application.
// registerRootComponent gère AppRegistry (natif) et le rendu DOM (web).
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
