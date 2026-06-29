// Post-export : ajuste le <head> du HTML généré par Expo pour le web.
//   1) <meta name="color-scheme" content="only light"> -> désactive le thème
//      sombre automatique de Chrome dès le premier rendu.
// La marge basse (barre de gestes) est gérée côté React Native (App.js).

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

// On NE met PAS viewport-fit=cover (il ferait dessiner le contenu sous la barre
// de gestes) ni de hack de hauteur : la marge basse est gérée dans la barre
// d'onglets elle-même (App.js).

fs.writeFileSync(file, html);
