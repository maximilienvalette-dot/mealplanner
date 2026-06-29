// Post-export : ajuste le <head> du HTML généré par Expo pour le web.
//   1) <meta name="color-scheme" content="only light"> -> désactive le thème
//      sombre automatique de Chrome dès le premier rendu.
//   2) viewport-fit=cover dans le <meta viewport> -> active les valeurs
//      env(safe-area-inset-*), nécessaires pour que la barre d'onglets ne soit
//      pas rognée par la barre de gestes en PWA plein écran.

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

// 2) viewport-fit=cover
if (html.includes("viewport-fit=cover")) {
  console.log("inject-web-fixes: viewport-fit déjà présent");
} else {
  const before = html;
  // Ajoute viewport-fit=cover au contenu du meta viewport existant.
  html = html.replace(
    /(<meta\s+name=["']viewport["']\s+content=["'])([^"']*)(["'])/i,
    (m, p1, content, p3) => `${p1}${content}, viewport-fit=cover${p3}`
  );
  if (html === before) {
    // Pas de meta viewport trouvé : on en ajoute un.
    html = html.replace(
      "</head>",
      '  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />\n  </head>'
    );
  }
  console.log("inject-web-fixes: viewport-fit=cover ajouté");
}

fs.writeFileSync(file, html);
