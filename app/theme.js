// Palette chaleureuse liée à la nourriture (thème clair).

export const colors = {
  primary: "#E8743B", // orange chaud
  primaryDark: "#C85A28",
  secondary: "#4C9A5B", // vert herbe
  secondaryDark: "#3B7A47",
  accent: "#F2B705", // jaune doré

  background: "#FFF8F0", // crème
  surface: "#FFFFFF",
  card: "#FFFFFF",

  text: "#2E2A26",
  textMuted: "#8A8178",
  border: "#EFE3D6",

  success: "#4C9A5B",
  danger: "#D9534F",
  checked: "#4C9A5B",

  white: "#FFFFFF",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// Rayons généreux pour un rendu moderne et arrondi.
export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
};

// Police Plus Jakarta Sans (chargée dans App.js). Sur Android, chaque graisse
// est une famille distincte : on mappe donc la graisse à la bonne famille.
export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
};
