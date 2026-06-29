// Post-export : ajuste le <head> du HTML généré par Expo pour le web.
//   1) <meta name="color-scheme" content="only light"> -> désactive le thème
//      sombre automatique de Chrome dès le premier rendu.
//   2) <style> height:100svh -> borne l'app à la hauteur visible (évite que le
//      bas passe sous le bord de l'écran sur mobile).
// La marge basse en PWA installée est gérée côté React Native (App.js).

import fs from "fs";

const file = "dist/index.html";

if (!fs.existsSync(file)) {
  console.error(`inject-web-fixes: ${file} introuvable`);
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");

// 1) color-scheme only light
if (html.includes('name="color-scheme"')) {
  console.log("inject-web-fixes: color-scheme déjà présent");
} else {
  html = html.replace(
    "</head>",
    '  <meta name="color-scheme" content="only light" />\n  </head>'
  );
  console.log("inject-web-fixes: color-scheme only light injecté");
}

// 2) On NE met PAS viewport-fit=cover : il fait dessiner le contenu sous la
// barre de gestes (et rogne la barre d'onglets). La marge basse en PWA est
// gérée côté React Native (App.js, détection display-mode standalone).

// 3) Hauteur de viewport sûre (ne dépend pas de la lib safe-area,
// qui ne renvoie pas l'inset en web). On réserve la hauteur de la barre de
// gestes sous le conteneur racine -> la barre d'onglets n'est plus rognée.
if (html.includes("id=\"safe-area-fix\"")) {
  console.log("inject-web-fixes: style safe-area déjà présent");
} else {
  html = html.replace(
    "</head>",
    `  <style id="safe-area-fix">
    /* 100svh = hauteur de viewport "sûre" (exclut l'UI navigateur) : évite que
       le bas de l'app (barre d'onglets) passe sous le bord visible sur mobile.
       Pas de padding ni de fond ajouté ici, pour ne créer aucune bande. */
    html, body { height: 100svh; }
    #root { height: 100vh; height: 100svh; }
  </style>\n  </head>`
  );
  console.log("inject-web-fixes: hauteur 100svh injectée sur html/body/#root");
}

fs.writeFileSync(file, html);
